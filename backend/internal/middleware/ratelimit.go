package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimit caps how many requests a given key can make within a rolling
// window — a cheap guardrail against runaway OpenAI costs from a leaked
// token or a buggy client retry loop. Keys on user_id when authenticated
// (set by RequireAuth earlier in the chain), falling back to client IP for
// unauthenticated routes like signup/login.
//
// In-memory only: fine for a single instance (e.g. one Render free-tier
// service), but won't share state across multiple instances and resets on
// restart. Good enough for MVP scale; swap for Redis if this ever runs
// behind more than one instance.
func RateLimit(max int, window time.Duration) gin.HandlerFunc {
	var mu sync.Mutex
	hits := make(map[string][]time.Time)

	return func(c *gin.Context) {
		key := c.GetString("user_id")
		if key == "" {
			key = c.ClientIP()
		}

		now := time.Now()
		mu.Lock()
		kept := make([]time.Time, 0, len(hits[key]))
		for _, t := range hits[key] {
			if now.Sub(t) < window {
				kept = append(kept, t)
			}
		}
		if len(kept) >= max {
			hits[key] = kept
			mu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded, try again later"})
			c.Abort()
			return
		}
		hits[key] = append(kept, now)
		mu.Unlock()

		c.Next()
	}
}
