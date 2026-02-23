# FocusedAnswerWriting 📚✍️

A focused study application for Indian Civil Service (UPSC) exam preparation. Built to help aspirants maintain consistency through streak-based answer writing practice with zero distractions.

## 🎯 Features

- **No login required**: Visit the URL, see today’s questions. “Done for today” is stored in your browser (localStorage).
- **2 questions per day**: Each day has two UPSC-style questions (stored in DB; optional ChatGPT generation for missing days).
- **Timed Answer Writing Sessions**: Read (20s) → Think (30s) → Write (5 min) with phase beeps.
- **Focus mode**: When you start a session, the app goes full screen and warns if you switch tabs or leave the window.
- **Beautiful UI**: Engaging, modern interface for UPSC aspirants.

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

### Run with Docker (all applications)

From the repo root, run:

```bash
# Build and start Postgres, backend API, and web app
docker-compose up -d

# Optional: pass OpenAI env for question generation
# GENERATE_CHATGPT_QUESTIONS=true OPENAI_API_KEY=sk-... docker-compose up -d
```

| Service   | URL                     | Description                    |
|----------|--------------------------|--------------------------------|
| **Web**  | http://localhost:3000   | React app (Nginx); `/api` → backend |
| **API**  | http://localhost:8081   | Go backend (direct)            |
| **DB**   | localhost:5432          | PostgreSQL                     |

To rebuild after code changes:

```bash
docker-compose up -d --build
```

To stop:

```bash
docker-compose down
```

### Manual setup (without Docker)

**Environment:** Backend uses `apps/backend/.env` (copy from `.env.example`). Web optionally uses `apps/web/.env` with `VITE_*` vars. See [ENV.md](ENV.md) for details.

#### 1. Backend

```bash
cd apps/backend
cp .env.example .env
# Edit .env (DB_*, PORT, optional OPENAI_API_KEY and GENERATE_CHATGPT_QUESTIONS)
go mod download
go run cmd/server/main.go
```

#### 2. Web App

```bash
cd apps/web
pnpm install
pnpm dev
```

#### 3. Mobile App (optional)

```bash
cd apps/mobile
pnpm install
pnpm ios     # For iOS
pnpm android # For Android
```

## 📖 User flow (no login)

1. Open the app → **Landing** or go to **Practice**.
2. If you’ve already completed today (saved in browser): **“You’re done for the day, come back tomorrow.”**
3. Otherwise: **“Start answer writing for today”** with 2 questions. Click **Start** → full-screen session.
4. **Session**: Read (20s) → Think (30s) → Write (5 min) per question. If you switch tabs or leave the window, a warning is shown.
5. After both questions, completion is saved in the browser for today.

## 📖 Answer Writing Flow (per question)

1. **📖 Read Phase (20 seconds)**: Question appears, read and understand
2. **🤔 Think Phase (30 seconds)**: Plan your answer structure
3. **✍️ Write Phase (5 minutes)**: Write on paper (last 30 sec has warning beep)
4. **🔔 Next**: Beep signals completion; next question or “Session complete”

## 🤖 Questions and cron (backend)

- **Database**: Questions and `daily_questions` (2 per day) are stored in PostgreSQL. Seed data adds sample UPSC questions and assigns 2 for today.
- **Cron**: On startup, the backend ensures the **next 7 days** each have 2 questions. If a day has none, it either assigns from the existing pool or, if **ChatGPT generation** is enabled, generates 2 via OpenAI.
- **Env**: Set `GENERATE_CHATGPT_QUESTIONS=true` and `OPENAI_API_KEY=sk-...` in `apps/backend/.env` to enable LLM-generated questions for missing days. See `ENV.md` and `apps/backend/.env.example`.

## 🛠️ Tech Stack

- **Backend**: Go, Gin, PostgreSQL, optional OpenAI for question generation
- **Web**: React, TypeScript, Tailwind CSS, Framer Motion
- **Mobile**: React Native, Expo (optional)
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
