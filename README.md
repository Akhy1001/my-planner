# My Planner

Application de productivité personnelle en français. Pensée pour organiser ses journées, suivre ses habitudes, gérer ses objectifs et prendre des notes — le tout dans une interface épurée.

## Fonctionnalités

- **Aujourd'hui** — tâches du jour, journal (humeur, intentions, hydratation)
- **Agenda** — événements avec créneaux horaires et codes couleur
- **Habitudes** — suivi quotidien avec calcul des séries (*streaks*)
- **Objectifs** — objectifs long terme avec jalons et progression automatique
- **Notes** — notes taguées et épinglables avec sauvegarde automatique

## Prérequis

- [Node.js](https://nodejs.org/) v20 ou supérieur
- npm v10 ou supérieur
- Un projet [Supabase](https://supabase.com/) (gratuit) pour la base de données et l'authentification

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/Akhy1001/my-planner.git
cd my-planner

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
```

Renseigner les valeurs suivantes dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<votre-projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre-clé-anon-publique>
```

Ces valeurs sont disponibles dans **Project Settings > API** sur le tableau de bord Supabase.

> Le schéma de la base de données est défini dans `lib/database.sql`. Exécuter ce fichier dans l'éditeur SQL de Supabase pour initialiser les tables.

## Lancement en local

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Autres commandes

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement avec hot reload |
| `npm run build` | Build de production |
| `npm run start` | Démarrer le build de production |
| `npm run lint` | Analyser le code avec ESLint |

## Structure du projet

```
my-planner/
├── app/
│   ├── components/       # Composants par vue (TodayView, AgendaView, HabitsView…)
│   │   └── animate-ui/   # Icônes animées et variantes Framer Motion
│   ├── globals.css       # Variables CSS du design system
│   └── page.tsx          # Point d'entrée — routeur de vues par onglets
├── hooks/                # Hooks de données (useTasks, useEvents, useHabits…)
├── lib/
│   ├── supabase.ts       # Initialisation du client Supabase
│   └── database.sql      # Schéma de la base de données
└── public/               # Assets statiques
```

## Stack technique

- **Next.js 16** (App Router) + **TypeScript**
- **Supabase** — authentification et base de données PostgreSQL (RLS activé)
- **Framer Motion** — animations d'interface
- **Tailwind CSS** — utilitaires de style
- **date-fns** — manipulation des dates

## Contribuer

1. Créer une branche depuis `main` : `git checkout -b DEV-XXX-description`
2. Commiter les changements de façon atomique avec des messages clairs
3. Ouvrir une Pull Request vers `main`
