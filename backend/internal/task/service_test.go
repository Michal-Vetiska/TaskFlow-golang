package task

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
)

func TestServiceCreateDefaultsAndValidation(t *testing.T) {
	svc := NewService(NewMemoryRepository())
	ctx := context.Background()

	created, err := svc.Create(ctx, CreateInput{Title: "Learn Go"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if created.Status != StatusTodo {
		t.Fatalf("expected status todo, got %s", created.Status)
	}
	if created.Priority != PriorityMedium {
		t.Fatalf("expected priority medium, got %s", created.Priority)
	}

	_, err = svc.Create(ctx, CreateInput{Title: ""})
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected validation error, got %v", err)
	}

	_, err = svc.Create(ctx, CreateInput{Title: "X", Priority: "urgent"})
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected invalid priority, got %v", err)
	}
}

func TestServiceGetUpdateDelete(t *testing.T) {
	svc := NewService(NewMemoryRepository())
	ctx := context.Background()

	created, err := svc.Create(ctx, CreateInput{Title: "Task", Description: "Desc", Priority: PriorityHigh})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	got, err := svc.Get(ctx, created.ID.String())
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Title != "Task" {
		t.Fatalf("unexpected title %s", got.Title)
	}

	raw := []byte(`{"title":"Updated","status":"done","description":null}`)
	var in UpdateInput
	if err := json.Unmarshal(raw, &in); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	updated, err := svc.Update(ctx, created.ID.String(), in)
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.Title != "Updated" || updated.Status != StatusDone || updated.Description != "" {
		t.Fatalf("unexpected update result: %+v", updated)
	}

	if err := svc.Delete(ctx, created.ID.String()); err != nil {
		t.Fatalf("delete: %v", err)
	}
	_, err = svc.Get(ctx, created.ID.String())
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestServiceListFilterAndPagination(t *testing.T) {
	svc := NewService(NewMemoryRepository())
	ctx := context.Background()

	_, _ = svc.Create(ctx, CreateInput{Title: "A", Priority: PriorityLow})
	b, _ := svc.Create(ctx, CreateInput{Title: "B", Priority: PriorityHigh})
	_, _ = svc.Update(ctx, b.ID.String(), mustUpdate(`{"status":"in_progress"}`))

	st := StatusInProgress
	result, err := svc.List(ctx, ListFilter{Status: &st, Limit: 10, Offset: 0})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if result.Total != 1 || len(result.Items) != 1 {
		t.Fatalf("expected 1 in_progress, got total=%d items=%d", result.Total, len(result.Items))
	}

	_, err = svc.List(ctx, ListFilter{Limit: 1000})
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected limit validation, got %v", err)
	}
}

func TestServiceStats(t *testing.T) {
	svc := NewService(NewMemoryRepository())
	ctx := context.Background()
	a, _ := svc.Create(ctx, CreateInput{Title: "A"})
	_, _ = svc.Create(ctx, CreateInput{Title: "B"})
	_, _ = svc.Update(ctx, a.ID.String(), mustUpdate(`{"status":"done"}`))

	stats, err := svc.Stats(ctx)
	if err != nil {
		t.Fatalf("stats: %v", err)
	}
	if stats.Total != 2 || stats.Done != 1 || stats.Todo != 1 {
		t.Fatalf("unexpected stats: %+v", stats)
	}
	if stats.CompletionRate != 50 {
		t.Fatalf("expected completion 50, got %v", stats.CompletionRate)
	}
}

func TestServiceInvalidID(t *testing.T) {
	svc := NewService(NewMemoryRepository())
	_, err := svc.Get(context.Background(), "not-a-uuid")
	if !errors.Is(err, ErrInvalidID) {
		t.Fatalf("expected invalid id, got %v", err)
	}
}

func mustUpdate(raw string) UpdateInput {
	var in UpdateInput
	if err := json.Unmarshal([]byte(raw), &in); err != nil {
		panic(err)
	}
	return in
}
