package task

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/taskflow/taskflow/backend/internal/httpx"
)

type Handler struct {
	service *Service
	logger  *slog.Logger
}

func NewHandler(service *Service, logger *slog.Logger) *Handler {
	return &Handler{service: service, logger: logger}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/tasks/stats", h.Stats)
	mux.HandleFunc("GET /api/v1/tasks", h.List)
	mux.HandleFunc("POST /api/v1/tasks", h.Create)
	mux.HandleFunc("GET /api/v1/tasks/{id}", h.Get)
	mux.HandleFunc("PATCH /api/v1/tasks/{id}", h.Update)
	mux.HandleFunc("DELETE /api/v1/tasks/{id}", h.Delete)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var in CreateInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	t, err := h.service.Create(r.Context(), in)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteData(w, http.StatusCreated, t)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	t, err := h.service.Get(r.Context(), id)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteData(w, http.StatusOK, t)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := ListFilter{
		Limit:  20,
		Offset: 0,
	}

	if raw := q.Get("limit"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", "limit must be an integer")
			return
		}
		filter.Limit = n
	}
	if raw := q.Get("offset"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", "offset must be an integer")
			return
		}
		filter.Offset = n
	}
	if raw := q.Get("status"); raw != "" {
		st := Status(raw)
		filter.Status = &st
	}
	if raw := q.Get("priority"); raw != "" {
		pr := Priority(raw)
		filter.Priority = &pr
	}

	result, err := h.service.List(r.Context(), filter)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}

	httpx.WriteList(w, http.StatusOK, result.Items, httpx.ListMeta{
		Total:  result.Total,
		Limit:  filter.Limit,
		Offset: filter.Offset,
	})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var in UpdateInput
	if err := decodeJSON(r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	t, err := h.service.Update(r.Context(), id, in)
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteData(w, http.StatusOK, t)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.service.Delete(r.Context(), id); err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteNoContent(w)
}

func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.Stats(r.Context())
	if err != nil {
		h.writeServiceError(w, err)
		return
	}
	httpx.WriteData(w, http.StatusOK, stats)
}

func (h *Handler) writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrValidation):
		httpx.WriteError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", cleanErrMessage(err, ErrValidation))
	case errors.Is(err, ErrInvalidID):
		httpx.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid task id")
	case errors.Is(err, ErrNotFound):
		httpx.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Task not found")
	default:
		h.logger.Error("request failed", "error", err)
		httpx.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error")
	}
}

func cleanErrMessage(err, sentinel error) string {
	msg := err.Error()
	prefix := sentinel.Error() + ": "
	return strings.TrimPrefix(msg, prefix)
}

func decodeJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			return errors.New("request body too large")
		}
		return errors.New("invalid JSON body")
	}
	return nil
}
