# Doable

A family productivity app that helps households manage tasks, build habits, track rewards, and stay organized together. Built as a cross-platform mobile application with Android support via Capacitor.

## Features

- **Task Management** – Create, assign, and track tasks across family members with due dates and priorities
- **Habit Tracking** – Build and maintain daily/weekly habits with streak tracking and visual progress
- **Rewards & Points System** – Gamified motivation system where completing tasks and habits earns points redeemable for rewards
- **Family Management** – Create or join a family group, invite members, and collaborate on shared responsibilities
- **Intermittent Fasting Tracker** – Track fasting windows with timer and progress visualization
- **Grocery Lists** – Shared grocery lists that sync in real-time across family members
- **Alarms & Reminders** – Push notifications and local alarms to keep everyone on track
- **Voice Capture** – Voice input for quickly adding tasks and notes
- **Authentication** – Secure signup/login with password reset functionality via Supabase Auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| Routing | React Router v7 |
| Backend | Supabase (Auth, Database, Edge Functions, Realtime) |
| Mobile | Capacitor 8 (Android) |
| Build | Vite 8, EAS Build |
| Charts | Recharts |
| Notifications | Firebase Cloud Messaging (FCM), Capacitor Local Notifications |

## Prerequisites

- **Node.js** v18+ and npm
- **Supabase** project (for backend services)
- **Firebase** project (for push notifications)
- **Android Studio** (for Android builds)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Neeraj-Khandelwal/doable-app.git
cd doable-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key (for push notifications) |

### 4. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

## Android Build

This project uses Capacitor to wrap the web app for Android.

```bash
# Build the web app
npm run build

# Sync web assets to the Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

For production builds, this project is configured with [EAS Build](https://docs.expo.dev/build/introduction/) (see `eas.json`).

## Project Structure

```
doable-app/
├── src/
│   ├── components/     # Reusable UI components (alarms, fasting, grocery, habits, etc.)
│   ├── context/        # React context providers (Auth, Family, Task, Habit, Rewards, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page-level components (Home, Tasks, Habits, Family, etc.)
│   ├── services/       # API and service layer
│   ├── styles/         # Global styles
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Root component with routing and providers
│   └── main.tsx        # Application entry point
├── supabase/
│   ├── functions/      # Supabase Edge Functions (send-invite, send-push)
│   └── migrations/     # Database migration files
├── android/            # Capacitor Android project
├── public/             # Static assets
└── index.html          # HTML entry point
```

## Supabase Setup

The app relies on Supabase for:

- **Authentication** – Email/password auth with magic links
- **Database** – PostgreSQL for all app data (tasks, habits, families, rewards, etc.)
- **Edge Functions** – Serverless functions for sending invites and push notifications
- **Realtime** – Live sync of shared data across family members

Database migrations are located in `supabase/migrations/`. Apply them using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

## License

This project is private.
