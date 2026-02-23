package questionsource

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/focused-answer-writing/backend/internal/models"
)

// Spreadsheet fetches daily questions from a published Google Sheet (CSV export).
// Expected columns: Date (YYYY-MM-DD), Question 1, Question 2
// Rows should be ordered by date (today, tomorrow, etc.).
const (
	defaultCategory   = "Practice"
	defaultDifficulty = "medium"
	defaultMarks      = 5
	defaultWordLimit  = 150
)

// FetchTodayFromCSV fetches the CSV from the given URL and returns today's two questions.
// CSV format: header row then rows with date, question_one, question_two.
func FetchTodayFromCSV(csvURL string) ([]models.Question, string, error) {
	if csvURL == "" {
		return nil, "", fmt.Errorf("QUESTIONS_CSV_URL is not set")
	}

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(csvURL)
	if err != nil {
		return nil, "", fmt.Errorf("fetch CSV: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("CSV URL returned status %d", resp.StatusCode)
	}

	reader := csv.NewReader(resp.Body)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, "", fmt.Errorf("parse CSV: %w", err)
	}

	if len(records) < 2 {
		return nil, "", fmt.Errorf("CSV has no data rows (need header + at least one row)")
	}

	today := time.Now().Format("2006-01-02")
	// First row is header (e.g. "Date", "Question 1", "Question 2")
	// We expect columns: 0 = date, 1 = question 1, 2 = question 2
	for _, row := range records[1:] {
		if len(row) < 3 {
			continue
		}
		dateStr := strings.TrimSpace(row[0])
		q1 := strings.TrimSpace(row[1])
		q2 := strings.TrimSpace(row[2])
		if dateStr == "" || q1 == "" || q2 == "" {
			continue
		}
		// Normalize date (in case spreadsheet has different format)
		parsed, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			// Try other common formats
			parsed, err = time.Parse("1/2/2006", dateStr)
			if err != nil {
				parsed, err = time.Parse("02-01-2006", dateStr)
			}
			if err != nil {
				continue
			}
		}
		if parsed.Format("2006-01-02") != today {
			continue
		}
		questions := []models.Question{
			{
				ID:         1,
				Title:      "Question 1",
				Content:    q1,
				Category:   defaultCategory,
				Difficulty: defaultDifficulty,
				Marks:      defaultMarks,
				WordLimit:  defaultWordLimit,
				IsActive:   true,
			},
			{
				ID:         2,
				Title:      "Question 2",
				Content:    q2,
				Category:   defaultCategory,
				Difficulty: defaultDifficulty,
				Marks:      defaultMarks,
				WordLimit:  defaultWordLimit,
				IsActive:   true,
			},
		}
		return questions, today, nil
	}

	return nil, today, fmt.Errorf("no row found for today's date %s", today)
}

// GetQuestionByID returns the question for today with the given id (1 or 2), or nil if not found.
func GetQuestionByID(csvURL string, id int) (*models.Question, error) {
	questions, _, err := FetchTodayFromCSV(csvURL)
	if err != nil {
		return nil, err
	}
	for i := range questions {
		if questions[i].ID == id {
			return &questions[i], nil
		}
	}
	return nil, fmt.Errorf("question %d not found for today", id)
}
