package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"macrolens-backend/internal/model"
)

var ErrNotFound = errors.New("not found")

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

// --- Users ---

func (s *Store) CreateUser(ctx context.Context, email, passwordHash string) (model.User, error) {
	var u model.User
	err := s.db.QueryRow(ctx,
		`insert into users (email, password_hash) values ($1, $2) returning id, email, created_at`,
		email, passwordHash,
	).Scan(&u.ID, &u.Email, &u.CreatedAt)
	return u, err
}

// GetUserByEmail also returns the password hash, needed only for login
// verification — never serialized back to the client.
func (s *Store) GetUserByEmail(ctx context.Context, email string) (model.User, string, error) {
	var u model.User
	var hash string
	err := s.db.QueryRow(ctx,
		`select id, email, created_at, password_hash from users where email = $1`,
		email,
	).Scan(&u.ID, &u.Email, &u.CreatedAt, &hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return u, "", ErrNotFound
	}
	return u, hash, err
}

func (s *Store) GetUserByID(ctx context.Context, id string) (model.User, error) {
	var u model.User
	err := s.db.QueryRow(ctx,
		`select id, email, created_at from users where id = $1`, id,
	).Scan(&u.ID, &u.Email, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return u, ErrNotFound
	}
	return u, err
}

// --- Profiles ---

func (s *Store) GetProfile(ctx context.Context, userID string) (model.Profile, error) {
	var p model.Profile
	var targetWeight, pace *float64
	err := s.db.QueryRow(ctx, `
		select user_id, coalesce(display_name, ''), coalesce(avatar_url, ''), coalesce(age, 0),
		       coalesce(sex, ''), coalesce(height_cm, 0), coalesce(weight_kg, 0),
		       coalesce(activity_level, ''), coalesce(goal, ''), target_weight_kg, pace_kg_per_week,
		       coalesce(dietary_pref, ''), coalesce(theme_id, ''), coalesce(accent_color, ''), updated_at
		from profiles where user_id = $1`, userID,
	).Scan(&p.UserID, &p.DisplayName, &p.AvatarURL, &p.Age, &p.Sex, &p.HeightCM, &p.WeightKG,
		&p.ActivityLevel, &p.Goal, &targetWeight, &pace, &p.DietaryPref, &p.ThemeID, &p.AccentColor, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return p, ErrNotFound
	}
	p.TargetWeightKG = targetWeight
	p.PaceKGPerWeek = pace
	return p, err
}

func (s *Store) UpsertProfile(ctx context.Context, p model.Profile) (model.Profile, error) {
	err := s.db.QueryRow(ctx, `
		insert into profiles (user_id, display_name, avatar_url, age, sex, height_cm, weight_kg,
			activity_level, goal, target_weight_kg, pace_kg_per_week, dietary_pref, theme_id, accent_color, updated_at)
		values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
		on conflict (user_id) do update set
			display_name = excluded.display_name, avatar_url = excluded.avatar_url, age = excluded.age,
			sex = excluded.sex, height_cm = excluded.height_cm, weight_kg = excluded.weight_kg,
			activity_level = excluded.activity_level, goal = excluded.goal,
			target_weight_kg = excluded.target_weight_kg, pace_kg_per_week = excluded.pace_kg_per_week,
			dietary_pref = excluded.dietary_pref, theme_id = excluded.theme_id, accent_color = excluded.accent_color,
			updated_at = now()
		returning updated_at`,
		p.UserID, p.DisplayName, p.AvatarURL, p.Age, p.Sex, p.HeightCM, p.WeightKG,
		p.ActivityLevel, p.Goal, p.TargetWeightKG, p.PaceKGPerWeek, p.DietaryPref, p.ThemeID, p.AccentColor,
	).Scan(&p.UpdatedAt)
	return p, err
}

// --- Goals ---

func (s *Store) GetGoals(ctx context.Context, userID string) (model.Goals, error) {
	var g model.Goals
	err := s.db.QueryRow(ctx,
		`select user_id, calories, protein_g, carbs_g, fat_g, overridden, computed_at
		 from goals where user_id = $1`, userID,
	).Scan(&g.UserID, &g.Calories, &g.ProteinG, &g.CarbsG, &g.FatG, &g.Overridden, &g.ComputedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return g, ErrNotFound
	}
	return g, err
}

