package store

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Store wraps the Postgres connection pool. All queries live in this
// package so handlers stay thin — see the dev-playbook backend structure.
type Store struct {
	db *pgxpool.Pool
}

func New(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}
	return &Store{db: pool}, nil
}

func (s *Store) Close() {
	s.db.Close()
}

// --- Profiles ---
// GetProfile, UpsertProfile

// --- Goals ---
// GetGoals, UpsertGoals

// --- Meals ---
// CreateMeal, ListMealsForDay, DeleteMeal

// --- Meal Items ---
// CreateMealItems, ListItemsForMeal

// --- Themes ---
// ListThemes, SeedThemes (ON CONFLICT DO NOTHING — see migrations/0001_init.sql)

// --- Streaks ---
// GetStreak, UpdateStreakOnLog
