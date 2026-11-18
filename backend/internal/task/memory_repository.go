package task

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
)

// MemoryRepository is an in-memory Repository used by unit tests.
type MemoryRepository struct {
	mu    sync.RWMutex
	tasks map[uuid.UUID]Task
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{tasks: make(map[uuid.UUID]Task)}
}

func (r *MemoryRepository) Create(_ context.Context, title, description string, status Status, priority Priority) (Task, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now().UTC()
	t := Task{
		ID:          uuid.New(),
		Title:       title,
		Description: description,
		Status:      status,
		Priority:    priority,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	r.tasks[t.ID] = t
	return t, nil
}

func (r *MemoryRepository) GetByID(_ context.Context, id uuid.UUID) (Task, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	t, ok := r.tasks[id]
	if !ok {
		return Task{}, ErrNotFound
	}
	return t, nil
}

func (r *MemoryRepository) List(_ context.Context, filter ListFilter) (ListResult, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	all := make([]Task, 0, len(r.tasks))
	for _, t := range r.tasks {
		if filter.Status != nil && t.Status != *filter.Status {
			continue
		}
		if filter.Priority != nil && t.Priority != *filter.Priority {
			continue
		}
		all = append(all, t)
	}

	// Newest first.
	for i := 0; i < len(all); i++ {
		for j := i + 1; j < len(all); j++ {
			if all[j].CreatedAt.After(all[i].CreatedAt) {
				all[i], all[j] = all[j], all[i]
			}
		}
	}

	total := len(all)
	start := filter.Offset
	if start > total {
		start = total
	}
	end := start + filter.Limit
	if end > total {
		end = total
	}
	return ListResult{Items: all[start:end], Total: total}, nil
}

func (r *MemoryRepository) Update(_ context.Context, id uuid.UUID, fields PatchFields) (Task, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.tasks[id]
	if !ok {
		return Task{}, ErrNotFound
	}
	if fields.Title != nil {
		t.Title = *fields.Title
	}
	if fields.Description != nil {
		t.Description = *fields.Description
	}
	if fields.Status != nil {
		t.Status = *fields.Status
	}
	if fields.Priority != nil {
		t.Priority = *fields.Priority
	}
	t.UpdatedAt = time.Now().UTC()
	r.tasks[id] = t
	return t, nil
}

func (r *MemoryRepository) Delete(_ context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.tasks[id]; !ok {
		return ErrNotFound
	}
	delete(r.tasks, id)
	return nil
}

func (r *MemoryRepository) Stats(_ context.Context) (Stats, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var s Stats
	for _, t := range r.tasks {
		s.Total++
		switch t.Status {
		case StatusTodo:
			s.Todo++
		case StatusInProgress:
			s.InProgress++
		case StatusDone:
			s.Done++
		}
	}
	if s.Total > 0 {
		s.CompletionRate = float64(s.Done) / float64(s.Total) * 100
		s.CompletionRate = float64(int(s.CompletionRate*10+0.5)) / 10
	}
	return s, nil
}
