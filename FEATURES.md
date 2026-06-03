# Kura — Features

## Data Model

All FK references to `auth.users` use `ON DELETE CASCADE` so account deletion removes all user data automatically.

| Table | Key columns |
|---|---|
| `user_profiles` | `user_id` (FK → auth.users CASCADE DELETE), `zip_code`, `lawn_size`, `grass_type`, `lat`, `lng`, `push_token`, `season_override`, `notifications_enabled`, `effort_level` |
| `tasks` | `id`, `title`, `subtitle`, `why_it_matters`, `estimated_minutes`, `recurrence`, `seasons text[]`, `grass_types text[]`, `min_effort_level` |
| `task_completions` | `id`, `user_id` (RLS + CASCADE DELETE), `task_id`, `completed_at`, `week_of` |
| `lawn_photos` | `id`, `user_id` (RLS + CASCADE DELETE), `storage_path`, `taken_at`, `week_number`, `season` |
| `recommendation_events` | `id`, `user_id` (RLS + CASCADE DELETE), `type`, `status`, `snoozed_until`, `soil_temp_at_trigger`, `created_at`, `updated_at` |
| `weather_cache` | `lat`, `lng`, `fetched_date` (PK composite), `soil_temp_6cm` |
| `soil_temp_streaks` | `lat`, `lng` (PK composite), `streak_days`, `last_updated` |

**Supabase Storage:** private bucket `lawn-photos`. Objects are stored at `{user_id}/{timestamp}-week-{n}.jpg`. Access is controlled by Storage policies — there is no public URL. The account deletion Edge Function must call `storage.remove()` on the user's folder in addition to relying on the cascade FK for row cleanup.

Types generated via: `supabase gen types typescript > src/types/supabase.ts`

---

## Recommendation Engine

The recommendation engine decides what lawn care actions to recommend and when. It uses soil temperature as the primary signal to trigger time-sensitive recommendations. A fine-tuning layer of in-app Yes/No questions personalises each recommendation based on what the user is actually observing on their lawn.

### How it works

1. A Supabase Edge Function (`recommendation-engine`) runs daily via pg_cron
2. For each unique location it fetches today's soil temperature and updates `soil_temp_streaks`
3. When a rule fires, it inserts a row into `recommendation_events` and sends a push notification
4. The user taps the notification → app opens → a task card appears on the Home screen
5. The card asks a plain-English question ("Are you seeing green blades?") with Yes / Not yet buttons
6. **Yes** → `status = confirmed` — task accepted
7. **Not yet** → `status = snoozed` — hidden for 5 days, Edge Function rechecks after

### Soil temperature

Fetch `soil_temperature_6cm` from Open-Meteo. This is the closest depth to the 2-inch threshold cited by university turfgrass research for pre-emergent timing. Surface temperature (0cm) fluctuates too much with direct sunlight to be reliable for grass dormancy or pre-emergent timing.

### Weather data (Open-Meteo)

Open-Meteo is free, requires no API key, and provides soil temperature at 6cm depth. Temperatures are requested in °F (`temperature_unit=fahrenheit`).

**Deduplication:** Before calling Open-Meteo, the Edge Function groups users by lat/lng. Each unique location is fetched **once** per day regardless of how many users share it. Results are stored in `weather_cache` (keyed on `lat + lng + fetched_date`). If the cron retries, already-cached locations are skipped automatically.

### Geocoding (Zippopotam.us)

ZIP → lat/lng conversion happens **once** at the end of onboarding via Zippopotam.us (free, no API key, US/Canada). The result is stored in `user_profiles.lat` and `user_profiles.lng`. The Edge Function reads coordinates directly from the DB on every run — the geocoding API is never called again after signup.

### Grass type inference

When a user selects "I'm not sure" on the GrassType onboarding screen:
1. Their ZIP is geocoded to lat/lng
2. Grass type is inferred from latitude: **≥ 37°N = cool-season**, **< 37°N = warm-season**
3. The inferred type is shown as a suggestion — never silently saved
4. The user confirms or overrides before continuing
5. After confirming, a note reminds them they can change it in Settings later

