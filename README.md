# MacroLens

AI-powered nutrition & macro tracker. Snap a photo or type a meal — get calories, protein, carbs, and fat automatically.

## Structure

- `backend/` — Go/Gin API (auth, meals, goals, themes, AI meal recognition, nutrition lookups)
- `mobile/` — React Native (Expo) app

## Status

Pre-design: PRD is final, UI/UX design handoff from Claude Designer is pending. This scaffold sets up backend and mobile project structure so screens/features can be filled in once design lands.

## Running locally

**Backend**
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, NUTRITION_API_KEY
go run main.go
```

**Mobile**
```bash
cd mobile
npm install
npx expo start
```
