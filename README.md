# TaskFlow

Moderní fullstack aplikace pro správu úkolů. Backend v Go (`net/http` + PostgreSQL), frontend v React 19 + TypeScript.

## Stack

| Vrstva | Technologie |
|---|---|
| Backend | Go 1.27, `net/http`, `pgx/v5`, Goose, `log/slog` |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, dnd-kit |
| Databáze | PostgreSQL 17 |
| Infra | Docker Compose, GitHub Actions |

## Architektura

```text
React UI → Fetch / TanStack Query → Go ServeMux → Handler → Service → Repository → PostgreSQL
```

Každá backendová vrstva má jasnou odpovědnost. Frontend komunikuje výhradně přes REST API.

## Struktura

```text
taskflow/
├── backend/                 # Go API
│   ├── cmd/api/             # vstupní bod
│   ├── internal/            # config, task, httpx, middleware
│   └── migrations/          # Goose SQL
├── frontend/                # React SPA
├── compose.yaml
├── Makefile
├── README.md
└── GO_LEARNING_GUIDE.md
```

## Rychlé spuštění (Docker, doporučeno)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Health: http://localhost:8080/health

Migrace se spustí automaticky při startu backendu.

## Lokální vývoj bez Dockeru (macOS)

### 1) PostgreSQL

```bash
docker compose up -d postgres
cp .env.example .env
```

### 2) Backend

```bash
cd backend
go mod tidy
export DATABASE_URL="postgres://taskflow:taskflow@localhost:5432/taskflow?sslmode=disable"
export RUN_MIGRATIONS=true
go run ./cmd/api
```

API běží na `http://localhost:8080`.

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite běží na `http://localhost:5173` a proxyuje `/api` i `/health` na backend.

## Environment variables

Viz [`.env.example`](.env.example).

| Proměnná | Popis | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL DSN | `postgres://taskflow:taskflow@localhost:5432/taskflow?sslmode=disable` |
| `HTTP_ADDR` | Adresa API | `:8080` |
| `RUN_MIGRATIONS` | Spustit Goose při startu | `true` |
| `MAX_REQUEST_BODY_BYTES` | Limit těla requestu | `1048576` |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` | `info` |

## Migrace

Goose SQL migrace jsou v `backend/migrations/`.

```bash
make migrate-up
make migrate-down
```

## API

### Endpoints

```http
GET    /health
GET    /api/v1/tasks
GET    /api/v1/tasks/stats
GET    /api/v1/tasks/{id}
POST   /api/v1/tasks
PATCH  /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
```

Úspěšná odpověď:

```json
{
  "data": {
    "id": "uuid",
    "title": "Learn Go",
    "description": "Understand interfaces",
    "status": "todo",
    "priority": "high",
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
  }
}
```

Chyba:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required"
  }
}
```

### Ukázkové curl requesty

```bash
# Health
curl -s http://localhost:8080/health

# Vytvořit úkol
curl -s -X POST http://localhost:8080/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Learn Go","description":"Understand interfaces","priority":"high"}'

# Seznam s filtrem a stránkováním
curl -s 'http://localhost:8080/api/v1/tasks?status=todo&priority=high&limit=10&offset=0'

# Statistiky dashboardu
curl -s http://localhost:8080/api/v1/tasks/stats

# PATCH status
curl -s -X PATCH http://localhost:8080/api/v1/tasks/<ID> \
  -H 'Content-Type: application/json' \
  -d '{"status":"in_progress"}'

# DELETE
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE http://localhost:8080/api/v1/tasks/<ID>
```

## Frontend funkce

- Dashboard se statistikami ze `GET /api/v1/tasks/stats`
- All Tasks: filtry, stránkování, editace, mazání
- Kanban Board: drag-and-drop (dnd-kit) + select jako přístupná alternativa
- Task modal pro create/update
- Delete confirmation dialog
- Dark / light mode (výchozí dark)
- Mobilní navigace
- Error / loading / empty states napojené na skutečné API

## Testování

### Backend

```bash
cd backend
go fmt ./...
go vet ./...
go test ./...
go test -race ./...
go build ./...
```

Integrační testy repository vyžadují PostgreSQL a `DATABASE_URL` / `TEST_DATABASE_URL`.

### Frontend

```bash
cd frontend
npm run lint
npm run test
npm run build
```

## CI

GitHub Actions workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) spouští:

- Go: fmt check, vet, test, race, build (+ Postgres service)
- Frontend: lint, test, build

## Limitace

- Aplikace nemá autentizaci ani multi-user tenancy.
- Board načítá úkoly po stránkách o 500 záznamech (dostatečné pro portfolio; ne infinite scroll).
- Nejsou zde notifikace, komentáře ani přílohy.

## Vzdělávací průvodce Go

Podrobná výuka jazyka Go na kódu tohoto projektu:

→ [`GO_LEARNING_GUIDE.md`](GO_LEARNING_GUIDE.md)

## Licence

MIT
