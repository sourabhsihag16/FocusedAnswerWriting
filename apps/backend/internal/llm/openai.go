package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

const (
	openAIAPIURL = "https://api.openai.com/v1/chat/completions"
	defaultModel = "gpt-4o-mini"
)

// Client for OpenAI API (ChatGPT)
type Client struct {
	apiKey string
	model  string
	client *http.Client
}

// NewOpenAIClient creates a new OpenAI client
func NewOpenAIClient() *Client {
	apiKey := os.Getenv("OPENAI_API_KEY")
	model := os.Getenv("OPENAI_MODEL")
	if model == "" {
		model = defaultModel
	}
	return &Client{
		apiKey: apiKey,
		model:  model,
		client: &http.Client{Timeout: 60 * time.Second},
	}
}

// GenerateUPSCQuestionsRequest is the request body for OpenAI API
type GenerateUPSCQuestionsRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// GenerateUPSCQuestionsResponse is the raw API response
type GenerateUPSCQuestionsResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// GeneratedQuestion represents one parsed question from LLM output
type GeneratedQuestion struct {
	Title     string `json:"title"`
	Content   string `json:"content"`
	Category  string `json:"category"`
	Marks     int    `json:"marks"`
	WordLimit int    `json:"word_limit"`
}

var systemPrompt = `You are an expert UPSC (Union Public Service Commission) exam question setter for the Civil Services Examination (CSE) Mains.
Generate exactly 2 practice questions suitable for GS (General Studies) answer writing practice.
Return a valid JSON array of exactly 2 objects. Each object must have these exact keys:
- "title": string (short question title, max 100 chars)
- "content": string (full question text as it would appear in the exam)
- "category": string (one of: Polity, Economy, History, Geography, Environment, Science & Technology, International Relations, Internal Security, Ethics, Governance, Social Issues)
- "marks": number (10 or 15)
- "word_limit": number (150 or 250)

Example format:
[{"title":"Fundamental Rights","content":"Discuss...","category":"Polity","marks":15,"word_limit":250},{"title":"...","content":"...","category":"Economy","marks":15,"word_limit":250}]
Return ONLY the JSON array, no markdown or explanation.`

// GenerateUPSCQuestions calls OpenAI to generate 2 UPSC practice questions
func (c *Client) GenerateUPSCQuestions(count int) ([]GeneratedQuestion, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY is not set")
	}
	if count <= 0 {
		count = 2
	}

	userPrompt := fmt.Sprintf("Generate exactly %d UPSC Mains-style answer writing practice questions. Return only the JSON array.", count)

	reqBody := GenerateUPSCQuestionsRequest{
		Model: c.model,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, openAIAPIURL, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openai api returned status %d", resp.StatusCode)
	}

	var apiResp GenerateUPSCQuestionsResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	if len(apiResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	content := apiResp.Choices[0].Message.Content
	// Trim markdown code block if present
	content = trimJSONContent(content)

	var questions []GeneratedQuestion
	if err := json.Unmarshal([]byte(content), &questions); err != nil {
		return nil, fmt.Errorf("failed to parse OpenAI response as JSON: %w", err)
	}

	// Ensure defaults
	for i := range questions {
		if questions[i].Marks == 0 {
			questions[i].Marks = 15
		}
		if questions[i].WordLimit == 0 {
			questions[i].WordLimit = 250
		}
		if questions[i].Category == "" {
			questions[i].Category = "General Studies"
		}
	}

	return questions, nil
}

func trimJSONContent(s string) string {
	// Remove ```json and ``` if present
	const (
		prefix = "```json"
		suffix = "```"
	)
	b := []byte(s)
	if bytes.HasPrefix(bytes.TrimSpace(b), []byte(prefix)) {
		b = bytes.TrimSpace(bytes.TrimPrefix(bytes.TrimSpace(b), []byte(prefix)))
	}
	if bytes.HasSuffix(bytes.TrimSpace(b), []byte(suffix)) {
		b = bytes.TrimSpace(bytes.TrimSuffix(bytes.TrimSpace(b), []byte(suffix)))
	}
	return string(b)
}