The recommendation engine never runs against a user whose grass type is unresolved (`unknown`).

**37°N reference (above = cool-season, below = warm-season):**

| Cool-season states | Warm-season states |
|---|---|
| WA, OR, ID, MT, WY, CO, UT, NV (north), ND, SD, NE, KS, MN, WI, MI, IA, IL, IN, OH, MO (most), PA, NY, NJ, CT, RI, MA, VT, NH, ME, DE, MD, WV, N. Virginia | HI, FL, GA, AL, MS, LA, SC, AR, OK, TX, NM, AZ, S. California, S. Nevada, S. Virginia, NC, TN |

Transition zone states (VA, NC, TN, central CA, central NV) straddle the line — the suggestion is shown to the user for confirmation rather than applied silently.

### recommendation_events table

One row per recommendation fired per user. The Edge Function inserts rows (service role); the client only reads and updates `status` / `snoozed_until`.

| Column | Purpose |
|---|---|
| `type` | Rule identifier, e.g. `pre_emergent`, `dormancy_break`, `spring_fertilize` |
| `status` | `pending` → `confirmed` / `snoozed` / `dismissed` |
| `snoozed_until` | Date set when user taps "Not yet" — Edge Function skips until this date passes |
| `soil_temp_at_trigger` | Soil temp when the rule fired (for debugging) |

**RLS:** Users may SELECT and UPDATE their own rows. INSERT is restricted to the Edge Function service role.

### weather_cache table

Stores today's soil temperature per unique lat/lng. Keyed on `(lat, lng, fetched_date)` so duplicate inserts are blocked by the primary key. No user access — service role only (RLS enabled, no policies).

### soil_temp_streaks table

Tracks how many consecutive days each location's soil has been at or above 50°F. Keyed on `(lat, lng)` — same deduplication unit as `weather_cache`, so one row covers all users at the same coordinates.

| Column | Purpose |
|---|---|
| `lat`, `lng` | Composite PK — one row per unique location |
| `streak_days` | How many consecutive days `soil_temp_6cm >= 50°F`. Reset to 0 when a day falls below. |
| `last_updated` | Date the Edge Function last wrote to this row — used to detect a skipped day and reset the streak. |

The Edge Function upserts this table once per unique location per run, after writing to `weather_cache`. Rules that require a consecutive-day threshold (e.g. `pre_emergent` fires when `streak_days >= 3 AND soil_temp_6cm BETWEEN 50 AND 55`) read from this table directly. No user access — service role only (RLS enabled, no policies).

### Push notifications

The Expo push token is registered at app launch via `usePushToken` and stored in `user_profiles.push_token`. The Edge Function reads this token and sends notifications via the Expo Push API when a rule fires. Notification content never includes PII (MASWE-0054).

Recommendation notification taps deep-link to `kura://home`. TanStack Query refetches on screen focus — the pending card is already there.

### "I've moved" — full data reset

Available in Settings. Warns the user that all lawn history, photos, and progress will be erased, then calls the `reset_user_data()` Postgres RPC which atomically deletes `user_profiles`, `task_completions`, `recommendation_events`, and `lawn_photos` rows. The `lawn-photos` Storage folder is deleted separately by the client after the RPC returns. The auth account (email/session) is preserved — no re-registration needed. Onboarding restarts from the Location step.

### Open items

- Soil temp threshold ranges per rule type — to be confirmed before Plan 3 (Edge Function) is implemented

---

## Effort Levels

Users pick a goal-based effort tier during onboarding (Step 3 of 4). The tier controls which lawn care tasks get recommended. It can be changed anytime in Settings.

### The three tiers

