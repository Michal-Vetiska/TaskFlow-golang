package task

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func setupMux(t *testing.T) *http.ServeMux {
	t.Helper()
	svc := NewService(NewMemoryRepository())
	h := NewHandler(svc, slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelError})))
	mux := http.NewServeMux()
	h.Register(mux)
	return mux
}

func TestHandlerCRUDAndStatusCodes(t *testing.T) {
	mux := setupMux(t)

	createBody := `{"title":"Learn Go","description":"Interfaces","priority":"high"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/tasks", bytes.NewBufferString(createBody))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("create status=%d body=%s", rr.Code, rr.Body.String())
	}

	var created struct {
		Data Task `json:"data"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &created); err != nil {
		t.Fatalf("decode create: %v", err)
	}
	if created.Data.Status != StatusTodo || created.Data.Priority != PriorityHigh {
		t.Fatalf("unexpected created task: %+v", created.Data)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/v1/tasks/"+created.Data.ID.String(), nil)
	rr = httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("get status=%d", rr.Code)
	}

	patch := `{"status":"done"}`
	req = httptest.NewRequest(http.MethodPatch, "/api/v1/tasks/"+created.Data.ID.String(), bytes.NewBufferString(patch))
	rr = httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("patch status=%d body=%s", rr.Code, rr.Body.String())
	}

	req = httptest.NewRequest(http.MethodDelete, "/api/v1/tasks/"+created.Data.ID.String(), nil)
	rr = httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusNoContent {
		t.Fatalf("delete status=%d", rr.Code)
	}
	if rr.Body.Len() != 0 {
		t.Fatalf("delete should have empty body")
	}
}

func TestHandlerValidationAndNotFound(t *testing.T) {
	mux := setupMux(t)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/tasks", bytes.NewBufferString(`{"title":""}`))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", rr.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/v1/tasks/00000000-0000-0000-0000-000000000001", nil)
	rr = httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/v1/tasks/bad-id", nil)
	rr = httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestHandlerListFiltersPaginationAndStats(t *testing.T) {
	mux := setupMux(t)

	for _, body := range []string{
		`{"title":"One","priority":"low"}`,
		`{"title":"Two","priority":"high"}`,
		`{"title":"Three","priority":"medium"}`,
	} {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/tasks", bytes.NewBufferString(body))
		rr := httptest.NewRecorder()
		mux.ServeHTTP(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("create failed: %s", rr.Body.String())
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/tasks?priority=high&limit=10&offset=0", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("list status=%d", rr.Code)
	}
	var list struct {
		Data []Task `json:"data"`
		Meta struct {
			Total  int `json:"total"`
			Limit  int `json:"limit"`
			Offset int `json:"offset"`
		} `json:"meta"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &list); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if list.Meta.Total != 1 || len(list.Data) != 1 {
		t.Fatalf("unexpected list: %+v", list)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/v1/tasks/stats", nil)
	rr = httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("stats status=%d", rr.Code)
	}
}
