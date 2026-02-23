# Environment Variables

## How variables are loaded

- **Backend (Go)**: Uses [godotenv](https://github.com/joho/godotenv). Call `godotenv.Load()` at startup (already done in `cmd/server/main.go`). It reads `.env` from the current working directory. Variables in the shell override `.env`.
- **Web (Vite)**: Only variables prefixed with `VITE_` are exposed to the client. Define them in `.env` or `.env.local` in `apps/web/`. They are loaded at build time and inlined.

## Backend (`apps/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default: 8080) | Server port. Use `8081` to match the web app's proxy. |
| `GIN_MODE` | No | `debug` or `release` |
| `DB_HOST` | Yes* | PostgreSQL host |
| `DB_PORT` | No | Default `5432` |
| `DB_USER` | Yes* | Database user |
| `DB_PASSWORD` | Yes* | Database password |
| `DB_NAME` | No | Default `focused_answer_writing` |
| `DB_SSLMODE` | No | Default `disable` |
| `JWT_SECRET` | No | Used when auth is enabled |
| `APP_ENV` | No | e.g. `development` |
| `GENERATE_CHATGPT_QUESTIONS` | No | Set to `true` to let the cron generate questions via OpenAI for days that have none |
| `OPENAI_API_KEY` | When using ChatGPT | Required if `GENERATE_CHATGPT_QUESTIONS=true` |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |

\* Required for the app to run with a real DB.

## Web (`apps/web/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API base URL. In dev, `/api` is proxied to the backend, so this is optional. |

## Example

**Backend** (copy to `apps/backend/.env`):

```env
PORT=8081
DB_HOST=127.0.0.1
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=focused_answer_writing
GENERATE_CHATGPT_QUESTIONS=false
OPENAI_API_KEY=
```

**Web**: Usually no `.env` needed; the proxy forwards `/api` to `http://localhost:8081`.
