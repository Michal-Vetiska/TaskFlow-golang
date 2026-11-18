package task

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusTodo       Status = "todo"
	StatusInProgress Status = "in_progress"
	StatusDone       Status = "done"
)

func (s Status) Valid() bool {
	switch s {
	case StatusTodo, StatusInProgress, StatusDone:
		return true
	default:
		return false
	}
}

type Priority string

const (
	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
)

func (p Priority) Valid() bool {
	switch p {
	case PriorityLow, PriorityMedium, PriorityHigh:
		return true
	default:
		return false
	}
}

type Task struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      Status    `json:"status"`
	Priority    Priority  `json:"priority"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateInput struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Priority    Priority `json:"priority"`
}

type UpdateInput struct {
	Title       optionalString
	Description optionalString
	Status      optionalStatus
	Priority    optionalPriority
}

type optionalString struct {
	Set   bool
	Null  bool
	Value string
}

type optionalStatus struct {
	Set   bool
	Null  bool
	Value Status
}

type optionalPriority struct {
	Set   bool
	Null  bool
	Value Priority
}

func (in *UpdateInput) UnmarshalJSON(data []byte) error {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	if v, ok := raw["title"]; ok {
		in.Title.Set = true
		if string(v) == "null" {
			in.Title.Null = true
		} else if err := json.Unmarshal(v, &in.Title.Value); err != nil {
			return err
		}
	}
	if v, ok := raw["description"]; ok {
		in.Description.Set = true
		if string(v) == "null" {
			in.Description.Null = true
		} else if err := json.Unmarshal(v, &in.Description.Value); err != nil {
			return err
		}
	}
	if v, ok := raw["status"]; ok {
		in.Status.Set = true
		if string(v) == "null" {
			in.Status.Null = true
		} else if err := json.Unmarshal(v, &in.Status.Value); err != nil {
			return err
		}
	}
	if v, ok := raw["priority"]; ok {
		in.Priority.Set = true
		if string(v) == "null" {
			in.Priority.Null = true
		} else if err := json.Unmarshal(v, &in.Priority.Value); err != nil {
			return err
		}
	}
	return nil
}

type ListFilter struct {
	Status   *Status
	Priority *Priority
	Limit    int
	Offset   int
}

type ListResult struct {
	Items []Task
	Total int
}

type Stats struct {
	Total          int     `json:"total"`
	Todo           int     `json:"todo"`
	InProgress     int     `json:"in_progress"`
	Done           int     `json:"done"`
	CompletionRate float64 `json:"completion_rate"`
}

type PatchFields struct {
	Title       *string
	Description *string
	Status      *Status
	Priority    *Priority
}
