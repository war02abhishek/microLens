package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	// store *store.Store
	jwtSecret string
}

func NewAuthHandler(jwtSecret string) *AuthHandler {
	return &AuthHandler{jwtSecret: jwtSecret}
}

// POST /auth/signup
func (h *AuthHandler) Signup(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

// POST /auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

// POST /auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}
