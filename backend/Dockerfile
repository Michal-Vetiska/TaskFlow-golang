FROM golang:1.27-alpine AS builder

WORKDIR /src
RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./cmd/api

FROM alpine:3.21

WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /out/api /app/api
COPY migrations /app/migrations

ENV MIGRATIONS_DIR=/app/migrations
ENV HTTP_ADDR=:8080

EXPOSE 8080
USER nobody
ENTRYPOINT ["/app/api"]
