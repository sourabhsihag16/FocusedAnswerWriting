# FocusedAnswerWriting 📚✍️

A focused study application for Indian Civil Service (UPSC) exam preparation. Built to help aspirants maintain consistency through streak-based answer writing practice with zero distractions.

## 🎯 Features

- **Timed Answer Writing Sessions**: Structured flow with read → think → write phases
- **Streak System**: Track daily consistency and build study habits
- **Focus Mode**: Block distractions during practice sessions (mobile)
- **Cross-Platform**: Web, iOS, and Android support
- **Beautiful UI**: Engaging, modern interface to keep you motivated

## 📁 Project Structure

```
FocusedAnswerWriting/
├── apps/
│   ├── backend/          # Go REST API
│   ├── web/              # React web application
│   └── mobile/           # React Native mobile app
├── packages/
│   └── shared/           # Shared types and utilities
├── docker/               # Docker configurations
└── docs/                 # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Go 1.21+
- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Quick Start with Docker

```bash
# Clone and start all services
docker-compose up -d

# Web app will be available at http://localhost:3000
# API will be available at http://localhost:8080
```

### Manual Setup

#### 1. Backend

```bash
cd apps/backend
cp .env.example .env
# Edit .env with your database credentials
go mod download
go run cmd/server/main.go
```

#### 2. Web App

```bash
cd apps/web
pnpm install
pnpm dev
```

#### 3. Mobile App

```bash
cd apps/mobile
pnpm install
pnpm ios     # For iOS
pnpm android # For Android
```

## 📖 Answer Writing Flow

Each session follows this structured flow:

1. **📖 Read Phase (20 seconds)**: Question appears, read and understand
2. **🤔 Think Phase (30 seconds)**: Plan your answer structure
3. **✍️ Write Phase (5 minutes)**: Write on paper (last 30 sec has warning beep)
4. **🔔 Next Question**: Beep signals completion, next question loads

## 🔥 Streak System

- Complete daily questions to maintain your streak
- Visual streak counter and calendar
- Motivational messages and achievements
- Streak freeze options (coming soon)

## 🛠️ Tech Stack

- **Backend**: Go, Gin, PostgreSQL, JWT Auth
- **Web**: React, TypeScript, Tailwind CSS, Framer Motion
- **Mobile**: React Native, Expo
- **Infrastructure**: Docker, Nginx

## 📱 Focus Mode (Mobile)

The mobile app activates Focus Mode during sessions:
- Blocks notifications from other apps
- Prevents app switching
- Audio cues for phase transitions
- Haptic feedback for better awareness

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

MIT License - feel free to use this for your own study needs!

---

Made with ❤️ for UPSC aspirants. Stay focused, stay consistent! 🇮🇳
