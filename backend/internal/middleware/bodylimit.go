package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MaxBodyBytes rejects request bodies larger than n bytes before they're
// fully read — without this, an unbounded photo upload (or malicious
// payload) can consume arbitrary memory/bandwidth on every request.
func MaxBodyBytes(n int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, n)
		c.Next()
	}
}
