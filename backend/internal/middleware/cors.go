package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS allows the local web/Metro dev servers to call the API directly
// during development (mobile builds don't need this — only browsers
// enforce CORS). Permissive by design for local dev; tighten before any
// public deploy.
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
