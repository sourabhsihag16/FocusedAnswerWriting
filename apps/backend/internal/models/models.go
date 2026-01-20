package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	AvatarURL    *string   `json:"avatar_url"`
	IsAdmin      bool      `json:"is_admin"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// UserStreak represents a user's streak data
type UserStreak struct {
	ID                  int        `json:"id"`
	UserID              int        `json:"user_id"`
	CurrentStreak       int        `json:"current_streak"`
	LongestStreak       int        `json:"longest_streak"`
	TotalDaysCompleted  int        `json:"total_days_completed"`
	LastCompletedDate   *time.Time `json:"last_completed_date"`
	StreakFreezeCount   int        `json:"streak_freeze_count"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

// Question represents a practice question
type Question struct {
	ID         int       `json:"id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	Category   string    `json:"category"`
	Difficulty string    `json:"difficulty"`
	Subject    *string   `json:"subject"`
	Year       *int      `json:"year"`
	Marks      int       `json:"marks"`
	WordLimit  int       `json:"word_limit"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// DailyQuestion represents a question assigned for a specific day
type DailyQuestion struct {
	ID            int       `json:"id"`
	QuestionID    int       `json:"question_id"`
	Date          time.Time `json:"date"`
	QuestionOrder int       `json:"question_order"`
	Question      *Question `json:"question,omitempty"`
}

// UserSession represents a user's answer writing session
type UserSession struct {
	ID               int        `json:"id"`
	UserID           int        `json:"user_id"`
	QuestionID       int        `json:"question_id"`
	StartedAt        time.Time  `json:"started_at"`
	CompletedAt      *time.Time `json:"completed_at"`
	Status           string     `json:"status"` // in_progress, completed, abandoned
	TimeSpentSeconds *int       `json:"time_spent_seconds"`
	SessionDate      time.Time  `json:"session_date"`
	Question         *Question  `json:"question,omitempty"`
}

// StreakHistory represents daily streak history
type StreakHistory struct {
	ID                 int       `json:"id"`
	UserID             int       `json:"user_id"`
	Date               time.Time `json:"date"`
	QuestionsCompleted int       `json:"questions_completed"`
	TotalTimeSeconds   int       `json:"total_time_seconds"`
	StreakCount        int       `json:"streak_count"`
}

// Request/Response types

// RegisterRequest for user registration
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required,min=2"`
}

// LoginRequest for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse for authentication responses
type AuthResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// RefreshRequest for token refresh
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// UpdateProfileRequest for profile updates
type UpdateProfileRequest struct {
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url"`
}

// StartSessionRequest for starting a new session
type StartSessionRequest struct {
	QuestionID int `json:"question_id" binding:"required"`
}

// CompleteSessionRequest for completing a session
type CompleteSessionRequest struct {
	TimeSpentSeconds int `json:"time_spent_seconds" binding:"required"`
}

// CreateQuestionRequest for creating questions (admin)
type CreateQuestionRequest struct {
	Title      string  `json:"title" binding:"required"`
	Content    string  `json:"content" binding:"required"`
	Category   string  `json:"category" binding:"required"`
	Difficulty string  `json:"difficulty"`
	Subject    *string `json:"subject"`
	Year       *int    `json:"year"`
	Marks      int     `json:"marks"`
	WordLimit  int     `json:"word_limit"`
}

// ProgressStats represents user progress statistics
type ProgressStats struct {
	TotalSessions      int     `json:"total_sessions"`
	TotalTimeMinutes   int     `json:"total_time_minutes"`
	AverageTimeMinutes float64 `json:"average_time_minutes"`
	CurrentStreak      int     `json:"current_streak"`
	LongestStreak      int     `json:"longest_streak"`
	QuestionsThisWeek  int     `json:"questions_this_week"`
	QuestionsThisMonth int     `json:"questions_this_month"`
}

// CalendarDay represents a single day in the calendar
type CalendarDay struct {
	Date               string `json:"date"`
	QuestionsCompleted int    `json:"questions_completed"`
	TotalTimeMinutes   int    `json:"total_time_minutes"`
	StreakActive       bool   `json:"streak_active"`
}

// TodayQuestionsResponse for today's questions
type TodayQuestionsResponse struct {
	Date             string     `json:"date"`
	Questions        []Question `json:"questions"`
	CompletedCount   int        `json:"completed_count"`
	TotalCount       int        `json:"total_count"`
	TodayCompleted   bool       `json:"today_completed"`
	CurrentStreak    int        `json:"current_streak"`
}

// SessionConfig represents the timer configuration
type SessionConfig struct {
	ReadTimeSeconds    int `json:"read_time_seconds"`
	ThinkTimeSeconds   int `json:"think_time_seconds"`
	WriteTimeSeconds   int `json:"write_time_seconds"`
	WarningTimeSeconds int `json:"warning_time_seconds"`
}

// DefaultSessionConfig returns the default session configuration
func DefaultSessionConfig() SessionConfig {
	return SessionConfig{
		ReadTimeSeconds:    20,
		ThinkTimeSeconds:   30,
		WriteTimeSeconds:   300, // 5 minutes
		WarningTimeSeconds: 30,
	}
}
