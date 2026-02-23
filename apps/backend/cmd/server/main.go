package main

import (
	"log"
	"os"

	"github.com/focused-answer-writing/backend/internal/cron"
	"github.com/focused-answer-writing/backend/internal/database"
	"github.com/focused-answer-writing/backend/internal/handlers"
	"github.com/focused-answer-writing/backend/internal/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database
	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Ensure next 7 days have 2 questions each (only when using DB for questions, not spreadsheet)
	if os.Getenv("QUESTIONS_CSV_URL") == "" {
		go func() {
			cron.EnsureQuestionsForNextDays(db)
		}()
	}

	// Initialize handlers (optional QUESTIONS_CSV_URL = Google Sheet CSV for daily questions)
	h := handlers.NewHandler(db, os.Getenv("QUESTIONS_CSV_URL"))

	// Setup Gin router
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS configuration
	config := cors.DefaultConfig()
	// Allow all origins in development (for Expo, mobile devices, etc.)
	// In production, you should restrict this to specific domains
	if os.Getenv("APP_ENV") == "production" {
		config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:5173"}
	} else {
		config.AllowAllOrigins = true
	}
	config.AllowCredentials = true
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}
	r.Use(cors.New(config))

	// Health check (root level)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "focused-answer-writing-api"})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Health check (API level)
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "healthy", "service": "focused-answer-writing-api", "version": "v1"})
		})

		// Public question routes (no login required)
		v1.GET("/questions/today", h.GetTodayQuestionsPublic)
		v1.GET("/questions/:id", h.GetQuestion)

		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", h.Register)
			auth.POST("/login", h.Login)
			auth.POST("/refresh", h.RefreshToken)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// User routes
			protected.GET("/me", h.GetCurrentUser)
			protected.PUT("/me", h.UpdateProfile)

			// Streak routes
			protected.GET("/streak", h.GetStreak)
			protected.POST("/streak/complete", h.CompleteDay)
			protected.GET("/streak/history", h.GetStreakHistory)

			// Questions/today and questions/:id are registered as public routes above; no duplicate here.
			protected.POST("/sessions/start", h.StartSession)
			protected.POST("/sessions/:id/complete", h.CompleteSession)
			protected.GET("/sessions/history", h.GetSessionHistory)

			// Progress routes
			protected.GET("/progress/stats", h.GetProgressStats)
			protected.GET("/progress/calendar", h.GetCalendarData)
		}

		// Admin routes (protected + admin check)
		admin := v1.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
		{
			admin.POST("/questions", h.CreateQuestion)
			admin.PUT("/questions/:id", h.UpdateQuestion)
			admin.DELETE("/questions/:id", h.DeleteQuestion)
			admin.GET("/users", h.GetAllUsers)
		}
	}

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Bind to 0.0.0.0 to accept connections from all network interfaces
	// This is important for Docker and mobile device connections
	address := "0.0.0.0:" + port
	log.Printf("🚀 Server starting on %s", address)
	if err := r.Run(address); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
