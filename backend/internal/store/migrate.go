package store

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

// RunMigrations applies every .sql file under dir, in filename order, on
// every boot. Migration files are written to be idempotent (create table
// if not exists / on conflict do nothing), so re-applying is always safe —
// there's no separate "already applied" tracking table.
func (s *Store) RunMigrations(ctx context.Context, dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("reading migrations dir: %w", err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".sql" {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	for _, name := range files {
		sqlBytes, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			return fmt.Errorf("reading migration %s: %w", name, err)
		}
		if _, err := s.db.Exec(ctx, string(sqlBytes)); err != nil {
			return fmt.Errorf("applying migration %s: %w", name, err)
		}
	}

	return nil
}
