package task

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("task not found")

type Repository interface {
	Create(ctx context.Context, title, description string, status Status, priority Priority) (Task, error)
	GetByID(ctx context.Context, id uuid.UUID) (Task, error)
	List(ctx context.Context, filter ListFilter) (ListResult, error)
	Update(ctx context.Context, id uuid.UUID, fields PatchFields) (Task, error)
	Delete(ctx context.Context, id uuid.UUID) error
	Stats(ctx context.Context) (Stats, error)
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) Create(ctx context.Context, title, description string, status Status, priority Priority) (Task, error) {
	const q = `
		INSERT INTO tasks (title, description, status, priority)
		VALUES ($1, $2, $3, $4)
		RETURNING id, title, description, status, priority, created_at, updated_at
	`
	var t Task
	err := r.pool.QueryRow(ctx, q, title, description, status, priority).Scan(
		&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return Task{}, fmt.Errorf("create task: %w", err)
	}
	t.CreatedAt = t.CreatedAt.UTC()
	t.UpdatedAt = t.UpdatedAt.UTC()
	return t, nil
}

func (r *PostgresRepository) GetByID(ctx context.Context, id uuid.UUID) (Task, error) {
	const q = `
		SELECT id, title, description, status, priority, created_at, updated_at
		FROM tasks
		WHERE id = $1
	`
	var t Task
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority, &t.CreatedAt, &t.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Task{}, ErrNotFound
	}
	if err != nil {
		return Task{}, fmt.Errorf("get task: %w", err)
	}
	t.CreatedAt = t.CreatedAt.UTC()
	t.UpdatedAt = t.UpdatedAt.UTC()
	return t, nil
}

func (r *PostgresRepository) List(ctx context.Context, filter ListFilter) (ListResult, error) {
	where := make([]string, 0, 2)
	args := make([]any, 0, 4)
	argPos := 1

	if filter.Status != nil {
		where = append(where, fmt.Sprintf("status = $%d", argPos))
		args = append(args, *filter.Status)
		argPos++
	}
	if filter.Priority != nil {
		where = append(where, fmt.Sprintf("priority = $%d", argPos))
		args = append(args, *filter.Priority)
		argPos++
	}

	whereSQL := ""
	if len(where) > 0 {
		whereSQL = "WHERE " + strings.Join(where, " AND ")
	}

	countQ := "SELECT COUNT(*) FROM tasks " + whereSQL
	var total int
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return ListResult{}, fmt.Errorf("count tasks: %w", err)
	}

	listArgs := append([]any{}, args...)
	listArgs = append(listArgs, filter.Limit, filter.Offset)
	listQ := fmt.Sprintf(`
		SELECT id, title, description, status, priority, created_at, updated_at
		FROM tasks
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereSQL, argPos, argPos+1)

	rows, err := r.pool.Query(ctx, listQ, listArgs...)
	if err != nil {
		return ListResult{}, fmt.Errorf("list tasks: %w", err)
	}
	defer rows.Close()

	items := make([]Task, 0)
	for rows.Next() {
		var t Task
		if err := rows.Scan(
			&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return ListResult{}, fmt.Errorf("scan task: %w", err)
		}
		t.CreatedAt = t.CreatedAt.UTC()
		t.UpdatedAt = t.UpdatedAt.UTC()
		items = append(items, t)
	}
	if err := rows.Err(); err != nil {
		return ListResult{}, fmt.Errorf("iterate tasks: %w", err)
	}

	return ListResult{Items: items, Total: total}, nil
}

func (r *PostgresRepository) Update(ctx context.Context, id uuid.UUID, fields PatchFields) (Task, error) {
	sets := make([]string, 0, 5)
	args := make([]any, 0, 5)
	argPos := 1

	if fields.Title != nil {
		sets = append(sets, fmt.Sprintf("title = $%d", argPos))
		args = append(args, *fields.Title)
		argPos++
	}
	if fields.Description != nil {
		sets = append(sets, fmt.Sprintf("description = $%d", argPos))
		args = append(args, *fields.Description)
		argPos++
	}
	if fields.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argPos))
		args = append(args, *fields.Status)
		argPos++
	}
	if fields.Priority != nil {
		sets = append(sets, fmt.Sprintf("priority = $%d", argPos))
		args = append(args, *fields.Priority)
		argPos++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, "updated_at = (NOW() AT TIME ZONE 'UTC')")
	args = append(args, id)

	q := fmt.Sprintf(`
		UPDATE tasks
		SET %s
		WHERE id = $%d
		RETURNING id, title, description, status, priority, created_at, updated_at
	`, strings.Join(sets, ", "), argPos)

	var t Task
	err := r.pool.QueryRow(ctx, q, args...).Scan(
		&t.ID, &t.Title, &t.Description, &t.Status, &t.Priority, &t.CreatedAt, &t.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Task{}, ErrNotFound
	}
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23514" {
			return Task{}, fmt.Errorf("constraint violation: %w", err)
		}
		return Task{}, fmt.Errorf("update task: %w", err)
	}
	t.CreatedAt = t.CreatedAt.UTC()
	t.UpdatedAt = t.UpdatedAt.UTC()
	return t, nil
}

func (r *PostgresRepository) Delete(ctx context.Context, id uuid.UUID) error {
	const q = `DELETE FROM tasks WHERE id = $1`
	tag, err := r.pool.Exec(ctx, q, id)
	if err != nil {
		return fmt.Errorf("delete task: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresRepository) Stats(ctx context.Context) (Stats, error) {
	const q = `
		SELECT
			COUNT(*)::int AS total,
			COUNT(*) FILTER (WHERE status = 'todo')::int AS todo,
			COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
			COUNT(*) FILTER (WHERE status = 'done')::int AS done
		FROM tasks
	`
	var s Stats
	if err := r.pool.QueryRow(ctx, q).Scan(&s.Total, &s.Todo, &s.InProgress, &s.Done); err != nil {
		return Stats{}, fmt.Errorf("stats: %w", err)
	}
	if s.Total > 0 {
		s.CompletionRate = float64(s.Done) / float64(s.Total) * 100
		s.CompletionRate = float64(int(s.CompletionRate*10+0.5)) / 10
	}
	return s, nil
}
