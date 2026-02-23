package database

import (
	"database/sql"
	"log"
)

// Migrate runs all database migrations
func Migrate(db *sql.DB) error {
	migrations := []string{
		// Users table
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			name VARCHAR(255) NOT NULL,
			avatar_url VARCHAR(500),
			is_admin BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// User streaks table
		`CREATE TABLE IF NOT EXISTS user_streaks (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			current_streak INTEGER DEFAULT 0,
			longest_streak INTEGER DEFAULT 0,
			total_days_completed INTEGER DEFAULT 0,
			last_completed_date DATE,
			streak_freeze_count INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id)
		)`,

		// Questions table
		`CREATE TABLE IF NOT EXISTS questions (
			id SERIAL PRIMARY KEY,
			title VARCHAR(500) NOT NULL,
			content TEXT NOT NULL,
			category VARCHAR(100) NOT NULL,
			difficulty VARCHAR(50) DEFAULT 'medium',
			subject VARCHAR(100),
			year INTEGER,
			marks INTEGER DEFAULT 15,
			word_limit INTEGER DEFAULT 250,
			is_active BOOLEAN DEFAULT TRUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Daily questions assignment table
		`CREATE TABLE IF NOT EXISTS daily_questions (
			id SERIAL PRIMARY KEY,
			question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
			date DATE NOT NULL,
			question_order INTEGER DEFAULT 1,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(date, question_order)
		)`,

		// User sessions table
		`CREATE TABLE IF NOT EXISTS user_sessions (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
			started_at TIMESTAMP NOT NULL,
			completed_at TIMESTAMP,
			status VARCHAR(50) DEFAULT 'in_progress',
			time_spent_seconds INTEGER,
			session_date DATE NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Streak history table
		`CREATE TABLE IF NOT EXISTS streak_history (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			date DATE NOT NULL,
			questions_completed INTEGER DEFAULT 0,
			total_time_seconds INTEGER DEFAULT 0,
			streak_count INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, date)
		)`,

		// Refresh tokens table
		`CREATE TABLE IF NOT EXISTS refresh_tokens (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			token VARCHAR(500) NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Create indexes
		`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_user_sessions_date ON user_sessions(session_date)`,
		`CREATE INDEX IF NOT EXISTS idx_daily_questions_date ON daily_questions(date)`,
		`CREATE INDEX IF NOT EXISTS idx_streak_history_user_date ON streak_history(user_id, date)`,
	}

	for i, migration := range migrations {
		_, err := db.Exec(migration)
		if err != nil {
			log.Printf("Migration %d failed: %v", i+1, err)
			return err
		}
	}

	log.Println("✅ Database migrations completed successfully")

	// Seed sample questions if none exist
	if err := seedQuestions(db); err != nil {
		log.Printf("Warning: Failed to seed questions: %v", err)
	}

	return nil
}

// seedQuestions adds sample UPSC questions if the table is empty
func seedQuestions(db *sql.DB) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM questions").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Questions already exist
	}

	sampleQuestions := []struct {
		title      string
		content    string
		category   string
		difficulty string
		subject    string
		marks      int
		wordLimit  int
	}{
		{
			title:      "Fundamental Rights vs Directive Principles",
			content:    "Discuss the relationship between Fundamental Rights and Directive Principles of State Policy. How has the judiciary balanced these two in its interpretations?",
			category:   "Polity",
			difficulty: "medium",
			subject:    "Indian Constitution",
			marks:      15,
			wordLimit:  250,
		},
		{
			title:      "Climate Change and Indian Agriculture",
			content:    "Examine the impact of climate change on Indian agriculture. What measures can be taken to make Indian agriculture climate-resilient?",
			category:   "Environment",
			difficulty: "medium",
			subject:    "Environment and Ecology",
			marks:      15,
			wordLimit:  250,
		},
		{
			title:      "Digital India Initiative",
			content:    "Critically analyze the Digital India initiative. How has it contributed to governance reforms and citizen empowerment?",
			category:   "Governance",
			difficulty: "easy",
			subject:    "Governance",
			marks:      15,
			wordLimit:  250,
		},
		{
			title:      "Ancient Indian Trade Routes",
			content:    "Discuss the significance of ancient Indian trade routes in the cultural and economic exchange between India and other civilizations.",
			category:   "History",
			difficulty: "medium",
			subject:    "Ancient History",
			marks:      15,
			wordLimit:  250,
		},
		{
			title:      "Women Empowerment Schemes",
			content:    "Evaluate the effectiveness of various government schemes aimed at women empowerment in India. Suggest measures for improvement.",
			category:   "Social Issues",
			difficulty: "easy",
			subject:    "Social Issues",
			marks:      15,
			wordLimit:  250,
		},
		{
			title:      "India's Foreign Policy Challenges",
			content:    "Discuss the major challenges faced by India's foreign policy in the current geopolitical scenario. How should India navigate these challenges?",
			category:   "International Relations",
			difficulty: "hard",
			subject:    "International Relations",
			marks:      15,
			wordLimit:  250,
		},
		{
			title:      "Economic Reforms Since 1991",
			content:    "Analyze the economic reforms undertaken since 1991 in India. What have been their successes and failures?",
			category:   "Economy",
			difficulty: "medium",
			subject:    "Indian Economy",
			marks:      15,
			wordLimit:  250,
		},
		{
			title:      "Ethics in Public Administration",
			content:    "What do you understand by 'conflict of interest' in public administration? Discuss with suitable examples how such conflicts can be managed.",
			category:   "Ethics",
			difficulty: "medium",
			subject:    "Ethics",
			marks:      15,
			wordLimit:  250,
		},
	}

	for _, q := range sampleQuestions {
		_, err := db.Exec(
			`INSERT INTO questions (title, content, category, difficulty, subject, marks, word_limit) 
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			q.title, q.content, q.category, q.difficulty, q.subject, q.marks, q.wordLimit,
		)
		if err != nil {
			return err
		}
	}

	// Assign 2 questions for today (UPSC: 2 questions per day)
	_, err = db.Exec(`
		INSERT INTO daily_questions (question_id, date, question_order)
		SELECT id, CURRENT_DATE, ROW_NUMBER() OVER (ORDER BY id)::integer
		FROM questions
		WHERE is_active = TRUE
		LIMIT 2
		ON CONFLICT (date, question_order) DO NOTHING
	`)

	log.Println("✅ Sample questions seeded successfully")
	return err
}