| Value | Label | Description | Who sees it |
|---|---|---|---|
| 1 | 🌱 Just keeping it alive | Only the tasks that truly matter | All users at this tier |
| 2 | 🌿 Nice-looking lawn | Regular upkeep, nothing too demanding | Tiers 2 and 3 |
| 3 | 🏆 Best on the block | The full seasonal routine, start to finish | Tier 3 only |

### How it works

Each task in the `tasks` table has a `min_effort_level smallint NOT NULL DEFAULT 1` column. The recommendation engine filters tasks with:

```sql
AND min_effort_level <= [user.effort_level]
```

This is cumulative — a tier-3 user always sees everything a tier-1 and tier-2 user sees. Tier 1 unlocks essentials only (e.g. pre-emergent); tier 2 adds regular upkeep (e.g. spring fertilize); tier 3 adds the full routine (e.g. aerate and overseed).

### Schema changes (to implement)

**Migration file** — add to `supabase/migrations/` with the next sequential timestamp:

```sql
-- Add effort level to user profiles. NOT NULL, no default — every user sets
-- this during onboarding. Value must be 1, 2, or 3.
ALTER TABLE user_profiles
  ADD COLUMN effort_level smallint NOT NULL
  CONSTRAINT effort_level_range CHECK (effort_level BETWEEN 1 AND 3);

-- Add minimum effort level to tasks. DEFAULT 1 so all existing tasks remain
-- visible to all users until explicitly raised.
ALTER TABLE tasks
  ADD COLUMN min_effort_level smallint NOT NULL DEFAULT 1
  CONSTRAINT min_effort_level_range CHECK (min_effort_level BETWEEN 1 AND 3);
```

**RLS:** No new policies needed. `user_profiles` already has RLS; `tasks` is read-only for all authenticated users.

### Onboarding store (to implement)

Add `effortLevel: 1 | 2 | 3 | null` to `useOnboardingStore` (Zustand). The `EffortLevel` screen writes to this field; `onboarding.service.ts` reads it and saves it to `user_profiles.effort_level` at the end of onboarding alongside zip, grass type, lat, and lng.

### Settings (to implement)

Add `useUpdateEffortLevel` mutation hook in `features/settings/hooks/`. It calls a Supabase update on `user_profiles` and invalidates the profile query so the Settings screen reflects the new value immediately.

### Zod validation

The shared schema lives in `shared/utils/validation.ts`:

```ts
// effortLevelSchema — validates that an effort level is exactly 1, 2, or 3.
// Used by onboarding, settings, and the service layer before any DB write.
export const effortLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
```

**All form inputs** must also be validated through Zod before touching state or the service layer. This includes: sign-in email, location ZIP code, location lawn size, and the effort level selection. See CLAUDE.md rule: "Validate all external input with Zod before it touches app state or the service layer."

---

## Welcome Flow

A 4-screen tutorial shown once, immediately after onboarding completes, before the user reaches the main app. It introduces Kura and orients the user to the four tabs. The flow persists on every app open until "Start Growing" is tapped on the final screen — after that it is never shown again.

### The four screens

| # | Label | Content |
|---|---|---|
| 1 | Welcome | Greeting by first name · "Your journey starts today" glass card · "Let's go →" CTA |
| 2 | Today Feature | "Each morning, one task." · Sample task preview card showing what the Today tab looks like · explanatory caption |
| 3 | Navigation | "Four tabs, four tools." · One pill card per tab with a one-line description · live tab bar at the bottom so the user can see what they're about to use |
| 4 | All Set | Checkmark circle · "You're all set." · "Start Growing" CTA (only exit from the flow) |

All screens share: Dynamic Island, status bar, progress dots (`Quick Tour · X of 4` label) pinned to the top.

### Persistence

The flow stays until "Start Growing" is tapped. Backgrounding or force-quitting the app returns the user to screen 1 of the flow, not wherever they left off. The dismissal is stored server-side so it survives reinstalls.

