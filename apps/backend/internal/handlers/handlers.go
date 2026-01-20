package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/focused-answer-writing/backend/internal/middleware"
	"github.com/focused-answer-writing/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	db *sql.DB
}

// NewHandler creates a new Handler instance
func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// ==================== Auth Handlers ====================

// Register handles user registration
func (h *Handler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email exists
	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	var user models.User
	err = h.db.QueryRow(
		`INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) 
		 RETURNING id, email, name, avatar_url, is_admin, created_at, updated_at`,
		req.Email, string(hashedPassword), req.Name,
	).Scan(&user.ID, &user.Email, &user.Name, &user.AvatarURL, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Initialize user streak
	_, err = h.db.Exec(
		`INSERT INTO user_streaks (user_id) VALUES ($1)`,
		user.ID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize streak"})
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    3600, // 1 hour
	})
}

// Login handles user login
func (h *Handler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user
	var user models.User
	err := h.db.QueryRow(
		`SELECT id, email, password_hash, name, avatar_url, is_admin, created_at, updated_at 
		 FROM users WHERE email = $1`,
		req.Email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.AvatarURL, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    3600,
	})
}

// RefreshToken handles token refresh
func (h *Handler) RefreshToken(c *gin.Context) {
	var req models.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify refresh token
	var userID int
	var expiresAt time.Time
	err := h.db.QueryRow(
		`SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1`,
		req.RefreshToken,
	).Scan(&userID, &expiresAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if time.Now().After(expiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token expired"})
		return
	}

	// Get user
	var user models.User
	err = h.db.QueryRow(
		`SELECT id, email, name, avatar_url, is_admin, created_at, updated_at FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.AvatarURL, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	// Delete old refresh token
	h.db.Exec("DELETE FROM refresh_tokens WHERE token = $1", req.RefreshToken)

	// Generate new tokens
	accessToken, refreshToken, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    3600,
	})
}

// ==================== User Handlers ====================

// GetCurrentUser returns the current user's profile
func (h *Handler) GetCurrentUser(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var user models.User
	err := h.db.QueryRow(
		`SELECT id, email, name, avatar_url, is_admin, created_at, updated_at FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.AvatarURL, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfile updates the user's profile
func (h *Handler) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := h.db.Exec(
		`UPDATE users SET name = COALESCE(NULLIF($1, ''), name), avatar_url = $2, updated_at = NOW() WHERE id = $3`,
		req.Name, req.AvatarURL, userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// ==================== Streak Handlers ====================

// GetStreak returns the user's current streak
func (h *Handler) GetStreak(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var streak models.UserStreak
	err := h.db.QueryRow(
		`SELECT id, user_id, current_streak, longest_streak, total_days_completed, 
		        last_completed_date, streak_freeze_count, created_at, updated_at 
		 FROM user_streaks WHERE user_id = $1`,
		userID,
	).Scan(&streak.ID, &streak.UserID, &streak.CurrentStreak, &streak.LongestStreak,
		&streak.TotalDaysCompleted, &streak.LastCompletedDate, &streak.StreakFreezeCount,
		&streak.CreatedAt, &streak.UpdatedAt)

	if err == sql.ErrNoRows {
		// Create streak if doesn't exist
		h.db.Exec(`INSERT INTO user_streaks (user_id) VALUES ($1)`, userID)
		streak = models.UserStreak{UserID: userID}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, streak)
}

// CompleteDay marks today as completed and updates streak
func (h *Handler) CompleteDay(c *gin.Context) {
	userID := middleware.GetUserID(c)
	today := time.Now().Format("2006-01-02")

	// Check if already completed today
	var exists bool
	h.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM streak_history WHERE user_id = $1 AND date = $2)`,
		userID, today,
	).Scan(&exists)

	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Already completed today"})
		return
	}

	// Get current streak
	var streak models.UserStreak
	var lastDate *time.Time
	h.db.QueryRow(
		`SELECT current_streak, longest_streak, last_completed_date FROM user_streaks WHERE user_id = $1`,
		userID,
	).Scan(&streak.CurrentStreak, &streak.LongestStreak, &lastDate)

	// Calculate new streak
	newStreak := 1
	if lastDate != nil {
		yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
		if lastDate.Format("2006-01-02") == yesterday {
			newStreak = streak.CurrentStreak + 1
		}
	}

	longestStreak := streak.LongestStreak
	if newStreak > longestStreak {
		longestStreak = newStreak
	}

	// Update streak
	_, err := h.db.Exec(
		`UPDATE user_streaks SET 
			current_streak = $1, 
			longest_streak = $2, 
			total_days_completed = total_days_completed + 1,
			last_completed_date = $3,
			updated_at = NOW()
		 WHERE user_id = $4`,
		newStreak, longestStreak, today, userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update streak"})
		return
	}

	// Add to streak history
	h.db.Exec(
		`INSERT INTO streak_history (user_id, date, streak_count) VALUES ($1, $2, $3)`,
		userID, today, newStreak,
	)

	c.JSON(http.StatusOK, gin.H{
		"current_streak": newStreak,
		"longest_streak": longestStreak,
		"message":        "Great job! Keep the streak going! 🔥",
	})
}

// GetStreakHistory returns the user's streak history
func (h *Handler) GetStreakHistory(c *gin.Context) {
	userID := middleware.GetUserID(c)

	rows, err := h.db.Query(
		`SELECT date, questions_completed, total_time_seconds, streak_count 
		 FROM streak_history WHERE user_id = $1 ORDER BY date DESC LIMIT 30`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var history []models.StreakHistory
	for rows.Next() {
		var h models.StreakHistory
		h.UserID = userID
		if err := rows.Scan(&h.Date, &h.QuestionsCompleted, &h.TotalTimeSeconds, &h.StreakCount); err != nil {
			continue
		}
		history = append(history, h)
	}

	c.JSON(http.StatusOK, history)
}

// ==================== Question Handlers ====================

// GetTodayQuestions returns questions for today
func (h *Handler) GetTodayQuestions(c *gin.Context) {
	userID := middleware.GetUserID(c)
	today := time.Now().Format("2006-01-02")

	// Get today's questions
	rows, err := h.db.Query(
		`SELECT q.id, q.title, q.content, q.category, q.difficulty, q.subject, 
		        q.year, q.marks, q.word_limit
		 FROM daily_questions dq
		 JOIN questions q ON dq.question_id = q.id
		 WHERE dq.date = $1 AND q.is_active = TRUE
		 ORDER BY dq.question_order`,
		today,
	)

	// If no questions for today, get random questions
	if err != nil || rows == nil {
		rows, err = h.db.Query(
			`SELECT id, title, content, category, difficulty, subject, year, marks, word_limit
			 FROM questions WHERE is_active = TRUE ORDER BY RANDOM() LIMIT 5`,
		)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var questions []models.Question
	for rows.Next() {
		var q models.Question
		if err := rows.Scan(&q.ID, &q.Title, &q.Content, &q.Category, &q.Difficulty,
			&q.Subject, &q.Year, &q.Marks, &q.WordLimit); err != nil {
			continue
		}
		questions = append(questions, q)
	}

	// Get completed count
	var completedCount int
	h.db.QueryRow(
		`SELECT COUNT(*) FROM user_sessions WHERE user_id = $1 AND session_date = $2 AND status = 'completed'`,
		userID, today,
	).Scan(&completedCount)

	// Get current streak
	var currentStreak int
	h.db.QueryRow(`SELECT current_streak FROM user_streaks WHERE user_id = $1`, userID).Scan(&currentStreak)

	c.JSON(http.StatusOK, models.TodayQuestionsResponse{
		Date:           today,
		Questions:      questions,
		CompletedCount: completedCount,
		TotalCount:     len(questions),
		TodayCompleted: completedCount >= len(questions),
		CurrentStreak:  currentStreak,
	})
}

// GetQuestion returns a specific question
func (h *Handler) GetQuestion(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	var q models.Question
	err = h.db.QueryRow(
		`SELECT id, title, content, category, difficulty, subject, year, marks, word_limit 
		 FROM questions WHERE id = $1 AND is_active = TRUE`,
		id,
	).Scan(&q.ID, &q.Title, &q.Content, &q.Category, &q.Difficulty,
		&q.Subject, &q.Year, &q.Marks, &q.WordLimit)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Include session config
	c.JSON(http.StatusOK, gin.H{
		"question":       q,
		"session_config": models.DefaultSessionConfig(),
	})
}

// ==================== Session Handlers ====================

// StartSession starts a new answer writing session
func (h *Handler) StartSession(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.StartSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	today := time.Now().Format("2006-01-02")

	// Check for existing incomplete session
	var existingID int
	err := h.db.QueryRow(
		`SELECT id FROM user_sessions WHERE user_id = $1 AND question_id = $2 AND session_date = $3 AND status = 'in_progress'`,
		userID, req.QuestionID, today,
	).Scan(&existingID)

	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Session already in progress", "session_id": existingID})
		return
	}

	// Create new session
	var sessionID int
	err = h.db.QueryRow(
		`INSERT INTO user_sessions (user_id, question_id, started_at, session_date, status) 
		 VALUES ($1, $2, NOW(), $3, 'in_progress') RETURNING id`,
		userID, req.QuestionID, today,
	).Scan(&sessionID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start session"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"session_id":     sessionID,
		"started_at":     time.Now(),
		"session_config": models.DefaultSessionConfig(),
	})
}

// CompleteSession completes an answer writing session
func (h *Handler) CompleteSession(c *gin.Context) {
	userID := middleware.GetUserID(c)
	sessionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	var req models.CompleteSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update session
	result, err := h.db.Exec(
		`UPDATE user_sessions SET 
			completed_at = NOW(), 
			status = 'completed',
			time_spent_seconds = $1
		 WHERE id = $2 AND user_id = $3 AND status = 'in_progress'`,
		req.TimeSpentSeconds, sessionID, userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete session"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found or already completed"})
		return
	}

	// Update streak history
	today := time.Now().Format("2006-01-02")
	h.db.Exec(
		`INSERT INTO streak_history (user_id, date, questions_completed, total_time_seconds) 
		 VALUES ($1, $2, 1, $3)
		 ON CONFLICT (user_id, date) 
		 DO UPDATE SET questions_completed = streak_history.questions_completed + 1,
		               total_time_seconds = streak_history.total_time_seconds + $3`,
		userID, today, req.TimeSpentSeconds,
	)

	c.JSON(http.StatusOK, gin.H{
		"message":            "Session completed successfully! 🎉",
		"time_spent_seconds": req.TimeSpentSeconds,
	})
}

// GetSessionHistory returns user's session history
func (h *Handler) GetSessionHistory(c *gin.Context) {
	userID := middleware.GetUserID(c)

	rows, err := h.db.Query(
		`SELECT s.id, s.question_id, s.started_at, s.completed_at, s.status, s.time_spent_seconds, s.session_date,
		        q.title, q.category
		 FROM user_sessions s
		 JOIN questions q ON s.question_id = q.id
		 WHERE s.user_id = $1
		 ORDER BY s.started_at DESC
		 LIMIT 50`,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	type SessionWithQuestion struct {
		models.UserSession
		QuestionTitle    string `json:"question_title"`
		QuestionCategory string `json:"question_category"`
	}

	var sessions []SessionWithQuestion
	for rows.Next() {
		var s SessionWithQuestion
		if err := rows.Scan(&s.ID, &s.QuestionID, &s.StartedAt, &s.CompletedAt, &s.Status,
			&s.TimeSpentSeconds, &s.SessionDate, &s.QuestionTitle, &s.QuestionCategory); err != nil {
			continue
		}
		sessions = append(sessions, s)
	}

	c.JSON(http.StatusOK, sessions)
}

// ==================== Progress Handlers ====================

// GetProgressStats returns user's progress statistics
func (h *Handler) GetProgressStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var stats models.ProgressStats

	// Get total sessions and time
	h.db.QueryRow(
		`SELECT COUNT(*), COALESCE(SUM(time_spent_seconds), 0) 
		 FROM user_sessions WHERE user_id = $1 AND status = 'completed'`,
		userID,
	).Scan(&stats.TotalSessions, &stats.TotalTimeMinutes)

	stats.TotalTimeMinutes = stats.TotalTimeMinutes / 60

	if stats.TotalSessions > 0 {
		stats.AverageTimeMinutes = float64(stats.TotalTimeMinutes) / float64(stats.TotalSessions)
	}

	// Get streak info
	h.db.QueryRow(
		`SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = $1`,
		userID,
	).Scan(&stats.CurrentStreak, &stats.LongestStreak)

	// Get this week's questions
	h.db.QueryRow(
		`SELECT COUNT(*) FROM user_sessions 
		 WHERE user_id = $1 AND status = 'completed' 
		 AND session_date >= CURRENT_DATE - INTERVAL '7 days'`,
		userID,
	).Scan(&stats.QuestionsThisWeek)

	// Get this month's questions
	h.db.QueryRow(
		`SELECT COUNT(*) FROM user_sessions 
		 WHERE user_id = $1 AND status = 'completed' 
		 AND session_date >= DATE_TRUNC('month', CURRENT_DATE)`,
		userID,
	).Scan(&stats.QuestionsThisMonth)

	c.JSON(http.StatusOK, stats)
}

// GetCalendarData returns calendar data for the past months
func (h *Handler) GetCalendarData(c *gin.Context) {
	userID := middleware.GetUserID(c)

	rows, err := h.db.Query(
		`SELECT date, questions_completed, total_time_seconds 
		 FROM streak_history 
		 WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '90 days'
		 ORDER BY date`,
		userID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var calendar []models.CalendarDay
	for rows.Next() {
		var day models.CalendarDay
		var date time.Time
		var totalSeconds int
		if err := rows.Scan(&date, &day.QuestionsCompleted, &totalSeconds); err != nil {
			continue
		}
		day.Date = date.Format("2006-01-02")
		day.TotalTimeMinutes = totalSeconds / 60
		day.StreakActive = day.QuestionsCompleted > 0
		calendar = append(calendar, day)
	}

	c.JSON(http.StatusOK, calendar)
}

// ==================== Admin Handlers ====================

// CreateQuestion creates a new question (admin only)
func (h *Handler) CreateQuestion(c *gin.Context) {
	var req models.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Marks == 0 {
		req.Marks = 15
	}
	if req.WordLimit == 0 {
		req.WordLimit = 250
	}
	if req.Difficulty == "" {
		req.Difficulty = "medium"
	}

	var id int
	err := h.db.QueryRow(
		`INSERT INTO questions (title, content, category, difficulty, subject, year, marks, word_limit) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
		req.Title, req.Content, req.Category, req.Difficulty, req.Subject, req.Year, req.Marks, req.WordLimit,
	).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Question created successfully"})
}

// UpdateQuestion updates a question (admin only)
func (h *Handler) UpdateQuestion(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	var req models.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err = h.db.Exec(
		`UPDATE questions SET title = $1, content = $2, category = $3, difficulty = $4, 
		 subject = $5, year = $6, marks = $7, word_limit = $8, updated_at = NOW() WHERE id = $9`,
		req.Title, req.Content, req.Category, req.Difficulty, req.Subject, req.Year, req.Marks, req.WordLimit, id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Question updated successfully"})
}

// DeleteQuestion deletes a question (admin only)
func (h *Handler) DeleteQuestion(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID"})
		return
	}

	// Soft delete
	_, err = h.db.Exec(`UPDATE questions SET is_active = FALSE WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Question deleted successfully"})
}

// GetAllUsers returns all users (admin only)
func (h *Handler) GetAllUsers(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT u.id, u.email, u.name, u.is_admin, u.created_at, 
		        COALESCE(s.current_streak, 0), COALESCE(s.total_days_completed, 0)
		 FROM users u
		 LEFT JOIN user_streaks s ON u.id = s.user_id
		 ORDER BY u.created_at DESC`,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	type UserWithStreak struct {
		ID                 int       `json:"id"`
		Email              string    `json:"email"`
		Name               string    `json:"name"`
		IsAdmin            bool      `json:"is_admin"`
		CreatedAt          time.Time `json:"created_at"`
		CurrentStreak      int       `json:"current_streak"`
		TotalDaysCompleted int       `json:"total_days_completed"`
	}

	var users []UserWithStreak
	for rows.Next() {
		var u UserWithStreak
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.IsAdmin, &u.CreatedAt,
			&u.CurrentStreak, &u.TotalDaysCompleted); err != nil {
			continue
		}
		users = append(users, u)
	}

	c.JSON(http.StatusOK, users)
}

// ==================== Helper Functions ====================

func (h *Handler) generateTokens(user models.User) (string, string, error) {
	secret := []byte(getJWTSecret())

	// Access token (1 hour)
	accessClaims := middleware.Claims{
		UserID:  user.ID,
		Email:   user.Email,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(secret)
	if err != nil {
		return "", "", err
	}

	// Refresh token (7 days)
	refreshClaims := middleware.Claims{
		UserID: user.ID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(secret)
	if err != nil {
		return "", "", err
	}

	// Store refresh token
	_, err = h.db.Exec(
		`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
		user.ID, refreshTokenString, time.Now().Add(7*24*time.Hour),
	)
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "your-secret-key-change-in-production"
	}
	return secret
}
