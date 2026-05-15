# Doable App – Local Setup & Deployment Guide

## Overview

Doable is a React + TypeScript application built with Vite, styled with Tailwind CSS, and powered by Supabase as the backend. It also ships as an Android app using Capacitor.

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (ships with Node.js)
- **Git**
- A **Supabase** project (free tier works for development)
- *(Optional for Android)* Android Studio with SDK installed, Java 17+

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Neeraj-Khandelwal/doable-app.git
cd doable-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `VITE_FIREBASE_API_KEY` | Firebase API key (used for push notifications) |

You can find Supabase credentials in your Supabase dashboard under **Settings → API**.

### 4. Set Up Supabase Database

Run the SQL migration files in order against your Supabase database (via the Supabase SQL Editor or CLI):

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_enable_rls.sql
supabase/migrations/003_habits.sql
supabase/migrations/004_rewards.sql
supabase/migrations/005_rating_config.sql
supabase/migrations/006_fasting.sql
supabase/migrations/007_grocery.sql
supabase/migrations/009_kid_point_events.sql
supabase/migrations/010_alarms.sql
supabase/migrations/011_fcm_tokens.sql
```

**Using the Supabase CLI** (recommended):

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link your project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

### 5. Deploy Supabase Edge Functions (Optional)

If you need push notifications or invite functionality:

```bash
supabase functions deploy send-push
supabase functions deploy send-invite
```

### 6. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173** (default Vite port).

### 7. Other Useful Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Android Development (Capacitor)

### 1. Build the Web App

```bash
npm run build
```

### 2. Sync with Capacitor

```bash
npx cap sync android
```

### 3. Open in Android Studio

```bash
npx cap open android
```

### 4. Run on Device/Emulator

Use Android Studio to run the app on a connected device or emulator.

---

## Deployment

### Web Deployment

The app builds to a static `dist/` folder and can be deployed to any static hosting provider.

#### Option A: Vercel (Recommended)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set the **Framework Preset** to `Vite`.
3. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FIREBASE_API_KEY`) in the Vercel project settings.
4. Deploy — Vercel will auto-deploy on every push to `main`.

#### Option B: Netlify

1. Connect your GitHub repository to [Netlify](https://netlify.com).
2. Set the build command to `npm run build` and publish directory to `dist`.
3. Add environment variables in the Netlify site settings.
4. Deploy.

#### Option C: Manual / Self-Hosted

```bash
npm run build
# Upload the `dist/` folder to your web server or CDN
```

### Android Deployment (Google Play Store)

The project uses EAS (Expo Application Services) configuration for builds:

#### Preview Build (APK for testing)

```bash
npx cap sync android
cd android
./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/`.

#### Production Build (AAB for Play Store)

```bash
npx cap sync android
cd android
./gradlew bundleRelease
```

The AAB will be at `android/app/build/outputs/bundle/release/`.

Upload the `.aab` file to the [Google Play Console](https://play.google.com/console).

### Supabase (Backend)

Supabase handles hosting for the database and edge functions. To deploy updates:

```bash
# Push database migrations
supabase db push

# Deploy edge functions
supabase functions deploy send-push
supabase functions deploy send-invite
```

---

## Project Structure

```
doable-app/
├── src/                  # React application source
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   ├── services/         # API/service layer
│   ├── utils/            # Utility functions
│   └── supabaseClient.ts # Supabase client initialization
├── supabase/
│   ├── migrations/       # Database migration SQL files
│   └── functions/        # Supabase Edge Functions
├── android/              # Capacitor Android project
├── public/               # Static assets
├── .env.example          # Environment variable template
├── capacitor.config.ts   # Capacitor configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Node.js dependencies and scripts
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `VITE_SUPABASE_URL` not found | Ensure `.env` file exists in the project root with correct values |
| Supabase connection errors | Verify your Supabase project is active and credentials are correct |
| Android build fails | Ensure Android Studio SDK and Java 17+ are installed |
| `cap sync` errors | Run `npm run build` first to generate the `dist/` folder |
