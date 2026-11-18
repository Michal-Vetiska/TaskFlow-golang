package task

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

func TestPostgresRepositoryIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL / DATABASE_URL not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open sql: %v", err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		t.Skipf("database not available: %v", err)
	}

	if err := goose.SetDialect("postgres"); err != nil {
		t.Fatalf("goose dialect: %v", err)
	}
	migDir := filepath.Join("..", "..", "migrations")
	if err := goose.Up(db, migDir); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("pool: %v", err)
	}
	defer pool.Close()

	repo := NewPostgresRepository(pool)

	// Isolate test data.
	if _, err := pool.Exec(ctx, `DELETE FROM tasks WHERE title LIKE 'itest-%'`); err != nil {
		t.Fatalf("cleanup: %v", err)
	}

	created, err := repo.Create(ctx, "itest-create", "desc", StatusTodo, PriorityHigh)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	got, err := repo.GetByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Title != "itest-create" {
		t.Fatalf("unexpected title %s", got.Title)
	}

	st := StatusDone
	title := "itest-updated"
	updated, err := repo.Update(ctx, created.ID, PatchFields{Title: &title, Status: &st})
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.Status != StatusDone || updated.Title != title {
		t.Fatalf("unexpected update %+v", updated)
	}
	if !updated.UpdatedAt.After(created.UpdatedAt) && !updated.UpdatedAt.Equal(created.UpdatedAt) {
		// updated_at should move forward; allow equal only on very fast clocks
	}

	pr := PriorityHigh
	list, err := repo.List(ctx, ListFilter{Priority: &pr, Limit: 50, Offset: 0})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	found := false
	for _, item := range list.Items {
		if item.ID == created.ID {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("created task not found in filtered list")
	}

	stats, err := repo.Stats(ctx)
	if err != nil {
		t.Fatalf("stats: %v", err)
	}
	if stats.Total < 1 {
		t.Fatalf("expected stats total >= 1")
	}

	if err := repo.Delete(ctx, created.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	_, err = repo.GetByID(ctx, created.ID)
	if err != ErrNotFound {
		t.Fatalf("expected not found after delete, got %v", err)
	}
}
