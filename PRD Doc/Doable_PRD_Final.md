# DOABLE

## Product Requirements Document (PRD)
### Family Productivity App — Android

| **Field** | **Value** |
|-----------|-----------|
| **Version** | 2.2 — Voice Mic, Photo Moments, Habit Points |
| **Date** | May 17, 2026 |
| **Platform** | Android (Google Play Store) |
| **Status** | Active Development — Phases 1–20 Complete + Enhancements |
| **Author** | Personal Learning Project |
| **Built with** | React + TypeScript + Vite + Tailwind CSS v4 + Supabase + Capacitor + EAS Build |

---

## 1. Product Overview

Doable is a personal and family productivity app that combines daily habit tracking, task management, intermittent fasting tracking, a kids reward system, standalone alarms, a shared grocery list, and real-time family collaboration — all in one soft, friendly mobile experience.

The app is designed for a family of up to 6 members: 2 parents and up to 4 kids. The owner (primary parent) manages everything — their own habits, personal tasks, shared family tasks, and tasks/habits assigned to kids. Kids have no login and are managed entirely by parents.

### 1.1 Problem Statement

- Families struggle to manage tasks, habits, and kids' responsibilities across multiple apps
- Parents have no easy way to track and reward kids' performance on daily routines
- Adding tasks while driving is dangerous — voice capture (Phase 11) solves this
- Fasting tracking needs to be motivational, not clinical
- Adults need a private space for personal tasks, separate from shared family view
- Assigning tasks to a partner with no acknowledgement leads to dropped responsibilities

### 1.2 Goals

- One app for all family productivity needs — tasks, habits, fasting, rewards, alarms, grocery
- Motivate kids through a transparent points and rewards system
- Real-time sync between parent devices for shared family tasks
- **Phase 11 ✅:** Zero-friction task creation via voice commands — "OK Google, add task in Doable: ..."
- **Phase 14 ✅:** Adult-to-adult task assignment with accept/reject workflow + personal task privacy
- **Phases 15–20 ✅:** Partner display name, task templates, push notifications, task subtasks, calendar view, voice mark-done
- **Enhancements ✅:** Real-mic voice screen, photo moments for rewards, 1 pt per kid habit completion, bug fixes
- Build, publish, and launch on Google Play Store

---

## 2. Users & Roles

| Role | Login | Access | Max |
|------|-------|--------|-----|
| **Owner (Creator)** | Yes | Full — habits, personal tasks, family tasks, partner-assigned tasks, kids tasks, rewards, alarms, grocery, settings | 1 |
| **Partner / Spouse** | Yes | Family tasks, tasks assigned to them (accept/reject), shared grocery list, kid task rating | 1 |
| **Kid** | No | Managed by owner — tasks, habits, reward points tracked by parent | Up to 4 |

---

## 3. Screens & Navigation

### Bottom Navigation (5 tabs)

| Tab | Icon | Route |
|-----|------|-------|
| Home | 🏠 | `/home` |
| Tasks | 📋 | `/tasks` |
| Habits | 🎯 | `/habits` |
| Rewards | 🏆 | `/rewards` |
| Family | 👨‍👩‍👧 | `/family` |

### Header

- **App title:** "Doable" (left)
- **Mic icon 🎙️** (right) — navigates to `/test-voice` for voice task input
- **Bell icon 🔔** (right) — navigates to `/alarms`, shows badge count of active task + habit reminders
- **Avatar** (right) — shows user initials + "Hi, [FirstName]", navigates to `/family`

### Additional Routes (not in bottom nav)

| Route | Access |
|-------|--------|
| `/alarms` | Header bell icon |
| `/fasting` | FastingCard on Home, direct URL |
| `/grocery` | Direct URL |
| `/family-setup` | Post-signup flow |
| `/join` | Invite link |
| `/voice-capture` | Deep link from Google Assistant |
| `/test-voice` | Mic button on Home — voice task testing |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Public |

---

### 3.1 Home Screen (`/home`)

