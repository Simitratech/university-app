# University App

A mobile-first PWA for tracking academic progress, study sessions, finances, fitness, and daily happiness. Built with iOS 26-inspired glassmorphism design.

## Overview

University App is a shared family academic and life platform that allows students and parents to track:
- **Degree Progress**: 60-credit associate degree tracking with class status management
- **Study Sessions**: Pomodoro timer with session logging and weekly/monthly stats  
- **Budget & Money**: Income, expenses, credit cards, and emergency fund tracking
- **Wellness**: Gym sessions, movement tracking, and daily happiness journaling
- **Daily Goals**: Track study, movement, and happiness completion each day

## Architecture: Replit DB Single-Student Model

The app uses **Replit DB as the single source of truth** with a unified JSON structure:
- **Single JSON Object**: All student data stored under key `student:michael` in Replit DB
- **Data Structure**: One unified `StudentData` object containing all arrays:
  - `classes`, `exams`, `studySessions`, `gymSessions`, `happinessEntries`, `gradingCategories`, `expenses`, `income`, `creditCards`, etc.
- **StudentDataProvider**: React context that hydrates state on load and persists changes via POST /api/student
- **API Endpoints**:
  - `GET /api/student`: Loads full student data from Replit DB
  - `POST /api/student`: Saves full updated student object to Replit DB
- **Multiple Users**: Multiple users (student + parents) can log in and all share the same data
- **User Roles**: 
  - `student`: Can create and edit all data
  - `parent`: Read-only access (can view all data but cannot modify)

Key files for data architecture:
- `shared/schema.ts`: StudentData types and individual entity types
- `client/src/lib/student-data-provider.tsx`: React context for data hydration and mutations
- `server/routes.ts`: GET/POST /api/student endpoints using Replit DB

## Tech Stack

- **Frontend**: React with Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: Replit DB (JSON storage) for student data, PostgreSQL for auth/user_settings only
- **Authentication**: Replit Auth (OpenID Connect)
- **Styling**: iOS 26 glassmorphism with dark/light theme support

## Project Structure

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── BottomNav.tsx        # iOS-style bottom navigation
│   │   ├── Header.tsx           # App header with user menu
│   │   ├── GlassCard.tsx        # Glassmorphic card components
│   │   ├── DegreeProgress.tsx   # Pie chart for degree tracking
│   │   ├── PomodoroTimer.tsx    # Study timer component
│   │   ├── DailyChecklist.tsx   # Daily goals tracker
│   │   └── EmptyState.tsx       # Empty/loading states
│   ├── pages/          # App pages
│   │   ├── Landing.tsx          # Unauthenticated landing
│   │   ├── Home.tsx             # Dashboard
│   │   ├── Degree.tsx           # Class management
│   │   ├── Study.tsx            # Pomodoro & study stats
│   │   ├── Money.tsx            # Budget management
│   │   ├── Wellness.tsx         # Gym & happiness
│   │   └── Settings.tsx         # User settings
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and providers

server/
├── routes.ts           # API endpoints
├── storage.ts          # Database operations
├── db.ts               # Drizzle database connection
└── replit_integrations/auth/  # Authentication module

shared/
├── schema.ts           # Drizzle schema definitions
└── models/auth.ts      # Auth-related models
```

## Key Features

### Home Dashboard
- Degree progress pie chart (green=completed, yellow=in-progress, red=remaining)
- Daily goals checklist (study, movement, happiness)
- Weekly study time and gym sessions stats
- Next exam countdown
- Latest happiness entry

### Degree & Classes
- Add/edit classes with credits, status, grade, semester
- Filter by status (completed, in-progress, remaining, failed)
- Automatic progress calculation

### Study Timer
- 25/5 Pomodoro timer with pause/resume
- Link sessions to specific classes
- Track daily, weekly, monthly study time
- View upcoming exams

### Money Management
- Track income sources (work, parent contributions, extra)
- Log expenses by category
- Credit card tracking with payment status
- Emergency fund progress (3-month goal)

### Wellness
- Log gym sessions, walks, home workouts
- Weekly movement goal tracking (90 min/week)
- Daily happiness journaling
- Historical entries view

### Coach Messaging System
The app includes supportive coach messaging for calm, non-judgmental guidance:

- **Daily Coach Messages**: 30 rotating messages based on day-of-month, shown on Home page
- **Exam-Specific Messages**: Pre-exam (2-3 days before), exam day, and post-exam (up to 3 days after)
- **Recovery Flow**: When returning after 2+ inactive days:
  - Shows soft recovery message ("Welcome back. Nothing to fix.")
  - Offers one suggested action (study, move, or happy)
  - Automatically dismisses when user completes any activity
  - No penalties, lost streaks, or negative messaging
- **Exam Week Mode**: Automatically activates when exams are within 7 days:
  - Softer, muted background colors (no decorative gradients)
  - Next Exam card elevated to top of Home page
  - Non-essential sections hidden (Degree Progress, Stats, Happiness)
  - Daily Checklist remains visible
  - Exam-specific coach messages: "Focus on what's in front of you."
  - Returns to normal layout automatically after exam week ends
  - No alerts, warnings, or extra reminders

## API Endpoints

All endpoints require authentication via Replit Auth.

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create class
- `PATCH /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Exams
- `GET /api/exams` - Get all exams
- `POST /api/exams` - Create exam
- `PATCH /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

### Study Sessions
- `GET /api/study-sessions` - Get all sessions
- `GET /api/study-sessions/week` - Get this week's sessions
- `POST /api/study-sessions` - Log session

### Budget
- `GET /api/income` - Get monthly income
- `POST /api/income` - Update income
- `GET /api/expenses` - Get monthly expenses
- `POST /api/expenses` - Add expense
- `GET /api/credit-cards` - Get credit cards
- `POST /api/credit-cards` - Add card
- `PATCH /api/credit-cards/:id` - Update card
- `GET /api/emergency-fund` - Get emergency fund

### Wellness
- `GET /api/gym-sessions` - Get gym sessions
- `POST /api/gym-sessions` - Log session
- `GET /api/happiness` - Get happiness entries
- `POST /api/happiness` - Add entry
- `GET /api/daily-tracking/today` - Get today's goals

## Development

The app runs on port 5000. Start with:
```bash
npm run dev
```

Push database changes:
```bash
npm run db:push
```

## Design System

The app uses iOS 26-inspired glassmorphism:
- Translucent cards with backdrop blur
- Dark mode default with light mode toggle
- Rounded corners (2xl for cards)
- Gradient backgrounds
- Touch-friendly 44px minimum tap targets
- Bottom navigation bar (5 items max)
