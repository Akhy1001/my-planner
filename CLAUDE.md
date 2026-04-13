# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

This is a French-language personal productivity app (planner/journal). It is a **client-side heavy** Next.js app using Supabase as the backend (PostgreSQL + Auth).

### Main Views (app/components/)
- `TodayView` — daily tasks + journal (mood, gratitude, intentions, water intake)
- `AgendaView` — calendar events with time slots and colors
- `HabitsView` — habit tracking with streak calculation
- `GoalsView` — long-term goals with milestones and auto-calculated progress
- `NotesView` — tagged, pinnable notes with debounced saves (800ms)

All views are rendered from `app/page.tsx` via a tab router. Navigation lives in `Sidebar.tsx`.

### State Management
No global state library. Each feature has its own hook in `hooks/`:
- `useAuth`, `useTasks`, `useEvents`, `useHabits`, `useGoals`, `useNotes`, `useJournal`
- Hooks own their data fetching and mutations directly via Supabase
- Updates are **optimistic**: UI updates immediately, then syncs to DB

### Styling
- **Inline styles dominate** — Tailwind is available but rarely used
- **CSS variables** define the design system (`--cream`, `--ink`, `--sage`, `--terra`, `--gold`, `--lavender`, etc.) in `app/globals.css`
- Animation entry/exit uses Framer Motion (`motion/react`); reusable variants live in `app/components/animate-ui/animations.ts`
- A pink theme is applied via `data-theme="pink"` for a specific user email

### Key Libraries
- **Supabase** — auth + database (all tables include `user_id` with RLS policies)
- **Framer Motion** — animations throughout
- **date-fns** — date formatting; dates stored as `yyyy-MM-dd` strings in DB
- **Lucide React** — icon fallback; animated custom icons in `app/components/animate-ui/icons/`

### Database Schema
Defined in `lib/database.sql`. Core tables: `tasks`, `events`, `habits`, `habit_completions`, `goals`, `milestones`, `notes`, `daily_journal`. Supabase client is initialized in `lib/supabase.ts`.
