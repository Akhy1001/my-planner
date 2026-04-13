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

# Comportement global de Claude Code

## Démarrage de session

Au début de chaque nouvelle session de travail, tu dois :

1. Lire le fichier `CLAUDE.md` local du projet s'il existe
2. Identifier si un ticket Linear est mentionné ou en cours
3. Si un ticket est identifié → appliquer automatiquement
   la logique de planification (voir section "Planification")
4. Si aucun contexte n'est établi → demander :
   "Sur quel ticket travaille-t-on ? (ex: PROJ-123)"

## Planification

Quand un ticket Linear est fourni, tu dois toujours :

1. Récupérer le ticket via l'outil MCP `linear-server`
   (`get_issue` avec l'ID du ticket)
2. Analyser : titre, description, critères d'acceptation
3. Explorer les fichiers du projet pertinents
4. Produire un plan structuré avec :
   - **Résumé** : ce que la tâche accomplit en une phrase
   - **Fichiers à créer ou modifier**
   - **Étapes de développement** ordonnées et actionnables
   - **Points d'attention** : risques, dépendances, cas limites

Présente ce plan en français et attends validation
avant de commencer à coder.

## Règles générales

- Toujours répondre en français
- Ne jamais commencer à coder sans plan validé
- Signaler les ambiguïtés avant de faire des suppositions
- Préférer des commits atomiques et bien nommés