func (s *Store) UpsertGoals(ctx context.Context, g model.Goals) (model.Goals, error) {
	err := s.db.QueryRow(ctx, `
		insert into goals (user_id, calories, protein_g, carbs_g, fat_g, overridden, computed_at)
		values ($1,$2,$3,$4,$5,$6, now())
		on conflict (user_id) do update set
			calories = excluded.calories, protein_g = excluded.protein_g, carbs_g = excluded.carbs_g,
			fat_g = excluded.fat_g, overridden = excluded.overridden, computed_at = now()
		returning computed_at`,
		g.UserID, g.Calories, g.ProteinG, g.CarbsG, g.FatG, g.Overridden,
	).Scan(&g.ComputedAt)
	return g, err
}

// --- Meals ---

// CreateMeal persists a meal and its items in a single transaction.
func (s *Store) CreateMeal(ctx context.Context, meal model.Meal, items []model.MealItem) (model.Meal, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return meal, err
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx, `
		insert into meals (user_id, source, photo_url, raw_input, confidence, logged_at)
		values ($1,$2,$3,$4,$5, now())
		returning id, logged_at`,
		meal.UserID, meal.Source, meal.PhotoURL, meal.RawInput, meal.Confidence,
	).Scan(&meal.ID, &meal.LoggedAt)
	if err != nil {
		return meal, err
	}

	for i := range items {
		items[i].MealID = meal.ID
		err = tx.QueryRow(ctx, `
			insert into meal_items (meal_id, food_name, quantity_value, quantity_unit, calories, protein_g, carbs_g, fat_g, matched_food_id)
			values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
			returning id`,
			items[i].MealID, items[i].FoodName, items[i].QuantityValue, items[i].QuantityUnit,
			items[i].Calories, items[i].ProteinG, items[i].CarbsG, items[i].FatG, items[i].MatchedFoodID,
		).Scan(&items[i].ID)
		if err != nil {
			return meal, err
		}
	}
	meal.Items = items

	return meal, tx.Commit(ctx)
}