| Flag | Location | Default |
|---|---|---|
| `has_seen_welcome` | `user_profiles` column (`boolean NOT NULL DEFAULT false`) | `false` — new users always see the flow |

`welcomeService.markWelcomeSeen()` PATCHes this to `true` when "Start Growing" is tapped. The Zustand auth store is updated immediately after the write succeeds, which triggers `RootNavigator` to re-evaluate and route to `AppTabs`. Do not route until the write is confirmed.

**Schema migration:**

```sql
-- Records that the user has completed the one-time welcome flow.
-- Defaults false so all new users see it; existing rows are unaffected.
ALTER TABLE user_profiles
  ADD COLUMN has_seen_welcome boolean NOT NULL DEFAULT false;
```

### Routing order

`RootNavigator` evaluates on every session change:

1. No session → `AuthStack`
2. Session + no profile row → `OnboardingStack`
3. Session + profile + `has_seen_welcome = false` → `WelcomeFlow`
4. Session + profile + `has_seen_welcome = true` → `AppTabs`

`WelcomeFlow` is a full-screen non-dismissible stack. No back gesture, no hardware back escape — the only path to `AppTabs` is tapping "Start Growing."

### Visual design

The welcome flow uses the **blurred grass photo background** design from `mockups/welcome-flow.html` — not the onboarding gradient. The full visual spec lives in that file. Key implementation tokens:

| Element | Dark (`t4d`) | Light (`t4l`) |
|---|---|---|
| Photo layer | `blur(18px) saturate(0.85)` | `blur(18px) saturate(1.15) brightness(1.05)` |
| Colour overlay | `rgba(10,28,10,0.60)` | `rgba(210,255,225,0.36)` |
| Glass cards | `rgba(255,255,255,0.44)` | `rgba(255,255,255,0.88)` |
| CTA button background | `rgba(8,20,8,0.88)` | `#4F9D69` |
| CTA button text | `#D6EFD8` | `#BEE6CE` |
| Progress dot (inactive) | `rgba(255,255,255,0.22)` | `rgba(14,42,14,0.14)` |
| Progress dot (active) | `rgba(255,255,255,0.72)` · 18 × 5 px pill | `rgba(14,42,14,0.52)` · 18 × 5 px pill |

**Font styles** are copied from the onboarding screens — system sans-serif, no custom font families:

| Role | Size token | Weight token |
|---|---|---|
| Screen heading | `theme.typography.sizeXl` (24) | `theme.typography.weightBlack` ('900') |
| Step label pill | `theme.typography.sizeXs` (12) | `theme.typography.weightBold` ('700') |
| Body / caption | `theme.typography.sizeXs` (12) | `theme.typography.weightMedium` ('500') |
| Card title | `theme.typography.sizeSm` (14) | `theme.typography.weightBold` ('700') |
| Card body | `theme.typography.sizeXs` (12) | `theme.typography.weightRegular` ('400') |
| CTA button | `theme.typography.sizeSm` (14) | `theme.typography.weightBold` ('700') |

### Folder structure

```
features/welcome/
  screens/
    WelcomeFlow.tsx        # pager container — owns currentStep state (0–3)
  components/
    WelcomeStep1.tsx       # Welcome + "Let's go →"
    WelcomeStep2.tsx       # Today Feature + sample task preview
    WelcomeStep3.tsx       # Navigation pills + live tab bar
    WelcomeStep4.tsx       # All Set + "Start Growing"
    WelcomeDots.tsx        # progress dot row (total + active index props)
    WelcomeStepLabel.tsx   # "Quick Tour · X of 4" pill
  services/
    welcome.service.ts     # markWelcomeSeen()
```

### Service