- **Greeting header:** "Hey, [FirstName]! 👋" with subtitle "What needs to get done today?"
- **Top-right icons:** Mic button (→ `/test-voice`) + Bell button (→ `/alarms`)
- **Quick task creation card:**
  - Text input "What needs to be done?"
  - Assignee pills: Me (lavender) + each kid (their color)
  - "+ Add Task" button (turns green with "✓ Task added!" on success)
- **Fasting card** (always visible — shows idle or active state)
- **My Tasks section:**
  - Shows up to 5 active tasks assigned to "me", sorted overdue-first then by due date
  - Each row: circle complete button · category icon · title · due date (red ⚠ if overdue) · priority badge (high/low only)
  - Tapping the circle calls `markComplete()` immediately
  - "View all" link top-right navigates to `/tasks`
  - "+N more tasks →" footer when more than 5 active tasks exist
  - Empty state: 🎉 "All caught up! No active tasks."
- **FAB (+):** fixed bottom-right, opens `/tasks` with task creation modal

---

### 3.2 Tasks Screen (`/tasks`)

- **Header:** "Tasks" + count of active tasks
- **📨 Response Needed section** (shown at top when tasks are pending):
  - Cards for tasks assigned to the current user with `assignment_status = pending_acceptance`
  - Shows: task title, description, due date, priority, "From [Partner]" banner
  - **✓ Accept** (mint) and **✕ Reject** (rose) action buttons
  - Rejecting shows an optional reason text input before confirming
- **Person tabs:** Everyone · Me · [Kid1] · [Kid2] · ...
  - "Me" filter includes tasks where current user is assignee (`assigned_to_user_id`)
- **Status filter chips:** All / Active / Done / High Priority
- **Task cards:** title, assignees (color-coded pills), due date, priority badge, category icon, complete circle
  - 🔒 lock icon on personal (private) tasks
  - 🕐 amber "Awaiting acceptance" badge for tasks pending partner acceptance (creator view)
  - ✕ rose "Task rejected" badge with rejection reason + Reassign / Delete actions (creator view)
  - Partner assignment shown as "→ Partner" badge
- Completing a personal task calls `markComplete()` directly
- Completing a kid task opens the rating modal to award points
- **FAB (+):** opens add task modal

**Task modal — Assign to section:**
| Option | Behaviour |
|--------|-----------|
| 🔒 Me (private) | Task visible only to creator — `is_private = true` |
| 👤 Partner [name] | Notifies partner; `assignment_status = pending_acceptance` |
| 👨‍👩‍👧 Family | Visible to all family members — `is_private = false` |
| Kid pills | Multi-select, combined with adult selection |

- When "Partner" is selected, an info banner appears: *"[Partner] will be notified and can accept or reject this task."*

**Task modal — other fields:** Title, Due date, Reminder time, Alert type, Nudge interval, Priority, Category, Recurrence, Description

Recurring tasks auto-create next occurrence on completion.

---

### 3.3 Habits Screen (`/habits`)

- **Header:** "Habits" + count
- **Tab switcher:** Mine · [Kid1] · [Kid2] · ...
- **Habit cards:** icon, title, frequency label, 7-day dot calendar (green=done, red=missed, orange=today), streak counter 🔥, target count, complete/undo button
- Kid habits: completing opens streak bonus toast if 7-day streak achieved (+5 bonus points)
- **FAB (+):** opens add habit modal
- **Habit modal fields:** Title, Icon (emoji picker from 24 preset icons), Description, Frequency (Daily/Weekdays/Weekends/Custom days), Target count per day, Reminder time, Category, Assignees (multi-select)

---

### 3.4 Alarms Screen (`/alarms`) — Phase 10 ✅

- **Standalone Alarms section** (top):
  - List of user-created alarms sorted by time
  - Each row: time (12h format), label, repeat pattern, sound icon, enable/disable toggle
  - Tapping a row opens edit modal
  - "+" Add button (top-right) and FAB both open create modal
  - Empty state if no alarms
- **Task & Habit Reminders section** (below):
  - Pulled automatically from tasks with `reminder_time` and habits scheduled today
  - Sub-sections: Today's Reminders · Nudge Reminders · Done Today
  - Each row: time pill, category/habit icon, title, type badge (🔔 Notify / ⏰ Alarm / 📳 Nudge), nudge interval
