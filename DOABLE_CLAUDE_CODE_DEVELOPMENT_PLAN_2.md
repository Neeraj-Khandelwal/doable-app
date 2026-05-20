# Doable Android App – Claude Code Development Plan
**Version:** 2.3  
**Date:** May 20, 2026  
**Status:** Active Development — Phases 1–20 Complete + Enhancements — Closed Testing  
**Platform:** Android 10+ (API 29+)  
**Tech Stack:** React + Tailwind CSS + Supabase + Capacitor + EAS Build  

---

## 📋 Table of Contents
1. [Overview & Setup](#overview--setup)
2. [Phase 1: Project Initialization (Day 1)](#phase-1-project-initialization-day-1)
3. [Phase 2: Core Frontend Setup (Days 2-3)](#phase-2-core-frontend-setup-days-2-3)
4. [Phase 3: Authentication Module (Days 4-5)](#phase-3-authentication-module-days-4-5)
5. [Phase 4: Family Management (Days 6-7)](#phase-4-family-management-days-6-7)
6. [Phase 5: Task Management (Days 8-10)](#phase-5-task-management-days-8-10)
7. [Phase 6: Habit Tracking (Days 11-12)](#phase-6-habit-tracking-days-11-12)
8. [Phase 7: Rewards & Points System (Days 13-14)](#phase-7-rewards--points-system-days-13-14)
9. [Phase 8: Intermittent Fasting Tracker (Days 15-16)](#phase-8-intermittent-fasting-tracker-days-15-16)
10. [Phase 9: Grocery List Feature (Days 17-18)](#phase-9-grocery-list-feature-days-17-18)
11. [Phase 10: Alarms & Reminders (Days 19-20)](#phase-10-alarms--reminders-days-19-20)
12. [Phase 11: Voice Integration & Google Assistant (Days 21-22)](#phase-11-voice-integration--google-assistant-days-21-22)
13. [Phase 12: Android Wrap & Build (Days 23-24)](#phase-12-android-wrap--build-days-23-24)
14. [Phase 13: Testing & Validation (Days 25)](#phase-13-testing--validation-day-25)
15. [Appendix: Claude Code Workflow](#appendix-claude-code-workflow)

---

## Overview & Setup

### Success Criteria
✅ Fully functional Doable app running on Android phone  
✅ All 14 core features implemented (auth, family, tasks, habits, rewards, fasting, grocery, alarms, voice)  
✅ Real-time sync via Supabase  
✅ Push notifications via FCM  
✅ Ready to submit to Google Play Store  

### Your Development Environment
- **OS:** Windows 10/11
- **Node.js:** v24.15.0
- **npm:** 11.12.1
- **Git:** v2.54.0
- **VS Code:** Installed with Live Server + Prettier
- **GitHub:** Account ready
- **Claude Code:** Available for agentic development

### Key Dependencies
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.x",
  "tailwindcss": "^3.x",
  "@supabase/supabase-js": "^2.x",
  "@capacitor/core": "^5.x",
  "@capacitor/android": "^5.x",
  "@capacitor/push-notifications": "^5.x",
  "recharts": "^2.x"
}
```

---

## Phase 1: Project Initialization (Day 1)

### Objective
Set up the React project, install dependencies, configure Supabase, and establish the project structure.

### Step 1.1: Create React Project via Claude Code
**Instructions:**
1. Open Claude Code in your terminal
2. Ask Claude to create a new React project with Vite:
   ```
   "Create a new React project called 'doable-app' using Vite with TypeScript and Tailwind CSS. 
   Use npm as the package manager. Install all necessary dependencies: 
   react-router-dom, @supabase/supabase-js, recharts, and axios."
   ```
3. **What Claude Code will do:**
   - Initialize Vite React project
   - Install dependencies
   - Configure Tailwind CSS
   - Create basic folder structure

### Step 1.2: Initialize Supabase Project
**Instructions:**
1. Go to [supabase.com](https://supabase.com) and create a free project
2. Create a new database (PostgreSQL)
3. Get your **Project URL** and **Anon Key** from Settings > API
4. Ask Claude Code to:
   ```
   "Create a supabaseClient.js file in the src folder with the following:
   - Import @supabase/supabase-js
   - Create and export a Supabase client using the project URL: [YOUR_URL]
   - Use the anon key: [YOUR_ANON_KEY]
   - Add error handling for connection issues"
   ```

### Step 1.3: Set Up Environment Variables
**Instructions:**
1. Ask Claude Code:
   ```
   "Create a .env.local file in the project root with the following:
   - VITE_SUPABASE_URL=[your_supabase_url]
   - VITE_SUPABASE_ANON_KEY=[your_anon_key]
   - VITE_FIREBASE_API_KEY=[placeholder_for_now]
   - Add a .env.example file showing the structure (without secrets)"
   ```
2. Update `supabaseClient.js` to use environment variables via `import.meta.env`

### Step 1.4: Create Project Directory Structure
**Instructions:**
Ask Claude Code to create this folder structure:
```
doable-app/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── family/
│   │   ├── tasks/
│   │   ├── habits/
│   │   ├── rewards/
│   │   ├── fasting/
│   │   ├── grocery/
│   │   ├── alarms/
│   │   ├── common/
│   │   └── layout/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Tasks.jsx
│   │   ├── Habits.jsx
│   │   ├── Alarms.jsx
│   │   ├── Family.jsx
│   │   └── Profile.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useTasks.js
│   │   └── useFamily.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── FamilyContext.jsx
│   ├── utils/
│   │   ├── dateUtils.js
│   │   ├── colorUtils.js
│   │   └── notificationUtils.js
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env.local
├── .env.example
├── vite.config.js
├── tailwind.config.js
└── package.json
```

### Step 1.5: Create Basic App Shell
**Instructions:**
Ask Claude Code to create `App.jsx`:
```
"Create App.jsx with:
- React Router setup with routes for: /login, /signup, /home, /tasks, /habits, /alarms, /family, /profile
- A Layout component wrapping all authenticated pages
- Auth context provider
- Bottom navigation component (placeholder)
- Mobile-first 375px viewport
- Tailwind CSS applied (bg-white, text-gray-900)"
```

### Step 1.6: Verify Installation
**Instructions:**
1. Ask Claude Code to start the dev server:
   ```
   "Start the development server using 'npm run dev'. 
   The app should be available at http://localhost:5173/"
   ```
2. Open browser and verify you see the React app running

**Deliverable for Phase 1:**
- ✅ React project initialized with Vite
- ✅ Supabase client configured
- ✅ Environment variables set up
- ✅ Project structure created
- ✅ Basic routing in place
- ✅ Dev server running locally

---

## Phase 2: Core Frontend Setup (Days 2-3)

### Objective
Build the layout, design system, bottom navigation, and reusable UI components.

### Step 2.1: Create Design System & Tailwind Config
**Instructions:**
Ask Claude Code:
```
"Update tailwind.config.js to include:
- Extend colors with: peach (#FF8F5E), lavender (#7C6FF0), mint (#2EB87A), 
  sky (#2FA8E0), amber (#E8A800), rose (#E85450)
- Custom fontFamily for Nunito (add to index.html: Google Fonts import)
- Custom borderRadius: sm (6px), md (10px), lg (12px), xl (16px), full (22px)
- Custom spacing: base unit 4px (already default)
- Extend shadows with card shadow (0 1px 3px rgba(0,0,0,0.1))
- Dark mode disabled for mobile-first design"
```

### Step 2.2: Create Layout Component
**Instructions:**
Ask Claude Code to create `src/components/layout/Layout.jsx`:
```
"Create Layout component with:
- Header bar (fixed top, title, minimal)
- Main content area (pb-20 to avoid nav overlap)
- BottomNav component (fixed bottom)
- Responsive to 375px mobile viewport
- Tailwind classes: bg-white, min-h-screen"
```

### Step 2.3: Build Bottom Navigation
**Instructions:**
Ask Claude Code to create `src/components/layout/BottomNav.jsx`:
```
"Create BottomNav with:
- 5 nav items: Home (icon), Tasks (icon), Alarms (icon), Family (icon), Profile (icon)
- Fixed position at bottom, 80px height
- Active state (sky blue #2FA8E0 color)
- React Router Link integration
- Icons: use emoji or simple SVG icons
- Mobile responsive, full width
- Rounded top corners"
```

### Step 2.4: Create Reusable Card Component
**Instructions:**
Ask Claude Code to create `src/components/common/Card.jsx`:
```
"Create Card component that accepts:
- children (required)
- leftBorderColor (optional, default sky)
- className (optional)
- onClick (optional)
- Props should output:
  - White background
  - Rounded 12px corners
  - Padding 16px
  - Light shadow
  - Left border 4px with accent color
  - Flex column layout"
```

### Step 2.5: Create Button Component
**Instructions:**
Ask Claude Code to create `src/components/common/Button.jsx`:
```
"Create Button component with:
- Variants: primary (sky blue), success (mint), danger (rose), ghost (gray)
- Sizes: small (sm), medium (md), large (lg)
- Default: px-4 py-3, rounded-10, font-bold
- Props: label, onClick, disabled, loading, variant, size, className
- On hover: opacity-90 transition
- Disabled state: opacity-50, cursor-not-allowed"
```

### Step 2.6: Create Input Component
**Instructions:**
Ask Claude Code to create `src/components/common/Input.jsx`:
```
"Create Input component with:
- Props: label, placeholder, type, value, onChange, error, required
- Styling: bg-gray-100, rounded-10, px-4 py-3
- Focus ring: ring-2 ring-sky-500
- Label above input
- Error message in rose color below
- Support for password, email, text, number types"
```

### Step 2.7: Create Modal Component
**Instructions:**
Ask Claude Code to create `src/components/common/Modal.jsx`:
```
"Create Modal component with:
- Props: isOpen, onClose, title, children, footer (optional)
- Fixed position covering full screen
- bg-white rounded-22 positioned at bottom (slide-up animation)
- Dark overlay with opacity-50
- Close button (X icon) top right
- Support for form content inside
- Animation: slide from bottom on open, slide down on close"
```

### Step 2.8: Create Badge/Status Components
**Instructions:**
Ask Claude Code to create `src/components/common/Badge.jsx`:
```
"Create Badge component with:
- Props: label, color (peach, lavender, mint, sky, amber, rose)
- Styles: rounded-full, px-3 py-1, font-semibold, text-sm
- Background color matches the color prop
- White text
- Example usage: <Badge label='High Priority' color='rose' />"
```

**Deliverable for Phase 2:**
- ✅ Design system configured
- ✅ Layout with header and bottom nav
- ✅ Reusable Card, Button, Input, Modal, Badge components
- ✅ Basic page shells (Home, Tasks, Habits, Alarms, Family, Profile)
- ✅ Tailwind CSS fully applied
- ✅ Mobile-first 375px layout verified

---

## Phase 3: Authentication Module (Days 4-5)

### Objective
Implement email/password signup and login with Supabase Auth.

### Step 3.1: Create Auth Context
**Instructions:**
Ask Claude Code to create `src/context/AuthContext.jsx`:
```
"Create AuthContext with:
- State: user (current user object), loading, error
- Methods: signup(email, password), login(email, password), logout(), checkAuth()
- Use Supabase auth methods:
  - supabase.auth.signUp() for signup
  - supabase.auth.signInWithPassword() for login
  - supabase.auth.signOut() for logout
  - supabase.auth.onAuthStateChange() for persistence
- Error handling: set error message on failure
- Loading state during auth operations"
```

### Step 3.2: Create useAuth Hook
**Instructions:**
Ask Claude Code to create `src/hooks/useAuth.js`:
```
"Create useAuth hook that:
- Returns { user, loading, error, signup, login, logout }
- Wraps AuthContext with error boundary
- Allows any component to access auth state and methods
- Example: const { user, login } = useAuth()"
```

### Step 3.3: Create Signup Page
**Instructions:**
Ask Claude Code to create `src/pages/Auth/Signup.jsx`:
```
"Create Signup page with:
- Form fields: Email (required, valid email), Password (required, ≥8 chars), Confirm Password
- Button: 'Create Account' (primary)
- Link: 'Already have account? Log in' → /login
- Form validation: real-time, show error messages
- On submit: call signup() from useAuth
- On success: navigate to /family-setup
- Loading state: disable button, show spinner
- Responsive: centered form, full width on mobile"
```

### Step 3.4: Create Login Page
**Instructions:**
Ask Claude Code to create `src/pages/Auth/Login.jsx`:
```
"Create Login page with:
- Form fields: Email (required), Password (required)
- Button: 'Log In' (primary)
- Link: 'Don't have account? Sign up' → /signup
- Forgot Password link (placeholder for now)
- Form validation and error display
- On submit: call login() from useAuth
- On success: check if family exists, navigate to /home or /family-setup
- Loading and error states
- Responsive centered layout"
```

### Step 3.5: Create Protected Route Component
**Instructions:**
Ask Claude Code to create `src/components/auth/ProtectedRoute.jsx`:
```
"Create ProtectedRoute component that:
- Wraps routes requiring authentication
- If not authenticated: redirect to /login
- If authenticated: render the route
- Show loading spinner while checking auth status
- Use useAuth hook to check user state"
```

### Step 3.6: Update App.jsx with Auth Routes
**Instructions:**
Ask Claude Code to update `App.jsx`:
```
"Update App.jsx to:
- Import ProtectedRoute, Signup, Login pages
- Add public routes: /login, /signup
- Wrap other routes with ProtectedRoute
- Handle loading state on first app load
- AuthProvider wraps entire app
- Test: should redirect to login if not authenticated"
```

### Step 3.7: Create Supabase Auth Tables (RLS Policies)
**Instructions:**
In Supabase Dashboard, ask Claude Code to provide SQL:
```
"I need to set up basic RLS policies for Supabase.
Provide the SQL to:
1. Enable RLS on auth.users (built-in)
2. Create users table (extends auth.users):
   - id (UUID, pk)
   - email (text)
   - created_at (timestamp)
3. Create family_members table:
   - id (UUID, pk)
   - user_id (UUID, FK to users)
   - family_id (UUID, FK to families)
   - role (text: 'owner' or 'partner')
4. Set RLS: users can only see their own record"
```

Run this SQL in Supabase SQL Editor.

**Deliverable for Phase 3:**
- ✅ Auth context and hooks working
- ✅ Signup/Login pages with validation
- ✅ Session persistence across app restart
- ✅ Protected routes in place
- ✅ Supabase Auth tables and RLS configured
- ✅ Error handling and loading states

---

## Phase 4: Family Management (Days 6-7)

### Objective
Implement family setup, invite system, kid profiles, and family settings.

### Step 4.1: Create Family Data Models
**Instructions:**
Ask Claude Code to create `src/utils/familyModels.js`:
```
"Define TypeScript/JSDoc types for:
- Family { id, name, owner_id, invite_code, created_at, updated_at, max_members }
- FamilyMember { id, family_id, user_id, role, joined_at }
- KidProfile { id, family_id, name, color, created_at, order }
- Valid colors: lavender, peach, mint, sky, amber, rose"
```

### Step 4.2: Create Supabase Family Tables
**Instructions:**
Ask Claude Code to generate SQL for:
```
"Provide SQL to create:
1. families table (owner_id, name, invite_code, max_members=6)
2. family_members table (family_id, user_id, role: 'owner'/'partner')
3. kid_profiles table (family_id, name, color, order)
4. Enable RLS:
   - Only family members can access family_members/kid_profiles
   - Only owner/partner can modify family records"
```

Run in Supabase SQL Editor.

### Step 4.3: Create FamilyContext
**Instructions:**
Ask Claude Code to create `src/context/FamilyContext.jsx`:
```
"Create FamilyContext with:
- State: currentFamily, members (list), kids (list), loading, error
- Methods: 
  - createFamily(name): create family, auto-generate invite code
  - invitePartner(email): send email with invite link + code
  - joinFamily(code): partner joins with code
  - addKid(name, color): owner adds kid profile
  - removeKid(kidId): owner removes kid (cascade delete related tasks/habits)
  - getFamily(): fetch current family
  - getMembers(): fetch family members
  - getKids(): fetch kid profiles
- Real-time subscription to changes"
```

### Step 4.4: Create Family Setup Wizard
**Instructions:**
Ask Claude Code to create `src/pages/FamilySetup/index.jsx`:
```
"Create multi-step family setup:
Step 1: Family Name
  - Input field: 'Family Name'
  - Button: 'Create Family'
Step 2: Add Kids (Optional)
  - List existing kids (if returning user)
  - Form: add kid name + color picker
  - Button: '+ Add Another Kid'
  - Button: 'Done'
Step 3: Partner Invite (Optional)
  - Input: Partner email
  - Button: 'Send Invite'
  - Skip option
Step 4: Complete
  - Summary of family setup
  - Button: 'Go to Home'
  
Use FamilyContext to save data
Navigate: Step 1 → 2 → 3 → 4"
```

### Step 4.5: Create Family Settings Page
**Instructions:**
Ask Claude Code to create `src/pages/Family/Settings.jsx`:
```
"Create family settings page with tabs:
Tab 1: Family Info
  - Family name (edit)
  - Member list with roles
  - Invite code (copy button)
  - Max members: 6
Tab 2: Kids Management
  - List all kids with color badges
  - Edit kid name/color
  - Delete kid (with confirmation)
  - Add new kid
Tab 3: Permissions (Owner only)
  - Toggle: Partner can view kid tasks
  - Toggle: Partner can modify kid rewards
  - Toggle: Partner can invite people
Tab 4: Danger Zone
  - Leave family (Partner)
  - Delete family (Owner only, with confirmation)"
```

### Step 4.6: Create Invite Email Handler
**Instructions:**
Ask Claude Code:
```
"Set up invite email flow:
1. Create Supabase Edge Function (serverless):
   - Receives: family_id, partner_email, invite_code
   - Uses Resend API (free tier, 3,000 emails/month)
   - Sends email with deep link: doable://invite?code=[code]
2. Add Resend API key to Supabase secrets
3. Provide Node.js code example for testing locally"
```

Note: Edge Functions will be deployed when we push to Supabase.

### Step 4.7: Create Join Family Flow
**Instructions:**
Ask Claude Code to create `src/pages/FamilySetup/JoinFamily.jsx`:
```
"Create join family page:
- URL param: ?code=[invite_code]
- Auto-populate invite code from URL
- Input field: Partner email (pre-filled if available)
- Button: 'Join Family'
- On success: add to family_members with role='partner', navigate to /home
- Error handling: invalid code, email mismatch, already member"
```

**Deliverable for Phase 4:**
- ✅ Family creation and management
- ✅ Kid profile creation with color coding
- ✅ Partner invite system (email placeholder)
- ✅ Family settings page (owner/partner)
- ✅ FamilyContext with real-time sync
- ✅ Supabase tables and RLS policies

---

## Phase 5: Task Management (Days 8-10)

### Objective
Build full task management with multi-assignee support, recurring tasks, and rating modal.

### Step 5.1: Create Task Data Model
**Instructions:**
Ask Claude Code to create `src/utils/taskModels.js`:
```
"Define Task model:
- id, family_id, created_by (user_id)
- title (required), description
- assignees (array: 'me' or array of kid_ids)
- due_date, reminder_time, reminder_type (notification/alarm/nudge)
- nudge_interval (5/10/15/30/60 min)
- priority (high/medium/low)
- category (home/work/health/shopping/kids/school/finance/other)
- recurrence (none/daily/weekly/monthly)
- completed_by (user_id who marked done)
- completed_at (timestamp)
- ratings (array of { kid_id, rating_type, points, timestamp })
- is_overdue (computed: due_date < today && !completed)"
```

### Step 5.2: Create Supabase Task Tables
**Instructions:**
Ask Claude Code to generate SQL:
```
"Provide SQL for:
1. tasks table (all fields above)
2. task_ratings table (task_id, kid_id, rating_type, points, created_at)
3. Enable RLS:
   - All family members can view family tasks
   - Only owner can create/modify/delete
   - Auto-timestamp on create/update"
```

Run in Supabase SQL Editor.

### Step 5.3: Create Task Context and Hook
**Instructions:**
Ask Claude Code to create:
- `src/context/TaskContext.jsx`
- `src/hooks/useTasks.js`

```
"Create TaskContext with methods:
- getTasks(filters): all/active/done/overdue/high-priority/by-category
- createTask(taskData)
- updateTask(taskId, updates)
- deleteTask(taskId)
- markTaskComplete(taskId, assignee_kid_id)
- rateTask(taskId, kid_id, rating)
- State: tasks, loading, error
- Real-time subscription to task changes"
```

### Step 5.4: Create Task Card Component
**Instructions:**
Ask Claude Code to create `src/components/tasks/TaskCard.jsx`:
```
"Create TaskCard showing:
- Title (bold)
- Assignees (badges: 'Me' or kid names with colors)
- Due date (red if overdue, gray if future)
- Priority badge (high=rose, medium=amber, low=gray)
- Category tag
- Completion status (checkbox or checkmark)
- On click: open task detail/edit modal
- Props: task, onComplete, onEdit, onDelete"
```

### Step 5.5: Create Add/Edit Task Modal
**Instructions:**
Ask Claude Code to create `src/components/tasks/TaskModal.jsx`:
```
"Create modal with form:
- Fields: Title, Description, Assignees (multi-select: Me/Each Kid/All Kids),
  Due date (date picker), Reminder time (time picker), Alert type (radio),
  Nudge interval (dropdown), Priority (radio), Category (dropdown),
  Recurrence (radio: none/daily/weekly/monthly)
- Validation: title required, assignees required
- Actions: Save, Delete (if editing), Cancel
- Preset buttons: Today, Tomorrow, Next Week
- On save: call createTask or updateTask
- Show loading spinner while saving"
```

### Step 5.6: Create Task Rating Modal
**Instructions:**
Ask Claude Code to create `src/components/tasks/RatingModal.jsx`:
```
"Create modal shown when marking kid task complete:
- Title: 'Rate [Task Name] for [Kid Name]'
- For each assigned kid: rating selector (Awesome/Good/Ok Ok/Very Bad with emojis)
- Confirm button (disabled until all kids rated)
- Cancel button
- On confirm: call rateTask() for each kid, then mark task complete
- Show points earned for each rating
- Animation: slide up"
```

### Step 5.7: Build Tasks Page
**Instructions:**
Ask Claude Code to create `src/pages/Tasks.jsx`:
```
"Create Tasks page with:
- Filter tabs: All / Active / Done / High Priority
- Category filter dropdown
- Task list (sorted by due date, overdue first)
- Empty state message if no tasks
- FAB button: '+ Add Task'
- On task click: open detail view
- On task complete: show RatingModal if kid task, else mark complete directly
- Real-time updates from TaskContext
- Pull-to-refresh to reload"
```

### Step 5.8: Implement Recurring Tasks
**Instructions:**
Ask Claude Code:
```
"Implement recurring task logic:
1. On task completion: if recurrence != 'none', auto-create next occurrence
2. Next occurrence: due_date = due_date + 1 day (daily) / 7 days (weekly) / 1 month (monthly)
3. Copy all fields (assignees, priority, category, etc.) to next occurrence
4. Database: don't duplicate; instead update recurrence logic in createTask
5. Test: create daily task, complete it, verify next task appears tomorrow"
```

**Deliverable for Phase 5:**
- ✅ Task CRUD operations working
- ✅ Multi-assignee task support with kid rating modal
- ✅ Task filtering and sorting
- ✅ Recurring task auto-creation
- ✅ Real-time task sync
- ✅ Responsive task UI on 375px mobile

---

## Phase 6: Habit Tracking (Days 11-12)

### Objective
Implement habit creation, daily tracking, streak counting, and 7-day calendar view.

### Step 6.1: Create Habit Data Model
**Instructions:**
Ask Claude Code to create `src/utils/habitModels.js`:
```
"Define Habit model:
- id, family_id, created_by (user_id)
- name, icon (emoji), frequency (daily/weekly/weekdays)
- assigned_to ('owner' or kid_id)
- created_at
- HabitCompletion:
  - id, habit_id, user_id, completed_date, rating (if kid habit)
- Streak: computed from consecutive completed days
- Calculate: last_7_days_status (green/red/orange dots)"
```

### Step 6.2: Create Supabase Habit Tables
**Instructions:**
Ask Claude Code to generate SQL:
```
"Provide SQL for:
1. habits table (all fields above)
2. habit_completions table (habit_id, user_id, completed_date, rating_id)
3. Enable RLS:
   - All family members can view family habits
   - Only owner can create/modify/delete
   - Completions reset at midnight"
```

Run in Supabase SQL Editor.

### Step 6.3: Create HabitContext and Hook
**Instructions:**
Ask Claude Code to create:
- `src/context/HabitContext.jsx`
- `src/hooks/useHabits.js`

```
"Create HabitContext with methods:
- getHabits(assignee): get all habits (filter by owner or kid)
- createHabit(habitData)
- updateHabit(habitId, updates)
- deleteHabit(habitId)
- markHabitComplete(habitId, date, rating)
- getStreak(habitId): calculate consecutive days
- get7DayHistory(habitId): return array of [green/red/orange] for last 7 days
- State: habits, loading, error
- Real-time subscription"
```

### Step 6.4: Create Habit Card Component
**Instructions:**
Ask Claude Code to create `src/components/habits/HabitCard.jsx`:
```
"Create HabitCard showing:
- Icon (emoji)
- Name
- Frequency (Daily / Weekly / Weekdays)
- 7-day dot calendar (green=done, red=missed, orange=today)
- Streak counter (e.g., '7 day streak!')
- Completion status (checkbox or button)
- On click: mark complete (show RatingModal if kid habit)
- Props: habit, onComplete, onEdit"
```

### Step 6.5: Create Add/Edit Habit Modal
**Instructions:**
Ask Claude Code to create `src/components/habits/HabitModal.jsx`:
```
"Create modal with form:
- Fields: Name, Icon picker (emoji selector), Frequency (radio: daily/weekly/weekdays),
  Assigned to (radio: Me / [each kid])
- Validation: name required, icon required
- Actions: Save, Delete, Cancel
- Icon picker: show popular emojis in grid (exercise, water, meditation, etc.)
- On save: call createHabit or updateHabit"
```

### Step 6.6: Build Habits Page with Tabs
**Instructions:**
Ask Claude Code to create `src/pages/Habits.jsx`:
```
"Create Habits page with:
- Tab system: 'Mine' + [Each Kid Name] tabs
- Each tab shows habits assigned to that person
- List habits with cards
- FAB button: '+ Add Habit' (auto-assigns to current tab)
- Empty state if no habits
- Real-time updates from HabitContext
- Responsive to 375px mobile"
```

### Step 6.7: Implement Daily Reset Logic
**Instructions:**
Ask Claude Code:
```
"Implement midnight reset logic:
1. Create utility function: resetHabitCompletions()
2. Check: if last_completion_date < today, reset status to incomplete
3. Run on: app start (compare phone time to last_check_time)
4. Run on: navigation to Habits page
5. Use LocalStorage to cache last_check_time
6. Don't reset kid habit ratings (keep historical)"
```

**Deliverable for Phase 6:**
- ✅ Habit creation and management
- ✅ Daily completion tracking with rating modal for kids
- ✅ 7-day calendar view with color coding
- ✅ Streak calculation and display
- ✅ Midnight reset logic
- ✅ Habits page with tab navigation

---

## Phase 7: Rewards & Points System (Days 13-14)

### Objective
Implement points calculation, rating customization, and reward redemption.

### Step 7.1: Create Rewards Data Model
**Instructions:**
Ask Claude Code to create `src/utils/rewardModels.js`:
```
"Define models:
- RatingType { id, family_id, label, emoji, point_value, created_at }
- Default ratings: Awesome(+5), Good(+3), Ok Ok(+1), Very Bad(-2)
- KidPoints { kid_id, family_id, balance, last_updated, history }
- Reward { id, family_id, name, point_cost, created_at }
- Default rewards: Screen time (30pts), Ice cream (100pts), Weekend activity (200pts)
- RedemptionHistory { id, kid_id, reward_id, timestamp, points_deducted }"
```

### Step 7.2: Create Supabase Reward Tables
**Instructions:**
Ask Claude Code to generate SQL:
```
"Provide SQL for:
1. rating_types table (family_id, label, emoji, point_value)
2. kid_points table (kid_id, family_id, balance)
3. rewards table (family_id, name, point_cost)
4. redemption_history table (kid_id, reward_id, created_at, points_deducted)
5. Enable RLS: only family members can see/modify their family's data"
```

Run in Supabase SQL Editor.

### Step 7.3: Create RewardsContext and Hook
**Instructions:**
Ask Claude Code to create:
- `src/context/RewardsContext.jsx`
- `src/hooks/useRewards.js`

```
"Create RewardsContext with methods:
- getRatings(): get all ratings for family
- updateRating(ratingId, updates)
- deleteRating(ratingId): min 1 rating required
- addRating(label, emoji, value)
- getRewards(): get all rewards for family
- addReward(name, pointCost)
- updateReward(rewardId, updates)
- deleteReward(rewardId)
- getKidPoints(kidId): current balance
- addPoints(kidId, points, source_task_id/habit_id)
- redeemReward(kidId, rewardId): deduct cost, add to history
- getPointsHistory(kidId)
- State: ratings, rewards, kidPoints, loading, error"
```

### Step 7.4: Create Rewards Screen Page
**Instructions:**
Ask Claude Code to create `src/pages/Rewards.jsx`:
```
"Create rewards page with:
Section 1: Points Display
  - For each kid: Card showing name, current balance, weekly earned
  - Progress bar to next reward
Section 2: Available Rewards
  - List all rewards with point cost
  - 'Redeem' button (enabled if balance ≥ cost, else show 'Need X more points')
  - On click: confirm redemption, deduct points, show success message
Section 3: Redemption History (if exists)
  - List recent redemptions with date and points spent
  - Expandable to show full history per kid
- Settings button (gear icon) → Manage Ratings & Rewards"
```

### Step 7.5: Create Rating/Reward Management Modal
**Instructions:**
Ask Claude Code to create `src/components/rewards/ManageRatingsModal.jsx` and `ManageRewardsModal.jsx`:
```
"Create two modals:

ManageRatingsModal:
  - List all rating types (label, emoji, point value)
  - Edit each: label, emoji, value
  - Delete button (if > 1 rating exists)
  - Add new rating button
  - Save all changes on confirm

ManageRewardsModal:
  - List all rewards (name, point cost)
  - Edit each: name, cost
  - Delete button
  - Add new reward button
  - Save on confirm"
```

### Step 7.6: Create Points History Modal
**Instructions:**
Ask Claude Code to create `src/components/rewards/PointsHistoryModal.jsx`:
```
"Create modal showing:
- Kid name (header)
- Table/list of all point transactions:
  - Date, Source (task/habit/manual), Rating, Points awarded
- Sortable by date
- Filter by source
- Running total shown"
```

**Deliverable for Phase 7:**
- ✅ Custom rating system with full CRUD
- ✅ Customizable rewards
- ✅ Point calculation and balance tracking
- ✅ Reward redemption with history
- ✅ Points display and history pages
- ✅ Real-time balance updates

---

## Phase 8: Intermittent Fasting Tracker (Days 15-16)

### Objective
Build fasting session tracking with live timer, progress ring, motivational stages, and history.

### Step 8.1: Create Fasting Data Model
**Instructions:**
Ask Claude Code to create `src/utils/fastingModels.js`:
```
"Define Fasting model:
- FastSession { id, user_id, family_id, start_time, end_time, 
  duration_minutes, goal_minutes, completed, created_at }
- FastingGoal { user_id, goal_hours (default 16) }
- Stages array:
  { hours: 0, name: 'Fed state', message: 'Every journey starts...' }
  { hours: 4, name: 'Glycogen burning', message: 'Great start!...' }
  { hours: 8, name: 'Fat burning begins', message: 'You are in the zone!...' }
  { hours: 12, name: 'Deep fat burning', message: 'Over halfway!...' }
  { hours: 16, name: 'Autophagy kick-in', message: 'Goal reached!...' }
  { hours: 20, name: 'Deep fasting zone', message: 'Elite mode!...' }
- Calculate: current_stage based on elapsed hours"
```

### Step 8.2: Create Supabase Fasting Tables
**Instructions:**
Ask Claude Code to generate SQL:
```
"Provide SQL for:
1. fast_sessions table (user_id, family_id, start_time, end_time, goal_minutes)
2. fasting_goals table (user_id, goal_hours, created_at, updated_at)
3. Enable RLS: users can only see their own sessions"
```

Run in Supabase SQL Editor.

### Step 8.3: Create FastingContext and Hook
**Instructions:**
Ask Claude Code to create:
- `src/context/FastingContext.jsx`
- `src/hooks/useFasting.js`

```
"Create FastingContext with methods:
- startFast(): create new session with start_time = now
- endFast(): update session end_time = now, calculate duration
- getCurrentSession(): get active session (end_time is null)
- getSessionHistory(): get past 7 sessions
- setGoal(hours): update user's fasting goal
- getGoal(): get user's goal
- getStage(elapsedHours): return current stage object
- getElapsedTime(startTime): return hours:minutes string (real-time)
- getProgressPercent(elapsedHours, goalHours): return 0-100
- State: currentSession, loading, elapsedTime (updates every second)
- Real-time subscription to active session"
```

### Step 8.4: Create Live Timer Component
**Instructions:**
Ask Claude Code to create `src/components/fasting/LiveTimer.jsx`:
```
"Create timer component:
- Display: HH:MM format
- Updates every second while session active
- Props: startTime, goalMinutes
- Use useEffect with setInterval to update elapsed time
- Cleanup interval on unmount
- Color: sky blue, large font (32px+)"
```

### Step 8.5: Create Progress Ring Component
**Instructions:**
Ask Claude Code to create `src/components/fasting/ProgressRing.jsx`:
```
"Create circular progress indicator:
- SVG circle with stroke
- Animate stroke to show progress (0-100%)
- Center text: percentage or hours:minutes
- Color: gradient from sky to mint as progress increases
- Props: percent, elapsedHours, goalHours
- Size: 200px diameter
- Use recharts or custom SVG"
```

### Step 8.6: Create Fasting Card Component
**Instructions:**
Ask Claude Code to create `src/components/fasting/FastingCard.jsx`:
```
"Create card shown on Home screen when fasting active:
- Title: 'Intermittent Fasting'
- Live timer (HH:MM)
- Progress ring (circular)
- Current stage name and message
- 'End Fast' button
- Card background: gradient sky to light sky
- Animation: subtle pulse or glow"
```

### Step 8.7: Create Fasting Page
**Instructions:**
Ask Claude Code to create `src/pages/Fasting.jsx`:
```
"Create fasting page with:
Section 1: Current Session (if active)
  - Large progress ring
  - Live timer
  - Current stage name and message
  - 'End Fast' button
  - Stage indicators (6 circles showing progress through stages)

Section 2: Session Controls
  - Goal setting: input field + 'Update Goal' button
  - 'Start New Fast' button (if no active session)
  - 'End Fast' button (if active)

Section 3: History
  - Last 7 sessions as bar chart (recharts)
  - Date, duration for each
  - Weekly stats: total fasting hours, average session length

Confetti animation triggers at 70% goal reached"
```

### Step 8.8: Implement Confetti Animation
**Instructions:**
Ask Claude Code:
```
"Create confetti animation:
1. Install: npm install confetti-js
2. Create src/utils/confetti.js with confetti trigger function
3. In ProgressRing: if percent >= 70, call confetti.fire()
4. Duration: 2 seconds, then hide fasting card
5. Test: start 16h fast, progress to 70% (11h+ fasting)"
```

**Deliverable for Phase 8:**
- ✅ Fasting session start/end
- ✅ Live timer updating in real-time
- ✅ Progress ring with percentage
- ✅ 6 motivational stages with messages
- ✅ Confetti animation at milestone
- ✅ 7-day history with chart
- ✅ Customizable goal duration
- ✅ Fasting card on Home screen

---

## Phase 9: Grocery List Feature (Days 17-18)

### Objective
Implement shared family grocery list with real-time sync.

### Step 9.1: Create Grocery Data Model
**Instructions:**
Ask Claude Code to create `src/utils/groceryModels.js`:
```
"Define Grocery model:
- GroceryItem { id, family_id, name, is_purchased, created_at, updated_at }
- Max items: 100 per family
- Name length: 1-100 characters
- is_purchased: boolean (toggle purchased/unpurchased state)"
```

### Step 9.2: Create Supabase Grocery Tables
**Instructions:**
Ask Claude Code to generate SQL:
```
"Provide SQL for:
1. grocery_items table (family_id, name, is_purchased, created_at, updated_at)
2. Enable RLS:
   - Only owner and partner can view/modify
   - Kids cannot access
   - Real-time broadcast on changes"
```

Run in Supabase SQL Editor.

### Step 9.3: Create GroceryContext and Hook
**Instructions:**
Ask Claude Code to create:
- `src/context/GroceryContext.jsx`
- `src/hooks/useGrocery.js`

```
"Create GroceryContext with methods:
- getGroceryItems(): get all items for family
- addGroceryItem(name): create new item (is_purchased=false)
- updateGroceryItem(itemId, updates): toggle is_purchased or edit name
- deleteGroceryItem(itemId): remove item
- clearPurchased(): delete all is_purchased=true items
- State: items, loading, error
- Real-time subscription to changes (insert/update/delete)"
```

### Step 9.4: Create Grocery Item Component
**Instructions:**
Ask Claude Code to create `src/components/grocery/GroceryItemCard.jsx`:
```
"Create grocery item component:
- Checkbox (toggle is_purchased)
- Item name (strikethrough if purchased)
- Delete button (X icon)
- Edit button (pencil icon)
- On checkbox: toggle purchased status
- On edit: show inline edit or modal
- Purchased items: gray text, opacity-50
- Not purchased: black text, normal opacity"
```

### Step 9.5: Create Grocery List Page
**Instructions:**
Ask Claude Code to create `src/pages/Grocery.jsx`:
```
"Create grocery list page with:
- Input field + 'Add Item' button
- List of unpurchased items (top)
- Separator
- List of purchased items (gray, strikethrough, bottom)
- Delete button per item
- 'Clear Purchased' button
- Empty state message
- Real-time updates from GroceryContext
- Responsive to 375px mobile
- Pull-to-refresh to reload"
```

### Step 9.6: Real-Time Sync Setup
**Instructions:**
Ask Claude Code:
```
"Set up real-time subscription for grocery list:
1. In GroceryContext, use supabase.from('grocery_items').on('*', callback)
2. On INSERT: add new item to state
3. On UPDATE: find and update item in state
4. On DELETE: remove item from state
5. Show 'syncing...' indicator while changes propagate
6. Test: add item on phone A, verify appears instantly on phone B"
```

**Deliverable for Phase 9:**
- ✅ Grocery list creation and management
- ✅ Real-time sync across devices
- ✅ Purchased/unpurchased toggle
- ✅ Grocery list page with UI
- ✅ Add/delete/edit items
- ✅ Owner and partner access only

---

## Phase 10: Alarms & Reminders (Days 19-20)

### Objective
Implement standalone alarms and task reminders with notifications.

### Step 10.1: Create Alarm Data Model
**Instructions:**
Ask Claude Code to create `src/utils/alarmModels.js`:
```
"Define models:
- Alarm { id, user_id, family_id, time (HH:MM), label, enabled, 
  repeat_days (mon-sun array), sound, created_at }
- Reminder { id, task_id, user_id, scheduled_time, alert_type 
  (notification/alarm/nudge), nudge_interval }
- Alert types:
  - Notification: silent notification
  - Alarm: loud alarm sound
  - Nudge: repeated notifications at interval"
```

### Step 10.2: Create Supabase Alarm Tables
**Instructions:**
Ask Claude Code to generate SQL:
```
"Provide SQL for:
1. alarms table (user_id, family_id, time, label, enabled, repeat_days JSON)
2. reminders table (task_id, user_id, scheduled_time, alert_type, nudge_interval)
3. Enable RLS: users can only see their own alarms"
```

Run in Supabase SQL Editor.

### Step 10.3: Create AlarmContext and Hook
**Instructions:**
Ask Claude Code to create:
- `src/context/AlarmContext.jsx`
- `src/hooks/useAlarms.js`

```
"Create AlarmContext with methods:
- getAlarms(): get all alarms for user
- createAlarm(time, label, repeatDays)
- updateAlarm(alarmId, updates)
- deleteAlarm(alarmId)
- toggleAlarmEnabled(alarmId)
- getReminders(taskId): get reminders for task
- createReminder(taskId, scheduledTime, alertType, nudgeInterval)
- updateReminder(reminderId, updates)
- deleteReminder(reminderId)
- State: alarms, reminders, loading, error"
```

### Step 10.4: Create Alarms Page
**Instructions:**
Ask Claude Code to create `src/pages/Alarms.jsx`:
```
"Create alarms page with two sections:

Section 1: Standalone Alarms
  - List of alarms with time, label, repeat days, toggle enabled
  - FAB button: '+ Add Alarm'
  - On click alarm: edit modal
  - Delete button per alarm

Section 2: Upcoming Reminders
  - List of task reminders sorted by time
  - Task name, time, alert type
  - Delete button per reminder
  - Empty state if no reminders

Real-time updates from AlarmContext"
```

### Step 10.5: Create Add/Edit Alarm Modal
**Instructions:**
Ask Claude Code to create `src/components/alarms/AlarmModal.jsx`:
```
"Create modal with form:
- Time picker (HH:MM)
- Label field (optional)
- Repeat: checkboxes for Mon-Sun
- Sound selector (silent/default/custom)
- Toggle: enabled/disabled
- Actions: Save, Delete, Cancel
- Time picker: easy interface (hour/minute spinners or slider)
- Validation: time required"
```

### Step 10.6: Implement Local Notifications
**Instructions:**
Ask Claude Code:
```
"Set up local notifications:
1. Use Capacitor @capacitor/local-notifications plugin
2. For Reminders:
   - On task due date/time: schedule notification
   - Alert type = notification: single notification
   - Alert type = alarm: loud alarm sound
   - Alert type = nudge: repeat notifications every X minutes
3. For Alarms:
   - Check time every minute
   - When current time matches alarm time: fire notification
4. Test: set alarm for 1 minute from now, verify notification appears"
```

Note: For now, use browser notifications. Capacitor will be added in Phase 12.

**Deliverable for Phase 10:**
- ✅ Standalone alarms with schedule
- ✅ Task reminders with alert types
- ✅ Alarm enable/disable toggle
- ✅ Local notifications (browser/Capacitor)
- ✅ Repeat days for alarms
- ✅ Notification sound options

---

## Phase 11: Voice Integration & Google Assistant (Days 21-22)

### Objective
Integrate Google Assistant voice commands to create tasks via deep links.

### Step 11.1: Understand Voice Flow
**Instructions:**
Ask Claude Code to explain:
```
"Explain the voice task capture flow:
1. User says: 'Hey Google, create task with Doable: Buy milk'
2. Google Assistant routes to doable://voice?action=add_task&text=Buy+milk
3. App receives deep link, extracts text
4. Create Draft_Task from text (parsed intelligently)
5. Show task creation modal pre-populated
6. User reviews and saves"
```

### Step 11.2: Create Voice Capture Page
**Instructions:**
Ask Claude Code to create `src/pages/Voice/VoiceCapture.jsx`:
```
"Create voice capture page that:
- Detects URL params: ?action=add_task&text=[text]
- Parse text: extract title, assignees, due date (if mentioned)
- Create Draft_Task with parsed values
- Show Task creation modal pre-populated with draft
- On save: create actual task
- On cancel: close modal
- Example: 'Buy milk for Mayra tomorrow' → Task for Mayra due tomorrow"
```

### Step 11.3: Create URL Scheme Handler
**Instructions:**
Ask Claude Code to create `src/utils/deepLinkHandler.js`:
```
"Create deep link handler:
1. Function: parseDeepLink(url)
2. Extract params: action, text
3. Route to appropriate handler:
   - action=add_task → VoiceCapture page
   - action=invite → JoinFamily page
   - action=complete_task → mark task complete (with ID)
4. Use window.location or React Router
5. Test locally: use query params ?action=add_task&text=Buy+milk"
```

### Step 11.4: Update App.jsx with Deep Link Routing
**Instructions:**
Ask Claude Code to update `App.jsx`:
```
"Update App.jsx to:
- Add route: /voice-capture
- On mount: check URL/query params
- If deep link detected: parse and route to appropriate page
- Handle native deep links (when using Capacitor)"
```

### Step 11.5: Create Task Parser Utility
**Instructions:**
Ask Claude Code to create `src/utils/taskParser.js`:
```
"Create smart task parser:
1. Function: parseTaskText(text, kids) → { title, dueDate, assignees }
2. Parse common patterns:
   - 'Buy milk for Mayra' → title: 'Buy milk', assignees: [Mayra]
   - 'Study tomorrow' → title: 'Study', dueDate: tomorrow
   - 'All kids clean room' → assignees: [all kids]
   - 'High priority grocery shopping' → title, priority: high
3. Handle:
   - Kid names (case-insensitive)
   - Date keywords: today, tomorrow, next week, next month
   - Priority keywords: high, urgent, low
   - Multi-assignee: 'and', 'or', commas
4. Fallback: if can't parse, use entire text as title"
```

### Step 11.6: Set Up Google Assistant Configuration
**Instructions:**
Ask Claude Code:
```
"Explain Google Assistant setup for Play Store:
1. Create project in Google Cloud Console
2. Set up Actions on Google (Conversational)
3. Configure custom intent with:
   - Voice input: 'create task with Doable [what]'
   - Fulfillment: deep link to doable://voice?action=add_task&text={what}
4. Test via Google Assistant on Android
5. Note: requires Play Store submission for full integration
6. For testing: use browser query params first"
```

### Step 11.7: Test Voice Flow Locally
**Instructions:**
Ask Claude Code:
```
"Create test page for voice flow:
1. Create src/pages/Voice/TestVoice.jsx
2. Form: input field + buttons to test common voice commands
3. Examples: 'Buy milk', 'Study tomorrow', 'Exercise for Mayra'
4. On click: navigate to /voice-capture?text=...
5. Verify task creation modal appears with parsed values
6. Use for local testing before Google Assistant integration"
```

**Deliverable for Phase 11:**
- ✅ Deep link handler for voice commands
- ✅ URL param parsing
- ✅ Smart task text parser
- ✅ Voice capture page with draft task
- ✅ Google Assistant configuration (docs)
- ✅ Local testing framework
- ✅ Ready for Play Store submission

---

## Phase 12: Android Wrap & Build (Days 23-24)

### Objective
Wrap React app in Capacitor, build Android APK, and prepare for Play Store submission.

### Step 12.1: Install Capacitor
**Instructions:**
Ask Claude Code:
```
"Install Capacitor:
1. npm install @capacitor/core @capacitor/cli
2. npm install @capacitor/android @capacitor/ios
3. npx cap init doable-app --web-dir=dist
4. Select: Android as target platform
5. Verify: capacitor.config.json created in root"
```

### Step 12.2: Add Capacitor Plugins
**Instructions:**
Ask Claude Code:
```
"Install Capacitor plugins:
1. npm install @capacitor/push-notifications
2. npm install @capacitor/app (for deep links)
3. npm install @capacitor/local-notifications
4. npm install @capacitor/device
5. npm install @capacitor/geolocation (optional, for future)
6. For each: add to capacitor.config.json"
```

### Step 12.3: Configure Deep Links
**Instructions:**
Ask Claude Code:
```
"Configure deep links in capacitor.config.json:
- Add plugins.App config with URLs: doable://*, app.doable://*
- Set up intent filters in AndroidManifest.xml:
  <data android:scheme='doable' android:host='*' />
- Test: deep link routes correctly to app when tapped"
```

### Step 12.4: Build React for Production
**Instructions:**
Ask Claude Code:
```
"Build React app:
1. npm run build (creates dist/ folder)
2. Verify dist/index.html and assets are generated
3. File size check: should be < 5MB gzipped
4. No console errors in build output"
```

### Step 12.5: Sync Capacitor with Android
**Instructions:**
Ask Claude Code:
```
"Sync web assets to Android:
1. npx cap sync android
2. npx cap open android (opens Android Studio)
3. Verify: www/ folder in Android project contains dist/ contents
4. Check AndroidManifest.xml for deep link intent filters"
```

### Step 12.6: Generate Android Signing Key
**Instructions:**
Ask Claude Code:
```
"Generate keystore for signing:
1. Command: keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias doable-key
2. Enter: keystore password, key password, CN=Doable, etc.
3. File location: /path/to/keystore/my-release-key.keystore
4. Save path and passwords securely
5. Note: this is needed for Play Store submission"
```

### Step 12.7: Build APK Using EAS
**Instructions:**
Ask Claude Code:
```
"Use EAS Build for cloud compilation:
1. Install EAS CLI: npm install -g eas-cli
2. Create eas.json:
   {
     'build': {
       'preview': { 'android': { 'buildType': 'apk' } },
       'production': { 'android': { 'buildType': 'aab' } }
     }
   }
3. Link project: eas build --project-id [your_project_id]
4. Build APK: eas build --platform android --profile preview
5. Download APK to test on phone"
```

Note: EAS requires Expo account (free tier available).

### Step 12.8: Test APK on Android Phone
**Instructions:**
Ask Claude Code:
```
"Test APK on real Android device:
1. Enable Developer Mode: Settings > About > Build Number (tap 7x)
2. Enable USB Debugging: Settings > Developer Options > USB Debugging
3. Connect phone via USB to Windows
4. Android Studio: run 'adb devices' to verify connection
5. Install APK: adb install path/to/doable.apk
6. Open app on phone, test all features:
   - Login/signup
   - Create task
   - Create habit
   - Start fasting
   - Add grocery item
   - Test voice command with ?text= param"
```

### Step 12.9: Configure Firebase Cloud Messaging (FCM)
**Instructions:**
Ask Claude Code:
```
"Set up FCM for push notifications:
1. Go to Firebase Console, create new project or use existing
2. Register Android app: input package name 'com.doable.app'
3. Download google-services.json
4. Place in: android/app/google-services.json
5. In Capacitor: npm install firebase @capacitor/firebase-messaging
6. Configure in capacitor.config.json:
   'plugins': { 'FirebaseMessaging': { ... } }
7. Create Firebase function to send test notification
8. Test: send notification from Firebase, verify appears on phone"
```

**Deliverable for Phase 12:**
- ✅ Capacitor installed and configured
- ✅ React app wrapped in Android shell
- ✅ APK built and tested on real device
- ✅ Deep links working (voice commands route correctly)
- ✅ Push notifications configured via FCM
- ✅ Signing key generated for Play Store
- ✅ Ready for Google Play Store submission

---

## Phase 13: Testing & Validation (Day 25)

### Objective
Comprehensive testing, bug fixes, and preparation for launch.

### Step 13.1: Functional Testing Checklist
**Instructions:**
Test all features on real Android device:

**Authentication:**
- [ ] Signup with email/password
- [ ] Login with existing credentials
- [ ] Session persists after app restart
- [ ] Logout clears session
- [ ] Invalid email/password shows errors

**Family Management:**
- [ ] Create family
- [ ] Add kid profile with color
- [ ] Invite partner (email flow)
- [ ] Partner joins family
- [ ] Family settings accessible

**Tasks:**
- [ ] Create task (single assignee)
- [ ] Create multi-kid task
- [ ] Complete personal task
- [ ] Complete kid task (rating modal appears)
- [ ] Rate task correctly (points awarded)
- [ ] Edit task
- [ ] Delete task
- [ ] Filter tasks (All/Active/Done)
- [ ] Recurring tasks auto-create

**Habits:**
- [ ] Create habit
- [ ] Assign to kid
- [ ] Complete habit
- [ ] Streak counter increments
- [ ] 7-day calendar shows correct colors
- [ ] Reset at midnight
- [ ] Tabs switch between owner/kids

**Rewards:**
- [ ] Points accumulate correctly
- [ ] Redeem reward with sufficient points
- [ ] Insufficient points shows 'Need X more'
- [ ] Redemption history recorded
- [ ] Custom ratings work
- [ ] Custom rewards work

**Fasting:**
- [ ] Start fast
- [ ] Timer updates in real-time
- [ ] Progress ring shows percent
- [ ] Stages update with elapsed time
- [ ] End fast saves session
- [ ] Confetti triggers at 70%
- [ ] History shows past sessions

**Grocery List:**
- [ ] Add item
- [ ] Toggle purchased
- [ ] Delete item
- [ ] Real-time sync (test on two devices)
- [ ] Strikethrough on purchased

**Alarms:**
- [ ] Create alarm
- [ ] Set repeat days
- [ ] Enable/disable toggle
- [ ] Notification appears at time
- [ ] Delete alarm

**Voice:**
- [ ] Test deep link with query params
- [ ] Voice capture page loads task modal
- [ ] Task parser creates correct task
- [ ] Parsed task saves correctly

### Step 13.2: Performance Testing
**Instructions:**
Ask Claude Code:
```
"Test app performance:
1. Lighthouse audit: run via Chrome DevTools
2. Metrics to check:
   - First Contentful Paint < 3s
   - Largest Contentful Paint < 5s
   - Layout Shift: < 0.1
   - Time to Interactive < 5s
3. APK size: < 100MB
4. Memory usage: < 200MB
5. Real-time sync latency: < 2s
6. Identify bottlenecks, optimize if needed"
```

### Step 13.3: Security & Privacy Review
**Instructions:**
Verify security before Play Store launch:
- [ ] No sensitive data in logs
- [ ] Supabase RLS policies correct
- [ ] Environment variables not exposed
- [ ] Password validation (≥8 chars)
- [ ] Session timeout (optional)
- [ ] Secure storage of tokens (Capacitor SecureStorage)
- [ ] HTTPS only for API calls

### Step 13.4: UI/UX Polish
**Instructions:**
Final visual pass:
- [ ] All screens responsive at 375px
- [ ] Bottom nav always visible
- [ ] Buttons accessible (min 44px touch targets)
- [ ] Colors correct per design system
- [ ] Fonts: Nunito throughout
- [ ] Loading spinners on async operations
- [ ] Error messages clear and helpful
- [ ] Empty states have helpful messages
- [ ] Animations smooth (no jank)

### Step 13.5: Bug Fixes & Refinements
**Instructions:**
Ask Claude Code to:
```
"Review test results and fix:
1. Any functional failures
2. Broken deep links
3. Real-time sync issues
4. Performance bottlenecks
5. UI misalignments
6. Text truncations
7. Missing validations
8. Create GitHub issues for each bug, assign priority"
```

### Step 13.6: Create Play Store Listings
**Instructions:**
Ask Claude Code to help prepare:
```
"Create Play Store submission materials:
1. App name: 'Doable - Family Productivity'
2. Short description (80 chars): 'Family task, habit & fasting tracker with rewards'
3. Full description (4000 chars): feature list, benefits, use cases
4. Privacy Policy: create using template (link in app)
5. Screenshots: 5-8 screenshots showing features
6. Video preview (optional): 15-30 sec demo
7. Icon: 512x512 PNG (app launcher icon)
8. Feature graphic: 1024x500 PNG
9. Content rating: fill out questionnaire"
```

### Step 13.7: Final Pre-Launch Checklist
**Instructions:**
Before submitting to Play Store:
- [ ] All tests passing
- [ ] No console errors
- [ ] APK signed with release key
- [ ] Version bumped (1.0.0)
- [ ] All strings translated (English only for MVP)
- [ ] Privacy policy published
- [ ] Screenshots and description ready
- [ ] Content rating completed
- [ ] Budget set (if using ads, not applicable yet)
- [ ] Terms of Service ready

**Deliverable for Phase 13:**
- ✅ All 14 features tested and working
- ✅ Performance verified
- ✅ Security reviewed
- ✅ UI polished and responsive
- ✅ Play Store materials prepared
- ✅ Ready for submission

---

## Appendix: Claude Code Workflow

### How to Use Claude Code for Each Phase

**Starting Claude Code:**
```bash
# In your VS Code terminal
npm run dev  # Keep dev server running

# In another terminal
claude-code
```

**Workflow Pattern:**

1. **Ask Claude to Create/Modify:**
   ```
   "Create a new component called [ComponentName] in src/components/[folder]/ 
   that does [description]. 
   Use Tailwind CSS for styling with these colors: [colors].
   Include props: [prop list].
   Example usage: [example code]"
   ```

2. **Review Generated Code:**
   - Check file location
   - Verify imports are correct
   - Test in browser (dev server running)
   - Provide feedback if changes needed

3. **Iterate:**
   ```
   "Update the component to:
   - Change [what]
   - Add [feature]
   - Fix [issue]"
   ```

4. **Test in Browser:**
   - Open http://localhost:5173
   - Navigate to feature
   - Verify UI and functionality
   - Check console for errors

### Tips for Effective Claude Code Use

✅ **Be Specific:**
- "Create a React component" → Too vague
- "Create a modal component for rating tasks with emoji labels, radio buttons for each rating option, and a confirm button" → Perfect

✅ **Provide Context:**
- Share relevant utilities, models, or API responses
- Show example data structure
- Clarify UI/UX requirements

✅ **Batch Related Tasks:**
- Instead of: "Create Button", then "Create Input", then "Create Card"
- Ask: "Create 3 reusable components: Button with variants, Input with validation, Card with left border accent"

✅ **Use Testing to Validate:**
- After Claude Code creates features, test in browser
- Report any issues clearly
- Provide console errors if applicable

✅ **Save Generated Code:**
- Don't manually modify Claude Code output unless necessary
- Keep generated code clean for future iteration
- Use Git to track changes

### Example Claude Code Session

**Request:**
```
"Create the TaskCard component that displays:
- Task title (bold, 16px)
- Assignees as color-coded badges (kid names or 'Me')
- Due date with color coding (red if overdue, gray if future)
- Priority badge (rose for high, amber for medium, gray for low)
- Category as a small tag
- Checkmark icon on right side (click to complete)
- On hover: slight lift effect and cursor pointer

File: src/components/tasks/TaskCard.jsx
Import: Card component, Badge component, Icon utilities
Props: task, onComplete, onEdit
Use Tailwind only, no inline styles
Color scheme: peach, lavender, mint, sky, amber, rose"
```

**Claude Code:**
1. Generates TaskCard.jsx with all requested features
2. Imports dependencies correctly
3. Handles props and callbacks
4. Uses Tailwind classes from design system

**Your Next Step:**
1. Review generated code in VS Code
2. Test in browser at /tasks page
3. Click task → onComplete fires
4. Provide feedback if tweaks needed

---

---

# POST-MVP ENHANCEMENTS (v2.0+)
*Phases 14+ — captured during user testing of the live app*

---

## Enhancement Log

| # | Enhancement | Priority | Phase | Status |
|---|-------------|----------|-------|--------|
| 1 | Task Assignment with Accept/Reject + Privacy Controls | High | Phase 14 | ✅ Complete |
| 2 | Partner Display Name | Medium | Phase 15 | ✅ Complete |
| 3 | Task Templates | Medium | Phase 16 | ✅ Complete |
| 4 | Push Notifications for Task Assignment | Medium | Phase 17 | ✅ Complete |
| 5 | Task Subtasks (JSONB checklist) | Medium | Phase 18 | ✅ Complete |
| 6 | Calendar View for Tasks | Medium | Phase 19 | ✅ Complete |
| 7 | Voice: Mark Task Done | Medium | Phase 20 | ✅ Complete |
| 8 | UX Polish (grocery attribution, fasting gamification, rewards reset, display names) | Medium | Enhancement | ✅ Complete |
| 9 | Real-Mic Voice Screen | High | Enhancement | ✅ Complete |
| 10 | Photo Moments for Adhoc Points | Medium | Enhancement | ✅ Complete |
| 11 | 1 Point per Kid Habit Completion | Medium | Enhancement | ✅ Complete |
| 12 | Bug Fix: Kid task rating modal on Home screen | High | Enhancement | ✅ Complete |
| 13 | Bug Fix: Me deselectable in task creation | Medium | Enhancement | ✅ Complete |
| 14 | App Permissions Management in Account tab (Notifications, Mic, Camera) | Medium | Enhancement | ✅ Complete |
| 15 | Data Reset section in Account tab (Tasks / Habit Progress / Rewards) | Medium | Enhancement | ✅ Complete |
| 16 | Leaderboard: remove rank medals, avatar initials, ± give-points button | Low | Enhancement | ✅ Complete |
| 17 | Voice task word duplication fix — iterate from `e.resultIndex` in `onresult` | High | Enhancement | ✅ Complete |
| 18 | 7-day completion dot strip on daily habit cards (WeekStrip component) | Medium | Enhancement | ✅ Complete |
| 19 | Reward history photo tap-to-expand lightbox | Low | Enhancement | ✅ Complete |
| 20 | GivePointsModal photo form reset fix (wasOpenRef pattern) | High | Enhancement | ✅ Complete |
| 21 | Vercel deployment — `vercel.json` SPA rewrite rule for all routes | Medium | Enhancement | ✅ Complete |

---

# PHASE 14: Task Assignment & Privacy Model
*Completed: May 16, 2026 | Priority: High*

## Objective

Enable users to **assign tasks to their partner** (another adult family member), with an **accept/reject workflow**, while enforcing **task-level privacy** so members only see tasks that concern them.

## What Was Built

### Database (`supabase/migrations/014_task_assignment.sql`)
New columns added to `tasks` table:
- `assigned_to_user_id` UUID — the adult being assigned the task
- `assignment_status` TEXT — `pending_acceptance` | `accepted` | `rejected`
- `rejection_reason` TEXT — optional reason from assignee
- `responded_at` TIMESTAMPTZ — when the assignee responded
- `is_private` BOOLEAN — `true` = only creator + assignee can see

Updated RLS `tsk_sel` policy:
```sql
created_by = auth.uid()                          -- creator always sees own tasks
OR assigned_to_user_id = auth.uid()              -- assignee always sees their tasks
OR (is_private = false AND is_family_member(...)) -- non-private visible to family
```

### Privacy Rules
| Scope | `is_private` | `assigned_to_user_id` | Visible to |
|-------|-------------|----------------------|------------|
| Me (private) | `true` | `null` | Creator only |
| Partner assignment | `true` | partner UUID | Creator + partner |
| Family | `false` | `null` | All family members |
| Kids | `false` | `null` | All parents |

### Frontend Files Modified/Created

| File | Change |
|------|--------|
| `src/utils/taskModels.ts` | Added `AssignmentStatus` type + 5 new fields to `Task` interface |
| `src/context/TaskContext.tsx` | Updated `createTask` payload; added `acceptTask()` and `rejectTask()` |
| `src/components/tasks/TaskModal.tsx` | Restructured assignee picker: 🔒 Me / 👤 Partner / 👨‍👩‍👧 Family + kid multi-select; partner info banner |
| `src/components/tasks/TaskCard.tsx` | 🔒 lock icon; 🕐 pending badge; ✕ rejected badge + Reassign/Delete actions |
| `src/components/tasks/IncomingTaskCard.tsx` | New — accept/reject UI with inline rejection reason input |
| `src/pages/Tasks.tsx` | Added "📨 Response Needed" section; wired acceptTask/rejectTask; partner derived from familyMembers |

### Accept/Reject Flow
```
User A creates task → assigned_to_user_id = User B → status = pending_acceptance
     ↓
User B sees "📨 Response Needed" section at top of Tasks page
     ↓
  [✓ Accept]              [✕ Reject]
  status = accepted       optional reason → status = rejected
  task moves to list      User A sees rejection + Reassign/Delete options
```

## Completion Checklist
- [x] Database migration applied and RLS policies updated
- [x] Task creation supports assigning to partner with pending status
- [x] Assignee sees accept/reject prompt in "Response Needed" section
- [x] Creator sees pending/rejected status badges on task cards
- [x] Personal tasks private via `is_private = true`
- [x] Existing tasks unaffected (backfilled with `is_private = false`, `assignment_status = accepted`)
- [x] Build passes with no TypeScript errors
- [x] Committed to Git: `feat: task assignment with accept/reject + privacy model (Phase 14)`

## Known Gaps (Future)
- Push notifications for accept/reject events (Phase 14.6 — not yet built)
- Partner display name — currently hardcoded as "Partner" (requires `display_name` on `family_members`)

---

---

# PHASES 15–20: Feature Expansion
*Completed: May 17, 2026*

## Phase 15 — Partner Display Name
**DB:** `display_name TEXT` column added to `family_members` (`015_partner_display_name.sql`).  
**UI:** Family page → Members section has editable display name input. Saved via `updateFamilyMember()`. Used everywhere partner was previously shown as "Partner".

## Phase 16 — Task Templates
**No DB change.** Hardcoded templates in `src/utils/taskTemplates.ts` (8 presets: School pickup, Grocery run, Pay bills, Clean house, Doctor appt, Homework, Exercise, Team standup).  
**UI:** Horizontal scroll chip row at top of TaskModal (new task mode only). Selecting a chip fills title/category/priority/recurrence. User can override any field. Active chip shown in plum.

## Phase 17 — Push Notifications for Task Assignment
**Implementation:** Client-side via Supabase Realtime — no Edge Function needed. `TaskContext` diffs new vs previous tasks after each `fetchTasks()` using a `prevTasksRef`.  
- New pending task assigned to me → `fireImmediateNotification('New task assigned', ...)`
- Task I created was accepted → notification to creator
- Task I created was rejected → notification to creator  
Reuses existing `fireImmediateNotification()` from `src/services/notificationService.ts`.

## Phase 18 — Task Subtasks
**DB:** `subtasks JSONB NOT NULL DEFAULT '[]'` column on `tasks` (`016_task_subtasks.sql`).  
**Model:** `Subtask { id: string; title: string; completed: boolean }` in `taskModels.ts`.  
**UI:** "Subtasks" section in TaskModal — inline text input + Add button, checkbox list with delete. `TaskCard` shows `X/N subtasks` progress bar when subtasks exist.

## Phase 19 — Calendar View for Tasks
**No DB change.** Pure frontend using existing task data from `TaskContext`.  
**Component:** `src/components/tasks/CalendarView.tsx` — 7-column month grid, priority-colored dots per day (rose=high, amber=medium, gray=low), faded for completed. Tapping a day expands task list below grid.  
**UI:** Toggle in Tasks page header: List / Calendar icons. Navigable month arrows.

## Phase 20 — Voice: Mark Task Done
**Utility:** `findTaskByTitle(text, tasks)` in `taskParser.ts` — exact match → contains match → word-overlap score.  
**UI:** `VoiceCapture.tsx` handles `action=complete_task`: calls `findTaskByTitle`, shows confirmation screen ("Mark '[title]' as done?"), calls `markComplete(task.id)` on confirm.

---

# ENHANCEMENT: Real-Mic Voice Screen, Photo Moments, Habit Points
*Completed: May 17, 2026*

## Voice Task Screen Overhaul
**Problem:** `/test-voice` was a text simulator. Tasks were: (a) assigned to family instead of Me, (b) only capturing 1–2 words due to `continuous: false`.  
**Solution:**
- `TestVoice.tsx` completely rewritten as a dedicated mic screen
- `continuous: true`, `interimResults: true` — stays open until user taps stop; captures full sentences
- `selectedAssignees` state defaults to `['me']`, always resets on each new transcript; `handleCreate` uses `selectedAssignees`, never `parsed.assignees`
- Assignee picker UI: Me (lavender), kid pills (each kid's color), Partner (sky)
- Session list shown below; stays on same screen after task creation
- `ManualInput` fallback ("Or type a task") when mic is idle
- Layout wrapper removed from `/test-voice` route in `App.tsx`

## Photo Moments for Adhoc Points
**New file:** `src/services/photoService.ts`
- `pickPhoto(source)` — native Capacitor Camera or web `<input type="file">`
- `compressDataUrl()` — canvas resize to MAX_DIMENSION=900px, JPEG_QUALITY=0.75 (~100–250KB)
- `uploadMomentPhoto(userId, blob)` — uploads to `moment-photos` Supabase Storage public bucket

**DB:** `photo_url TEXT` added to `kid_point_events` (`019_moment_photos.sql`).  
**UI:** `GivePointsModal` — Camera/Gallery buttons in award mode; photo preview with ✕ remove; uploaded URL passed through `addPointEvent`. `Rewards.tsx` History tab renders photo above event row.

## Kid Habit Points (1pt per completion)
**Implementation:** In `HabitContext.completeHabit()`, when `assignee !== 'me'`, inserts a `kid_point_events` row with `type: 'habit_completion'`, `points: 1` before the existing 7-day streak bonus check.

## Bug Fixes
- **Home page kid task completion:** `handleCompletePress(task)` checks `isKidTask(task)` — routes to `RatingModal` instead of calling `markComplete()` directly
- **Task modal Me deselectable:** `AdultAssignee` type extended with `'none'`; Me pill toggles off; `handleSave` only includes adult assignees that aren't `'none'`

---

# ENHANCEMENT: Permissions, Data Reset, Leaderboard, Voice Fix, Habit Strip, Lightbox, Vercel
*Completed: May 20, 2026*

## App Permissions Management (Account Tab)
**New file:** `src/hooks/useAppPermissions.ts`
- Tracks `PermStatus` (`granted | denied | prompt | unsupported`) for Notifications, Microphone, Camera
- `refresh()` — checks status on mount via `navigator.permissions.query()` (mic/camera) and `Notification.permission` (notifications)
- `requestPermission(type)` — calls appropriate browser API: `Notification.requestPermission()`, `navigator.mediaDevices.getUserMedia({ audio: true })`, `getUserMedia({ video: true })`
- Returns `{ permissions, requesting, requestPermission, refresh }`

**UI in `src/pages/Family.tsx` Account tab:**
- Added `PermissionRow` component + `PERM_META` config object (label, icon, description per permission)
- Card shows three rows; each row has: icon, label+description, and a status button
  - "Allow" (amber, calls requestPermission) → "Allowed ✓" (mint) or "Blocked" (rose, links to settings)
- Reason: `/profile` route redirects to `/family`, so permissions UI must live in `Family.tsx`

## Data Reset Section (Account Tab)
**Context changes:**
- `TaskContext`: added `resetAllTasks()` — `DELETE FROM tasks WHERE family_id = ?`; re-fetches
- `HabitContext`: added `resetHabitProgress()` — `DELETE FROM habit_completions WHERE family_id = ?`; keeps habit definitions
- `RewardsContext`: added `resetAllRewardData()` — parallel delete of `kid_point_events`, `reward_redemptions`, `rewards`; re-fetches

**UI in `src/pages/Family.tsx` Account tab:**
- Three rows: Tasks, Habit Progress, Rewards
- Inline state machine per row: idle → confirming → resetting → done(2s) → idle
- `wasOpenRef` pattern prevents false reset-trigger when Account tab re-opens

## Leaderboard UI Simplifications
**File: `src/components/rewards/KidPointsCard.tsx`** — rewritten:
- **Removed:** rank medal badge (caused sibling rivalry), avatar initial circle (name alone is sufficient), ± give-points button (redundant — dedicated "Give Bonus Points" section exists), `relative overflow-hidden` positioning that caused button overlap
- **Reset button** moved from `absolute bottom-3 right-3` to inline within the name row (no overlap possible)
- Interface simplified: `{ kid, balance, earned, spent, onReset? }`
- `Rewards.tsx`: removed `rank={idx+1}`, `onGivePoints`, changed `sortedKids.map((kid, idx)` → `sortedKids.map((kid)`

## Voice Task Word Duplication Fix
**File: `src/pages/Voice/TestVoice.tsx`**
- Root cause: `onresult` loop started at `i = 0` on every event; `finalText` closure already held previous finals, so re-iterating from 0 re-appended them → "put put put washing machine..."
- Fix: loop starts at `e.resultIndex` (the index of the first new result in this event)
- Also added `resultIndex: number` to `ISpeechRecognition.onresult` event type interface

## 7-Day Completion Dot Strip on Daily Habits
**File: `src/components/habits/HabitCard.tsx`**
- New `WeekStrip` component — receives `habit`, `completedDates: Set<string>`, `accentColor`
- Builds array of last 7 days (oldest left, today right):
  - `scheduled` = `isScheduledForDay(habit, dayOfWeek)`
  - `completed` = `completedDates.has(dateStr)`
  - Renders: green filled dot (completed), rose outlined dot (missed scheduled), dash (not scheduled)
- HabitCard renders WeekStrip only when `habit.frequency === 'daily' && completedDates`
- `Habits.tsx`: passes `completedDates={new Set(completions.filter(...).map(c => c.date))}` to each HabitCard

## Reward History Photo Lightbox
**File: `src/pages/Rewards.tsx`**
- History tab photo thumbnails wrapped in `<button>` with `onClick={() => setLightboxUrl(photoUrl)}`
- `lightboxUrl` state: when set, renders fixed full-screen overlay (`bg-black/90 z-50`) with `<img>` centered
- Clicking the overlay (or the ✕ button) clears `lightboxUrl` and closes the lightbox

## GivePointsModal Photo Form Reset Fix
**File: `src/components/rewards/GivePointsModal.tsx`**
- Root cause: `useEffect` with `kids` in deps fired when FamilyContext emitted new array reference on mobile focus-return from camera app, resetting form state
- Fix: `wasOpenRef` pattern — effect runs on every render but only resets fields when `isOpen` transitions `false → true` (checked via `wasOpenRef.current`)
- Form fields (kid selection, +/−, amount, reason, photo) preserved across camera/gallery round-trips

## Vercel Deployment
**New file: `vercel.json`**
```json
{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}
```
- Enables SPA routing on Vercel — all URL paths serve `index.html` so React Router handles routing client-side
- Does not affect Android/Capacitor (loads `index.html` from device directly)
- Auto-deploys on push to `main` via Vercel GitHub integration

---

## Summary

This plan covers Phases 1–20 of the Doable app plus post-Phase-14 enhancements. All core MVP phases (1–12), Phase 14 (task assignment), Phases 15–20 (feature expansion), and recent enhancements are complete.

**Current Status:**
- Phases 1–12: ✅ MVP complete
- Phase 13: ⏳ Play Store — next milestone
- Phase 14: ✅ Task assignment + privacy complete
- Phases 15–20: ✅ Display name, templates, notifications, subtasks, calendar, voice mark-done
- Enhancements: ✅ Real-mic voice, photo moments, habit points, bug fixes
- Enhancements: ✅ App Permissions, Data Reset, Leaderboard polish, Voice fix, 7-day habit strip, Photo lightbox, Vercel deployment

**Remaining Work:**
- Phase 13: Generate signed AAB → upload to Play Store (closed testing in progress)
- Run any pending migrations in Supabase SQL Editor (017, 018, 019 if not yet applied)

---

**Document Status:** Active Development  
**Last Updated:** May 20, 2026  
**Next Step:** Phase 13 — Play Store closed testing → production release
