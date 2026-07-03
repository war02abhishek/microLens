FROM golang:1.26-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /out/macrolens-backend .

FROM alpine:3.21
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=builder /out/macrolens-backend ./macrolens-backend
COPY migrations ./migrations

EXPOSE 8080
ENTRYPOINT ["./macrolens-backend"]