- **Notification permission banner:** prompts user to allow browser notifications; shows green confirmed state when granted
- **Polling:** checks every 30 seconds while page is open; fires browser Notification API for due alarms; tracks fired alarms in localStorage per day to prevent duplicates
- **Add/Edit Alarm Modal:**
  - Time picker (native `<input type="time">`)
  - Label (optional free text)
  - Repeat days (Sun–Sat toggle buttons, empty = one-time)
  - Sound selector: Default 🔔 / Bell 🛎️ / Chime 🎵 / Silent 🔕
  - Enabled/Disabled toggle switch
  - Delete button (edit mode only)

---

### 3.5 Family & Account Screen (`/family`)

Combined page with two sub-tabs: **Family** and **Account**

**Family tab — no family yet:**
- Create family card: family name input + "Create Family" button
- Divider "— or join existing —"
- Join family card: invite code input + "Join Family" button

**Family tab — has family:**
- Invite code card: shows generated code, 📋 "Tap to copy" button (shows "✓ Copied!" feedback)
- Send invite email: email input + "Send via Email" button opens `mailto:` with code pre-filled
- Members list: each member shows email, role badge (Owner/Partner), joined date, remove button (owner only)
- Kids section: add form (collapsible, with name + color picker), each kid shows name, color swatch, edit name/color, remove button

**Account tab:**
- Avatar circle with initials (lavender background)
- Display name input + "Save" button (upserts to `user_profiles` table)
- Email display (read-only)
- Sign Out button
- App version footer "Doable v1.0"

---

### 3.6 Fasting Tracker Screen (`/fasting`)

- Circular SVG progress ring (stroke-dashoffset animation)
- Live timer updating every second (HH:MM:SS)
- Stage name + motivational message
- Stage progress bar (6 dot indicators)
- Start Fast / End Fast buttons
- Goal hours setting (input + update button)
- 7-day session history bar chart (recharts)
- Stats: total sessions, average duration, goals hit

**Home screen fasting card (FastingCard component):**
- Always shown on home page
- **Idle state:** "Start a Fast" button + goal display
- **Active state:** live timer, % progress ring, current stage, "End Fast" button

---

### 3.7 Rewards Screen (`/rewards`)

Three tabs: **🏆 Points** · **🎁 Store** · **📜 History**

**Points tab (leaderboard):**
- Kid point cards (2-column grid): name, current balance, earned, spent — no rank medals
- **⭐ Adhoc Reward section** (owner only): "Caught a great moment?" card with gradient background and a single "⭐ Give Bonus Points" button that opens the Give Points modal
- Recent Redemptions list

**Store tab:**
- Reward cards with title, icon, cost; "Redeem" button per kid (enabled if balance ≥ cost)
- FAB (+) to add new reward (owner only)

**History tab:**
- Chronological list of all point events (task ratings, streak bonuses, adhoc awards)
- Each row: icon, reason/title, kid name badge, date, ±points

**Give Points modal:** kid selector, +Award / −Deduct toggle, amount (quick picks + custom), reason (quick picks + custom), optional **photo capture** (camera or gallery, compressed to ≤900px JPEG, uploaded to `moment-photos` Supabase Storage bucket), save button — reusable across sessions. Photos render above the event row in History tab.

---

### 3.8 Grocery Screen (`/grocery`)

- Text input + "Add" button (Enter key supported)
- Unpurchased items list (top): checkbox, item name, delete button
- Purchased items list (bottom, strikethrough + dimmed): checkbox to uncheck, delete button
- "Clear Purchased" button
- Real-time sync via Supabase Realtime — changes appear on partner's device within seconds
- Empty state when list is empty

---

### 3.9 Voice Task Screens — Phase 11 ✅