// ListMealsForDay returns meals (with items) logged by the user on the
// given date, in the given IANA location, ordered oldest-first.
func (s *Store) ListMealsForDay(ctx context.Context, userID string, day time.Time) ([]model.Meal, error) {
	start := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, day.Location())
	end := start.Add(24 * time.Hour)

	rows, err := s.db.Query(ctx, `
		select id, user_id, source, coalesce(photo_url, ''), coalesce(raw_input, ''), coalesce(confidence, 0), logged_at
		from meals where user_id = $1 and logged_at >= $2 and logged_at < $3
		order by logged_at asc`, userID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var meals []model.Meal
	for rows.Next() {
		var m model.Meal
		var photoURL string
		if err := rows.Scan(&m.ID, &m.UserID, &m.Source, &photoURL, &m.RawInput, &m.Confidence, &m.LoggedAt); err != nil {
			return nil, err
		}
		if photoURL != "" {
			m.PhotoURL = &photoURL
		}
		meals = append(meals, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i, m := range meals {
		items, err := s.listItemsForMeal(ctx, m.ID)
		if err != nil {
			return nil, err
		}
		meals[i].Items = items
	}

	return meals, nil
}

func (s *Store) listItemsForMeal(ctx context.Context, mealID string) ([]model.MealItem, error) {
	rows, err := s.db.Query(ctx, `
		select id, meal_id, food_name, quantity_value, quantity_unit, calories, protein_g, carbs_g, fat_g, coalesce(matched_food_id, '')
		from meal_items where meal_id = $1`, mealID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.MealItem
	for rows.Next() {
		var it model.MealItem
		var matchedID string
		if err := rows.Scan(&it.ID, &it.MealID, &it.FoodName, &it.QuantityValue, &it.QuantityUnit,
			&it.Calories, &it.ProteinG, &it.CarbsG, &it.FatG, &matchedID); err != nil {
			return nil, err
		}
		if matchedID != "" {
			it.MatchedFoodID = &matchedID
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func (s *Store) DeleteMeal(ctx context.Context, userID, mealID string) error {
	tag, err := s.db.Exec(ctx, `delete from meals where id = $1 and user_id = $2`, mealID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// --- Themes ---

func (s *Store) ListThemes(ctx context.Context) ([]model.Theme, error) {
	rows, err := s.db.Query(ctx, `select id, name, colors from themes order by id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var themes []model.Theme
	for rows.Next() {
		var t model.Theme
		if err := rows.Scan(&t.ID, &t.Name, &t.Colors); err != nil {
			return nil, err
		}
		themes = append(themes, t)
	}
	return themes, rows.Err()
}

// --- Streaks ---

func (s *Store) GetStreak(ctx context.Context, userID string) (model.Streak, error) {
	var st model.Streak
	err := s.db.QueryRow(ctx,
		`select user_id, current_streak, longest_streak, last_logged_date from streaks where user_id = $1`, userID,
	).Scan(&st.UserID, &st.CurrentStreak, &st.LongestStreak, &st.LastLoggedDate)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Streak{UserID: userID}, nil
	}
	return st, err
}

// UpdateStreakOnLog bumps the streak when a meal is logged: +1 if the last
// logged date was yesterday, unchanged if it was already today, reset to 1
// otherwise.
func (s *Store) UpdateStreakOnLog(ctx context.Context, userID string, loggedAt time.Time) error {
	today := loggedAt.Truncate(24 * time.Hour)
	current, err := s.GetStreak(ctx, userID)
	if err != nil {
		return err
	}

	newStreak := 1
	if current.LastLoggedDate != nil {
		last := current.LastLoggedDate.Truncate(24 * time.Hour)
		switch today.Sub(last).Hours() {
		case 0:
			newStreak = current.CurrentStreak
		case 24:
			newStreak = current.CurrentStreak + 1
		default:
			newStreak = 1
		}
	}
	longest := current.LongestStreak
	if newStreak > longest {
		longest = newStreak
	}

	_, err = s.db.Exec(ctx, `
		insert into streaks (user_id, current_streak, longest_streak, last_logged_date)
		values ($1, $2, $3, $4)
		on conflict (user_id) do update set
			current_streak = excluded.current_streak, longest_streak = excluded.longest_streak,
			last_logged_date = excluded.last_logged_date`,
		userID, newStreak, longest, today,
	)
	return err
}

// --- History ---

// GetDailyTotals returns the last `days` days (oldest first, ending today)
// of aggregated macro totals for the History screen's charts/grid. Days
// with no logged meals come back zero-filled rather than omitted, so the
// caller always gets a contiguous date range to plot.
func (s *Store) GetDailyTotals(ctx context.Context, userID string, days int) ([]model.DayTotal, error) {
	now := time.Now()
	startDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -(days - 1))

	rows, err := s.db.Query(ctx, `
		select date_trunc('day', m.logged_at) as day,
		       coalesce(sum(mi.calories), 0), coalesce(sum(mi.protein_g), 0),
		       coalesce(sum(mi.carbs_g), 0), coalesce(sum(mi.fat_g), 0),
		       count(distinct m.id)
		from meals m
		join meal_items mi on mi.meal_id = m.id
		where m.user_id = $1 and m.logged_at >= $2
		group by day`, userID, startDay)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	byDate := make(map[string]model.DayTotal)
	for rows.Next() {
		var day time.Time
		var dt model.DayTotal
		if err := rows.Scan(&day, &dt.Calories, &dt.ProteinG, &dt.CarbsG, &dt.FatG, &dt.MealsLogged); err != nil {
			return nil, err
		}
		dt.Date = day.Format("2006-01-02")
		byDate[dt.Date] = dt
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	totals := make([]model.DayTotal, days)
	for i := 0; i < days; i++ {
		date := startDay.AddDate(0, 0, i).Format("2006-01-02")
		if dt, ok := byDate[date]; ok {
			totals[i] = dt
		} else {
			totals[i] = model.DayTotal{Date: date}
		}
	}
	return totals, nil
}
