package cron

import (
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/focused-answer-writing/backend/internal/llm"
)

const questionsPerDay = 2
const daysAhead = 7

// EnsureQuestionsForNextDays ensures each of the next N days has exactly 2 UPSC questions.
// If GENERATE_CHATGPT_QUESTIONS is true and a day has no questions, generates them via OpenAI.
func EnsureQuestionsForNextDays(db *sql.DB) {
	generateViaChatGPT := os.Getenv("GENERATE_CHATGPT_QUESTIONS") == "true" || os.Getenv("GENERATE_CHATGPT_QUESTIONS") == "1"
	openAIKey := os.Getenv("OPENAI_API_KEY")

	for dayOffset := 0; dayOffset < daysAhead; dayOffset++ {
		targetDate := time.Now().AddDate(0, 0, dayOffset)
		dateStr := targetDate.Format("2006-01-02")

		var count int
		err := db.QueryRow(
			`SELECT COUNT(*) FROM daily_questions WHERE date = $1`,
			dateStr,
		).Scan(&count)
		if err != nil {
			log.Printf("[cron] failed to count daily_questions for %s: %v", dateStr, err)
			continue
		}

		if count >= questionsPerDay {
			continue
		}

		needed := questionsPerDay - count
		if needed <= 0 {
			continue
		}

		if generateViaChatGPT && openAIKey != "" {
			// Generate via ChatGPT
			client := llm.NewOpenAIClient()
			generated, err := client.GenerateUPSCQuestions(needed)
			if err != nil {
				log.Printf("[cron] OpenAI generation failed for %s: %v", dateStr, err)
				assignExistingQuestionsToDate(db, dateStr, needed)
				continue
			}
			for i, gq := range generated {
				qID, err := insertQuestion(db, gq)
				if err != nil {
					log.Printf("[cron] insert question failed: %v", err)
					continue
				}
				order := count + i + 1
				if err := insertDailyQuestion(db, qID, dateStr, order); err != nil {
					log.Printf("[cron] insert daily_question failed: %v", err)
				}
			}
			log.Printf("[cron] generated %d questions for %s via ChatGPT", len(generated), dateStr)
		} else {
			assignExistingQuestionsToDate(db, dateStr, needed)
		}
	}
}

func insertQuestion(db *sql.DB, gq llm.GeneratedQuestion) (int, error) {
	var id int
	err := db.QueryRow(
		`INSERT INTO questions (title, content, category, difficulty, marks, word_limit, subject) 
		 VALUES ($1, $2, $3, 'medium', $4, $5, $6) RETURNING id`,
		gq.Title, gq.Content, gq.Category, gq.Marks, gq.WordLimit, gq.Category,
	).Scan(&id)
	return id, err
}

func insertDailyQuestion(db *sql.DB, questionID int, date string, order int) error {
	_, err := db.Exec(
		`INSERT INTO daily_questions (question_id, date, question_order) VALUES ($1, $2, $3) 
		 ON CONFLICT (date, question_order) DO NOTHING`,
		questionID, date, order,
	)
	return err
}

// assignExistingQuestionsToDate assigns up to `limit` existing questions to the given date
// (for days that have no questions and when ChatGPT is disabled).
// startOrder is the first question_order to use (e.g. if 1 question already exists, start at 2).
func assignExistingQuestionsToDate(db *sql.DB, dateStr string, limit int) {
	var existingMax int
	_ = db.QueryRow(`SELECT COALESCE(MAX(question_order), 0) FROM daily_questions WHERE date = $1`, dateStr).Scan(&existingMax)
	startOrder := existingMax + 1

	rows, err := db.Query(
		`SELECT id FROM questions WHERE is_active = TRUE 
		 AND id NOT IN (SELECT question_id FROM daily_questions WHERE date = $1)
		 ORDER BY RANDOM() LIMIT $2`,
		dateStr, limit,
	)
	if err != nil {
		log.Printf("[cron] assign existing questions: %v", err)
		return
	}
	defer rows.Close()

	order := startOrder
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			continue
		}
		_ = insertDailyQuestion(db, id, dateStr, order)
		order++
	}
}