**Voice Task Screen (`/test-voice`):**
- Dedicated full-screen mic interface — no navigation away needed
- Large mic button: **Idle → Listening → Stopped** states
- Uses Web Speech API with `continuous: true` and `interimResults: true` — keeps listening until user taps stop; captures full sentences, not just first 1–2 words
- Live transcript shown as user speaks
- On stop: parsed preview card shows — Task title, due date, priority
- **Assignee picker** (defaults to Me, always): Me pill (lavender) + kid pills (each kid's color) + Partner pill (sky) — multi-select, resets to "Me" on each new recording
- Redo / Add Task buttons; stays on same screen after creation
- **Session list** below shows all tasks created this session with ✓ checkmarks
- **Manual input fallback** ("Or type a task") shown when mic is idle
- `handleCreate` uses `selectedAssignees` — parsed text never overrides assignee default

**Voice Capture (`/voice-capture`):**
- Reads URL params; calls `parseDeepLink()` then `parseTaskText()`
- Opens `TaskModal` pre-populated with parsed values
- On save: calls `createTask()` then navigates to `/tasks`
- Handles `invite` action by redirecting to `/join?code=`
- Handles `complete_task` action: matches task by title via `findTaskByTitle()`, shows confirmation screen, marks complete on confirm

---

## 4. Feature Specifications

### 4.1 Task Management

| Field | Detail |
|-------|--------|
| Title | Free text — required |
| Assigned to | Me (private) / Partner (accept/reject) / Family (shared) / kid(s) |
| Privacy | `is_private = true` → only creator + assignee can see |
| Assignment status | `pending_acceptance` / `accepted` / `rejected` |
| Rejection reason | Optional text from assignee |
| Due date | Date picker (Today / Tomorrow shortcuts) |
| Reminder time | Time picker — fires browser notification when due |
| Alert style | Notification / Alarm-style / Repeated nudge |
| Nudge interval | 5 / 10 / 15 / 30 / 60 min |
| Priority | High (rose) / Medium (amber) / Low (gray) |
| Category | Home / Work / Health / Shopping / Kids / School / Finance / Other |
| Recurring | None / Daily / Weekly / Monthly — auto-creates next task on completion |
| Overdue | Computed: due_date < today && !completed_at |

### 4.2 Task Assignment Workflow (Phase 14 ✅)

When User A assigns a task to Partner (User B):

1. Task created with `assignment_status = 'pending_acceptance'`, `assigned_to_user_id = User B`
2. User B sees "📨 Response Needed" section at top of Tasks page
3. User B taps **✓ Accept** → status → `accepted`; task moves to active list
4. User B taps **✕ Reject** → optional reason input → status → `rejected`
5. User A sees rejected task with reason + Reassign / Delete options

**Privacy rules:**
| Scope | `is_private` | `assigned_to_user_id` | Visible to |
|-------|-------------|----------------------|------------|
| Personal | `true` | `null` | Creator only |
| Assigned to partner | `true` | partner UUID | Creator + partner |
| Family | `false` | `null` | All family members |
| Kids | `false` | `null` | All parents |

### 4.3 Habit Tracking

- Habits can be assigned to Owner ('me') and/or any kid (multi-assignee)
- Frequency: Daily / Weekdays / Weekends / Custom (pick specific days)
- Target count per day (e.g. drink water 8x)
- 7-day dot calendar: green (done), red (missed), orange (today not yet done)
- Streak counter — computed from consecutive scheduled days with completions
- **1 point per completion:** every time a kid completes a habit, 1 point is auto-awarded (type: `habit_completion`) before the streak check
- **7-day streak bonus:** completing a habit every scheduled day for 7 consecutive days awards +5 bonus points to kid, fires confetti, shows toast
- Habits reset at midnight — tracked by date strings (YYYY-MM-DD)

### 4.4 Rating Scale & Points

| Rating | Emoji | Points |
|--------|-------|--------|
| Awesome | 🌟 | +5 |
| Good | 👍 | +3 |
| Ok Ok | 😐 | +1 |
| Very Bad | 👎 | −2 |

- Ratings are configurable in Manage Ratings modal
- Each rating event is stored in `kid_point_events` table (type: `task_rating`)
- Streak bonuses stored in same table (type: `streak_bonus`)
- Adhoc awards/deductions stored in same table (type: `adhoc`) — can include a `photo_url` for moment capture
- Habit completions stored in same table (type: `habit_completion`) — 1 pt per completion
- Kid points balance = SUM of all `kid_point_events` for that kid

### 4.5 Redeemable Rewards

Default rewards (configurable):

| Reward | Cost |
|--------|------|
| 30 min extra screen time | 30 pts |
| Ice cream treat | 100 pts |
| Choose weekend activity | 200 pts |

- Rewards stored in `rewards` table, fully configurable (add / edit / delete)
- On redemption: creates `redemption_history` record, deducts from balance

### 4.6 Intermittent Fasting Tracker

| Stage | Hours | Motivational Message |
|-------|-------|----------------------|
| Fed state | 0h | Every journey starts with one step — you have got this! |
| Glycogen burning | 4h | Great start! Your body is using stored sugars for energy. |
| Fat burning begins | 8h | You are in the zone! Fat burning has started. |
| Deep fat burning | 12h | Over halfway! Your metabolism is in full fat-burning mode. |
| Autophagy kick-in | 16h | Goal reached! Your body is now cleaning and renewing cells. |
| Deep fasting zone | 20h | Elite mode! Most people never get here — incredible! |

- Default goal: 16 hours (user-configurable)
- Active session stored in `fast_sessions` table (end_time = NULL while active)
- Timer updates every second via `setInterval`
- Progress ring: SVG `stroke-dashoffset` animation

### 4.7 Standalone Alarms (Phase 10 ✅)

- Created and managed independently of tasks/habits
- Stored in `alarms` table (user-scoped, not family-scoped)
- Fields: time (HH:MM), label (optional), enabled toggle, repeat days (0–6), sound (default/bell/chime/silent)
- Repeat days: empty array = one-time alarm; 7 days = every day; partial = selected days
- Firing logic: polls every 30 seconds while app is open; uses browser Notification API; deduplicates via localStorage key per alarm+date
- Enable/disable toggle without deleting the alarm

### 4.8 Task & Habit Reminders

- Task reminders: tasks with `reminder_time` and no `completed_at`
- Habit reminders: habits with `reminder_time` scheduled for today
- Alert types:
  - **Notification:** single browser notification at reminder time
  - **Alarm:** same as notification (native alarm sound requires Capacitor — Phase 12)
  - **Nudge:** re-notifies every X minutes starting from reminder time until task completed
- Badge count in header bell = active task reminders + active habit reminders

### 4.9 Grocery List

- Shared between owner and partner (family-scoped)
- Real-time sync via Supabase Realtime (INSERT / UPDATE / DELETE events)
- Max 100 items per family
- Purchased items shown separately with strikethrough; "Clear Purchased" bulk deletes them

### 4.10 Family Collaboration

- Family created by owner with auto-generated 8-character invite code
- Partner joins via invite code input on `/join` route
- Owner can send invite code pre-filled in email via `mailto:` link
- Family data scoped by `family_id` across all tables
- Supabase Realtime subscription on tasks, grocery items
- Owner can add/edit/remove kid profiles (name + color)
- Partner can view and complete shared tasks, accept/reject assigned tasks, rate kid tasks, view grocery list
- Personal tasks are private — partner cannot see owner's `is_private` tasks and vice versa
- Profile name saved to `user_profiles` table; falls back to `user_metadata` then email prefix

### 4.11 Voice Task Capture — Phase 11 ✅

**Built components:**
- `src/utils/taskParser.ts` — natural language parser (title, due date, assignees, priority, category)
- `src/utils/deepLinkHandler.ts` — parses/builds `doable://` deep link URLs
- `src/pages/Voice/VoiceCapture.tsx` — receives deep link, pre-populates task modal
- `src/pages/Voice/TestVoice.tsx` — in-app test harness for voice commands
- Deep link intent filters in `AndroidManifest.xml` for `doable://` and `https://app.doable.com`

---

## 5. Database Schema

### Supabase Tables

| Table | Key Columns | Scope |
|-------|-------------|-------|
| `families` | id, name, owner_id, invite_code | Family |
| `family_members` | family_id, user_id, role (owner/partner), joined_at | Family |
| `user_profiles` | id (= auth user id), full_name | User |
| `kid_profiles` | id, family_id, name, color | Family |
| `tasks` | id, family_id, title, assignees[], due_date, reminder_time, reminder_type, nudge_interval, priority, category, recurrence, completed_at, ratings[], **assigned_to_user_id**, **assignment_status**, **rejection_reason**, **responded_at**, **is_private** | Family |
| `habits` | id, family_id, title, assignees[], frequency, frequency_days[], target_count, icon, reminder_time, is_active | Family |
| `habit_completions` | id, habit_id, family_id, completed_by, date | Family |
| `fast_sessions` | id, user_id, family_id, start_time, end_time, goal_minutes | User |
| `fasting_goals` | user_id, goal_hours | User |
| `grocery_items` | id, family_id, name, is_purchased | Family |
| `rating_types` | id, family_id, label, emoji, point_value | Family |
| `rewards` | id, family_id, name, point_cost | Family |
| `redemption_history` | id, kid_id, family_id, reward_id, points_deducted, created_at | Family |
| `kid_point_events` | id, kid_id, family_id, points, reason, type (adhoc/streak_bonus/task_rating/habit_completion), habit_id, created_by, event_date, **photo_url** | Family |
| `alarms` | id, user_id, family_id, time, label, enabled, repeat_days[], sound | User |

### Migration Files

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | families, family_members, user_profiles, kid_profiles, tasks |
| `002_enable_rls.sql` | Row-level security policies |
| `003_habits.sql` | habits, habit_completions |
| `004_rewards.sql` | rating_types, rewards, redemption_history |
| `005_rating_config.sql` | Rating configuration updates |
| `006_fasting.sql` | fast_sessions, fasting_goals |
| `007_grocery.sql` | grocery_items |
| `009_kid_point_events.sql` | kid_point_events (replaces habit_streak_bonuses) |
| `010_alarms.sql` | alarms table + patch ALTER TABLEs + schema cache reload |
| `011_fcm_tokens.sql` | FCM push notification tokens |
| `014_task_assignment.sql` | assigned_to_user_id, assignment_status, rejection_reason, responded_at, is_private — updated RLS |
| `015_partner_display_name.sql` | display_name column on family_members |
| `016_task_subtasks.sql` | subtasks JSONB column on tasks (checklist items per task) |
| `017_fix_privacy_and_display_name.sql` | Privacy and display name fixes |
| `018_grocery_added_by.sql` | added_by column on grocery_items |
| `019_moment_photos.sql` | photo_url TEXT column on kid_point_events; moment-photos Storage bucket |

---

## 6. Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| **Platform** | Android 10+ (API level 29+) |
| **App startup** | Opens in under 2 seconds |
| **Real-time sync** | Changes reflected within 3 seconds (Supabase Realtime) |
| **Offline support** | Tasks and habits load from local cache when no internet |
| **Authentication** | Email + password via Supabase Auth |
| **Database** | Supabase PostgreSQL — free tier |
| **Push notifications** | Firebase Cloud Messaging (FCM) — Phase 12 |
| **Alarm reminders** | Browser Notification API (web); Capacitor local notifications (Phase 12) |
| **Voice integration** | Android deep links (`doable://`) — Phase 11 ✅ |
| **Privacy** | Personal tasks (`is_private = true`) only visible to creator; partner tasks visible to creator + assignee only — enforced via RLS |
| **Family size** | Maximum 6 members: 2 parents + 4 kids |

---

## 7. Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| **Frontend framework** | React 18 + TypeScript + Vite | Strict TypeScript, ESLint |
| **Styling** | Tailwind CSS v4 | Custom colors via `@theme { --color-*: hex }` |
| **Routing** | React Router v6 | Protected routes via `ProtectedRoute` wrapper |
| **Database + Auth** | Supabase | PostgreSQL + Auth + Realtime |
| **Real-time sync** | Supabase Realtime | Channel subscriptions per feature |
| **State management** | React Context (per feature) | AuthContext, FamilyContext, TaskContext, HabitContext, RewardsContext, FastingContext, GroceryContext, AlarmContext |
| **Charts** | recharts | Fasting history bar chart |
| **Notifications** | Browser Notification API | Polled every 30s; Capacitor in Phase 12 |
| **Confetti** | canvas-confetti | Fires on 7-day habit streak bonus |
| **Android wrapper** | Capacitor 8.x | Deep links, push notifications, local notifications |
| **Cloud build** | EAS Build | `eas.json` configured for APK (preview) and AAB (production) |
| **Code hosting** | GitHub | `Neeraj-Khandelwal/doable-app` |
| **Play Store** | Google Play Console | $25 one-time — Phase 13 |

### Color System

| Name | Hex | Usage |
|------|-----|-------|
| `lavender` | `#7C6FF0` | Primary brand, buttons, active states |
| `peach` | `#FF8F5E` | Accent |
| `mint` | `#2EB87A` | Success, habit completion, accept actions |
| `sky` | `#2FA8E0` | Info, notifications |
| `amber` | `#E8A800` | Medium priority, warnings, pending states |
| `rose` | `#E85450` | Errors, high priority, destructive, reject actions |

---

## 8. Out of Scope (MVP)

- iOS version (Siri Shortcuts planned for v2.0)
- Dark mode (planned)
- Third-party login (Google, Apple)
- Task comments or in-app chat
- File attachments on tasks
- Kids logging in to the app
- Multi-language support (English only v1.0)
- Offline voice processing
- Voice task update: "OK Google, reschedule homework to Friday in Doable"
- More than 6 family members
- Native alarm sound (requires Capacitor foreground service)
- Background alarm firing when app is closed (requires Capacitor foreground service)
- In-app family chat

---

## 9. MVP + Enhancement Success Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 01 | Owner can sign up, create family, and invite partner | ✅ Built |
| 02 | Owner can create and track daily habits with 7-day streak calendar | ✅ Built |
| 03 | Owner can create personal tasks with due dates and reminder alerts | ✅ Built |
| 04 | Owner can create and view tasks separately per kid via tab switcher | ✅ Built |
| 05 | Completing a kid task opens rating modal and awards points | ✅ Built |
| 06 | Partner can see and complete shared family tasks in real time | ✅ Built |
| 07 | Fasting tracker starts, runs live timer, shows motivational stage | ✅ Built |
| 08 | Fasting live card appears on home screen when fast is active | ✅ Built |
| 09 | Active tasks for current user shown on home screen below fasting card | ✅ Built |
| 10 | Overdue tasks highlighted in red with ⚠ badge on home and tasks screens | ✅ Built |
| 11 | Repeated nudge re-notifies every X minutes until task marked done | ✅ Built |
| 12 | Standalone alarms created, edited, deleted with repeat day schedule | ✅ Built |
| 13 | Alarm enable/disable toggle without deleting | ✅ Built |
| 14 | Mayra and Shagun have separate points balances that accumulate | ✅ Built |
| 15 | Rewards redeemable when points threshold reached | ✅ Built |
| 16 | Rating scale configurable (label, emoji, points) | ✅ Built |
| 17 | Owner can manually give/deduct adhoc points to kids with reason | ✅ Built |
| 18 | 7-day habit streak awards +5 bonus points with confetti | ✅ Built |
| 19 | Grocery list shared in real time between owner and partner | ✅ Built |
| 20 | Family + Account merged into single tab; profile name editable | ✅ Built |
| 21 | Voice command deep link creates pre-populated task via VoiceCapture page | ✅ Built |
| 22 | Voice task modal allows review, edit, and save before database commit | ✅ Built |
| 23 | Owner can assign task to partner; partner sees accept/reject prompt | ✅ Built |
| 24 | Personal tasks (Me private) hidden from partner via RLS | ✅ Built |
| 25 | Rejected task shows reason and Reassign/Delete options to creator | ✅ Built |
| 26 | Adhoc reward section with "Give Bonus Points" on Rewards leaderboard | ✅ Built |
| 27 | Partner display name stored and shown everywhere (task assignment, voice screen) | ✅ Built |
| 28 | Task templates — horizontal chip picker pre-fills title/category/priority/recurrence | ✅ Built |
| 29 | Push notifications fire when partner is assigned a task or accepts/rejects | ✅ Built |
| 30 | Task subtasks — JSONB checklist with inline add/check/delete; progress shown on TaskCard | ✅ Built |
| 31 | Calendar view for tasks — monthly grid with priority dots; tap day to expand task list | ✅ Built |
| 32 | Voice mark-done — `/voice-capture?action=complete_task` matches task by title, shows confirmation | ✅ Built |
| 33 | Real-mic voice screen — continuous speech, live transcript, Me-defaulted assignee picker, session list | ✅ Built |
| 34 | Photo moment capture on adhoc points — camera/gallery → compressed → Supabase Storage → History tab | ✅ Built |
| 35 | Kids earn 1 point automatically per habit completion (in addition to streak bonuses) | ✅ Built |
| 36 | Kid task completion from Home screen shows rating modal (bug fix) | ✅ Built |
| 37 | Task creation allows kid-only assignment — Me pill is deselectable (bug fix) | ✅ Built |
| 38 | App is published on Google Play Store and installable on Android 10+ | ⏳ Phase 13 |

---

## 10. Build Timeline

| Phase | Activity | Status |
|-------|----------|--------|
| Phase 1 | Requirements, features, family setup, UI design | ✅ Complete |
| Phase 2 | UI prototype — all screens designed | ✅ Complete |
| Phase 3 | Auth, family, tasks — Supabase connected | ✅ Complete |
| Phase 4 | Habit tracking with 7-day calendar + streaks | ✅ Complete |
| Phase 5 | Rewards, rating system, kid points | ✅ Complete |
| Phase 6 | Adhoc point awards/deductions, streak bonuses | ✅ Complete |
| Phase 7 | Intermittent fasting tracker | ✅ Complete |
| Phase 8 | Grocery list with real-time sync | ✅ Complete |
| Phase 9 | Navigation cleanup — merged Family+Profile, removed launch grid, added active tasks on home | ✅ Complete |
| Phase 10 | Standalone alarms with CRUD + AlarmContext + modal | ✅ Complete |
| Phase 11 | Voice Integration — deep links + taskParser + VoiceCapture + TestVoice | ✅ Complete |
| Phase 12 | Android wrap — Capacitor, APK build, keystore, EAS config | ✅ Complete |
| Phase 13 | Play Store — AAB upload, App Actions, store listing | ⏳ Upcoming |
| Phase 14 | Task assignment with accept/reject + privacy model | ✅ Complete |
| Phase 15 | Partner display name — stored in family_members, shown in all assignment flows | ✅ Complete |
| Phase 16 | Task templates — 8 pre-built chips in TaskModal (new task mode only) | ✅ Complete |
| Phase 17 | Push notifications — assignment, accept, reject via Supabase Realtime diff | ✅ Complete |
| Phase 18 | Task subtasks — JSONB checklist, inline UI, progress on TaskCard | ✅ Complete |
| Phase 19 | Calendar view — monthly grid with priority dots, expandable day list | ✅ Complete |
| Phase 20 | Voice mark-done — complete_task deep link + findTaskByTitle matcher | ✅ Complete |
| Enhancement | UX polish — grocery attribution, fasting gamification, rewards reset, display names | ✅ Complete |
| Enhancement | Real-mic voice screen, photo moments, 1pt/habit, bug fixes | ✅ Complete |

---

## 11. Future Roadmap

### v1.1 (Q3 2026)
- Dark mode support
- Multi-language support (Spanish, French, German)
- Calendar view for habits (tasks calendar ✅ already built)
- Native background alarm firing (Capacitor foreground service)
- Voice task update: "OK Google, reschedule homework to Friday in Doable"

### v1.2 (Q4 2026)
- Habit calendar view
- Offline mode with local-first sync
- Task recurrence exceptions (skip a day)
- Kid login / kid-facing view (read-only points + tasks)

### v2.0 (2027)
- iOS version with Siri Shortcuts
- iPad support
- Third-party login (Google, Apple)
- Task attachments
- In-app family chat

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Feature completion | 37/38 criteria met |
| App rating | 4.5+ stars on Play Store |
| Real-time sync latency | < 3 seconds |
| Daily active users | 100+ by month 3 |
| Voice adoption (post Phase 11) | 30% of users within first week |
| Task assignment usage | 50% of partner families use assign feature |

---

## Document Information

| Field | Value |
|-------|-------|
| **Prepared by** | Personal Learning Project |
| **Status** | Phases 1–20 complete + enhancements — Phase 13 (Play Store) next |
| **Last updated** | May 17, 2026 |
| **Next review** | After Phase 13 completion |

---

**End of PRD Document**
