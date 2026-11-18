.PHONY: help tidy migrate-up migrate-down run-api test-api race-api vet-api fmt-api \
	install-web dev-web build-web test-web lint-web compose-up compose-down compose-logs

help:
	@echo "TaskFlow Makefile targets:"
	@echo "  tidy          - go mod tidy"
	@echo "  migrate-up    - run Goose migrations up"
	@echo "  migrate-down  - roll back one Goose migration"
	@echo "  run-api       - run Go API locally"
	@echo "  test-api      - run Go tests"
	@echo "  race-api      - run Go tests with race detector"
	@echo "  vet-api       - go vet"
	@echo "  fmt-api       - go fmt"
	@echo "  install-web   - npm install in frontend"
	@echo "  dev-web       - start Vite dev server"
	@echo "  build-web     - build frontend"
	@echo "  test-web      - run frontend tests"
	@echo "  lint-web      - lint frontend"
	@echo "  compose-up    - docker compose up --build"
	@echo "  compose-down  - docker compose down"
	@echo "  compose-logs  - docker compose logs -f"

tidy:
	cd backend && go mod tidy

migrate-up:
	cd backend && go run github.com/pressly/goose/v3/cmd/goose@v3.24.1 \
		-dir migrations postgres "$${DATABASE_URL:-postgres://taskflow:taskflow@localhost:5432/taskflow?sslmode=disable}" up

migrate-down:
	cd backend && go run github.com/pressly/goose/v3/cmd/goose@v3.24.1 \
		-dir migrations postgres "$${DATABASE_URL:-postgres://taskflow:taskflow@localhost:5432/taskflow?sslmode=disable}" down

run-api:
	cd backend && go run ./cmd/api

test-api:
	cd backend && go test ./...

race-api:
	cd backend && go test -race ./...

vet-api:
	cd backend && go vet ./...

fmt-api:
	cd backend && go fmt ./...

install-web:
	cd frontend && npm install

dev-web:
	cd frontend && npm run dev

build-web:
	cd frontend && npm run build

test-web:
	cd frontend && npm run test

lint-web:
	cd frontend && npm run lint

compose-up:
	docker compose up --build

compose-down:
	docker compose down

compose-logs:
	docker compose logs -f