```ts
// features/welcome/services/welcome.service.ts
export const welcomeService = {
  // markWelcomeSeen — sets has_seen_welcome = true for the current user.
  // Only called when the user taps "Start Growing" on screen 4.
  // Throws on Supabase error so the caller can catch and show an error
  // without routing the user into AppTabs prematurely.
  async markWelcomeSeen(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_profiles')
      .update({ has_seen_welcome: true })
      .eq('user_id', user.id);

    if (error) {
      logger.error('welcomeService.markWelcomeSeen failed', {
        operation: 'markWelcomeSeen',
        userId: user.id,
        supabaseCode: error.code,
      });
      throw new Error('markWelcomeSeen failed');
    }
  },
};
```

### WelcomeStep4 — error handling pattern

```ts
const handleStartGrowing = async () => {
  setErrorMessage(null);
  setIsSubmitting(true);
  try {
    await welcomeService.markWelcomeSeen();
    useAuthStore.getState().setHasSeenWelcome(true); // RootNavigator re-evaluates
  } catch {
    setErrorMessage('Something went wrong. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Lawn Progress Photos

Users take a "before" photo of their lawn at the end of onboarding, then receive push reminders at fixed intervals throughout the season to capture update shots. The Progress tab shows a scrollable before→now timeline so they can see how far their lawn has come.

### Photo reminder schedule

Reminders are scheduled locally via `expo-notifications` immediately after the user captures their before photo. The schedule is fixed — no server-side scheduling required.

| Interval | Timing | Notification copy |
|---|---|---|
| Before photo | Prompted at end of onboarding | — (in-app prompt, no push) |
| 4 weeks | 28 days after before photo | "Your lawn has had a month to grow — snap an update photo!" |
| 8 weeks | 56 days after before photo | "Two months in — time to see your progress!" |
| 16 weeks | 112 days after before photo | "It's been four months. Take a photo and see how far your lawn has come." |
| End of season | 180 days after before photo | "Season's almost over — capture your final photo before things go dormant." |

Notification content never includes ZIP code, grass type, or any other PII (MASWE-0054).

### Photo capture

Use `expo-image-picker` with camera mode. Always set `exif: false` to strip GPS metadata before the bytes ever leave the device — EXIF GPS coordinates count as location data (MASWE-0109).

```ts
// Always pass exif: false — EXIF data can contain GPS coordinates which we never collect
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality:    0.8,
  exif:       false,
  allowsEditing: false,
});
```

Request `CAMERA` permission at the moment the user taps "Take a photo" — not at app launch — and show a plain-English rationale before the system dialog appears (MASWE-0117). `MEDIA_LIBRARY` permission is never requested because photos go directly to Supabase Storage, not the device gallery.

### Photo storage

Photos live in a **private** Supabase Storage bucket named `lawn-photos`. The bucket has no public access — the app always fetches images via signed URLs with a 1-hour expiry. Photos are never cached to `AsyncStorage`, the device gallery, or any external storage (MASWE-0007).

```ts
// features/progress-photos/services/progressPhotos.service.ts
export const progressPhotosService = {
  // uploadLawnPhoto — reads the local file URI from expo-image-picker and streams
  // the bytes directly to Supabase Storage. The path starts with the user's auth UID
  // so the bucket policy can enforce per-user isolation server-side.
  // Returns the storage path (not a URL) — call getSignedPhotoUrl to display it.
  async uploadLawnPhoto(localUri: string, weekNumber: number): Promise<string> {
    lawnPhotoSchema.parse({ weekNumber }); // validate before touching Storage

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const path = `${user.id}/${Date.now()}-week-${weekNumber}.jpg`;
    const file = await fetch(localUri).then(r => r.blob());

    const { error } = await supabase.storage
      .from('lawn-photos')
      .upload(path, file, { contentType: 'image/jpeg', upsert: false });

    if (error) throw new Error(error.message);
    return path;
  },

  // getSignedPhotoUrl — exchanges a storage path for a short-lived signed URL.
  // The URL expires after 1 hour — never persist it; always fetch a fresh one.
  async getSignedPhotoUrl(storagePath: string): Promise<string> {
    storagePathSchema.parse(storagePath); // reject obviously malformed paths

    const { data, error } = await supabase.storage
      .from('lawn-photos')
      .createSignedUrl(storagePath, 3600);

    if (error) throw new Error(error.message);
    return data.signedUrl;
  },
};
```

**Supabase Storage bucket policies** — enforce server-side that users can only access their own folder:

```sql
CREATE POLICY "own_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lawn-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lawn-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own_photos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lawn-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Account deletion

