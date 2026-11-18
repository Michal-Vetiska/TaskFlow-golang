package task

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
)

var (
	ErrValidation = errors.New("validation error")
	ErrInvalidID  = errors.New("invalid id")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, in CreateInput) (Task, error) {
	title := strings.TrimSpace(in.Title)
	if title == "" {
		return Task{}, fmt.Errorf("%w: title is required", ErrValidation)
	}
	if utf8.RuneCountInString(title) > 120 {
		return Task{}, fmt.Errorf("%w: title must be at most 120 characters", ErrValidation)
	}

	description := in.Description
	if description == "" {
		description = ""
	}

	priority := in.Priority
	if priority == "" {
		priority = PriorityMedium
	}
	if !priority.Valid() {
		return Task{}, fmt.Errorf("%w: priority must be one of low, medium, high", ErrValidation)
	}

	return s.repo.Create(ctx, title, description, StatusTodo, priority)
}

func (s *Service) Get(ctx context.Context, idStr string) (Task, error) {
	id, err := parseID(idStr)
	if err != nil {
		return Task{}, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, filter ListFilter) (ListResult, error) {
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if filter.Limit > 500 {
		return ListResult{}, fmt.Errorf("%w: limit must be between 1 and 500", ErrValidation)
	}
	if filter.Offset < 0 {
		return ListResult{}, fmt.Errorf("%w: offset must be >= 0", ErrValidation)
	}
	if filter.Status != nil && !filter.Status.Valid() {
		return ListResult{}, fmt.Errorf("%w: invalid status filter", ErrValidation)
	}
	if filter.Priority != nil && !filter.Priority.Valid() {
		return ListResult{}, fmt.Errorf("%w: invalid priority filter", ErrValidation)
	}
	return s.repo.List(ctx, filter)
}

func (s *Service) Update(ctx context.Context, idStr string, in UpdateInput) (Task, error) {
	id, err := parseID(idStr)
	if err != nil {
		return Task{}, err
	}

	fields := PatchFields{}

	if in.Title.Set {
		if in.Title.Null {
			return Task{}, fmt.Errorf("%w: title cannot be null", ErrValidation)
		}
		title := strings.TrimSpace(in.Title.Value)
		if title == "" {
			return Task{}, fmt.Errorf("%w: title is required", ErrValidation)
		}
		if utf8.RuneCountInString(title) > 120 {
			return Task{}, fmt.Errorf("%w: title must be at most 120 characters", ErrValidation)
		}
		fields.Title = &title
	}

	if in.Description.Set {
		if in.Description.Null {
			empty := ""
			fields.Description = &empty
		} else {
			desc := in.Description.Value
			fields.Description = &desc
		}
	}

	if in.Status.Set {
		if in.Status.Null {
			return Task{}, fmt.Errorf("%w: status cannot be null", ErrValidation)
		}
		if !in.Status.Value.Valid() {
			return Task{}, fmt.Errorf("%w: status must be one of todo, in_progress, done", ErrValidation)
		}
		st := in.Status.Value
		fields.Status = &st
	}

	if in.Priority.Set {
		if in.Priority.Null {
			return Task{}, fmt.Errorf("%w: priority cannot be null", ErrValidation)
		}
		if !in.Priority.Value.Valid() {
			return Task{}, fmt.Errorf("%w: priority must be one of low, medium, high", ErrValidation)
		}
		pr := in.Priority.Value
		fields.Priority = &pr
	}

	return s.repo.Update(ctx, id, fields)
}

func (s *Service) Delete(ctx context.Context, idStr string) error {
	id, err := parseID(idStr)
	if err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

func (s *Service) Stats(ctx context.Context) (Stats, error) {
	return s.repo.Stats(ctx)
}

func parseID(idStr string) (uuid.UUID, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
	}
	return id, nil
}