The account deletion Edge Function must explicitly delete all objects under `{user_id}/` in the `lawn-photos` bucket before removing the user record. The `ON DELETE CASCADE` FK on `lawn_photos` handles row deletion automatically, but Supabase Storage objects require a separate `storage.remove()` call.

---

## Focus Card Dashboard (Home Tab — MVP)

The Home tab is a single screen that shows the user's active lawn care recommendations and lets them act on each one without leaving the screen. There is no separate detail screen — tapping a task row expands it inline.

### Three states

#### State 1 — Overview

The default state when the user opens the app. Shows a compact list of today's active recommendations plus any upcoming (future-season) tasks.

**Hero zone** (top, `flex: 1`):
- Step label: current day and date (e.g. "Saturday, May 31")
- Title: plain-English summary of the day — "Two things for your lawn today" / "All caught up" / "Nothing needed right now"
- Subtitle: one-line context in lime accent when relevant ("Your soil has been warm for 3 days")

**Glass panel** (bottom, `flex: 3`):
- One `FocusTaskRow` per active recommendation, ordered by priority
- Each row: icon · task name · contextual meta (e.g. "3 days without water") · time pill · chevron ›
- Active row background: `glassOnboardingOptionSelected` (`rgba(19,86,51,0.18)`)
- Upcoming (future-season) rows: `opacity: 0.40` with a dimmed season label instead of time
- Tapping a row transitions to State 2

#### State 2 — Focused

Triggered when the user taps a task row. The hero collapses and the glass panel expands to fill the available space. No screen navigation — the transition is an inline `LayoutAnimation`.

**Hero zone** (slim, `flex: 0` — sizes to content):
- Back button: "‹ Today"
- Step label: "TODAY'S TASK"
- Title: the task name ("Water your lawn")
- Subtitle: the trigger context in lime ("3 days without water · 94°F forecast")

**Glass panel** (expanded, `flex: 1`):
- "Why this matters" section label + one paragraph of plain-English reasoning
- Divider
- "How to do it" section label + numbered steps (1–3, kept brief)
- Chips row: ⏱ estimated time · 📍 where to do it
- CTA button: "Mark as done" (calls `useConfirmRecommendation`)
- Hint text: "Remind me later" (calls `useSnoozeRecommendation`, snoozes 5 days)

#### State 3 — After Completion

After the user marks a task done, the view returns to the overview layout. The glass panel shows two sections:

- **Done** — struck-through task name, `primaryDeep` filled check circle
- Divider
- **Still to do** — remaining active tasks in their normal compact rows

If all tasks are done, the glass panel shows a single "You're all caught up" message with a green check.

### Component structure

```
features/home/
├── screens/
│   └── HomeScreen.tsx          # top-level screen; owns focusedId state
├── components/
│   ├── FocusTaskRow/           # compact overview row; tappable
│   │   ├── index.tsx
│   │   ├── FocusTaskRow.tsx
│   │   └── FocusTaskRow.test.tsx
│   ├── FocusTaskDetail/        # expanded detail view (why / steps / CTA)
│   │   ├── index.tsx
│   │   └── FocusTaskDetail.tsx
│   └── CompletedTaskRow/       # struck-through row with check circle
│       ├── index.tsx
│       └── CompletedTaskRow.tsx
```

`HomeScreen` owns one piece of state: `focusedId: string | null`. When `null`, it renders the Overview layout. When set to a recommendation ID, it renders the Focused layout for that recommendation.

The hooks `useActiveRecommendations`, `useConfirmRecommendation`, and `useSnoozeRecommendation` from `features/recommendations/hooks/` supply all data — `HomeScreen` does not call Supabase directly.

### Recommendation display content

Each `recommendation_events` row has a `type` field (e.g. `pre_emergent`, `dormancy_break`, `spring_fertilize`). The static display copy for each type lives in:

```
features/recommendations/constants/recommendationContent.ts
```

This file maps each `type` to: icon, task name, contextual meta template, why-it-matters paragraph, and numbered how-to steps. Time estimate and lawn scope come from the joined `tasks` row (`estimated_minutes`).

### Data flow

```
recommendation_events (status = 'pending')
  └─ joined with tasks (for estimated_minutes, grass_types, seasons)
        └─ mapped to recommendationContent (for icon, why, steps)
              └─ rendered in HomeScreen via useActiveRecommendations
```

### Layout mechanics (React Native)

The hero-shrink / panel-expand is a layout animation, not navigation. Hero and glass panel are siblings in a flex column. Changing their `flex` value triggers a smooth `LayoutAnimation`.

```
ContentArea (flex: 1, flexDirection: 'column')
  ├── Hero        (flex: 1  →  flex: 0 when focused)
  └── GlassPanel  (flex: 3  →  flex: 1 when focused)
```

Wrap the `focusedId` state update in `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` to animate the transition. The Home screen has no keyboard input so this is safe — there is no `KeyboardAvoidingView` to conflict with (unlike `SignIn.tsx`).

### Empty and error states

| Situation | Hero title | Glass panel content |
|---|---|---|
| No active recommendations | "Your lawn is all caught up" | "Check back tomorrow — the engine runs daily." |
| All recommendations snoozed | "Nothing to do today" | Snoozed tasks listed with their resume date |
| Offline / query error | "Can't load your lawn data" | Retry button |

### Accessibility

- Each `FocusTaskRow` uses `accessibilityRole="button"` and `accessibilityLabel` = task name + time estimate
- Completed rows use `accessibilityState={{ disabled: true }}`
- "Mark as done" button uses `accessibilityState={{ busy: isConfirming }}` while the mutation runs

---

## Coach — AI Lawn Advisor (Post-MVP)

A conversational interface where Kura speaks to the user like a knowledgeable friend instead of presenting a task list. Recommendations arrive as short chat messages with an embedded action card. Users can ask follow-up questions in plain English.

### What changes from MVP

| MVP (Focus Card dashboard) | Coach |
|---|---|
| Today screen shows a scannable task list | Today screen is a chat thread |
| Tap a card → expands with steps | Kura sends the context as messages, action card embedded inline |
| Static "why it matters" copy per task | User can ask follow-up questions ("what if it rains?", "why does this matter?") |
| No personalised dialogue | Greeting and tone adapt to the user's name, lawn, and season |

### UX pattern

1. User opens the app — Kura greets them by name and delivers the day's situation in 2–3 short messages ("It's been 3 days since your last watering, and today hits 94°F.")
2. The recommendation arrives as an embedded action card — task name, time estimate, **Done** and **Skip** buttons
3. Marking done triggers a brief acknowledgement from Kura before the next recommendation appears
4. An input bar lets the user type free-form questions; Claude API answers grounded in the user's lawn profile

### Implementation notes (for when this is built)

- The Coach is a new tab (or replaces the Today tab) — the existing Focus Card dashboard is kept as a simpler alternative or removed
- Chat messages from Kura are stored locally (not server-side) and regenerated on each app launch — only task completion status writes to the DB
- Claude API (`claude-haiku-4-5-20251001` for cost) powers free-form Q&A; the system prompt is grounded with the user's grass type, location, season, recent completions, and today's `recommendation_events`
- The action card is the existing task card component with a different layout wrapper — no new data model needed
- Existing `recommendation_events` table drives what Kura says — the Coach just presents it differently
- Apply prompt caching on the system prompt (lawn profile + season context) to reduce API costs on repeated opens
