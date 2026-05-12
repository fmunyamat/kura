# Recommendation Engine — Design Spec
Date: 2026-05-11

## Overview

The recommendation engine decides what lawn care actions to recommend and when. It uses two primary data signals — soil temperature and cumulative Growing Degree Days (GDD) — to trigger time-sensitive recommendations. A fine-tuning layer of in-app Yes/No questions personalises recommendations per user based on what they're actually observing on their lawn.

---

## Scope

This spec covers:
- Daily server-side recommendation evaluation (Supabase Edge Function + pg_cron)
- GDD calculation, storage, and season reset logic
- Soil temperature fetching and averaging
- Weather API deduplication and caching
- Mid-season signup backfill
- Client-side recommendation display (task cards with Yes/No)
- Grass type inference and confirmation at onboarding
- "I've moved" data reset in Settings

---

## Architecture Overview

The system has two independent halves that communicate through the database.

### Server side (runs daily without user interaction)

A Supabase Edge Function called `recommendation-engine` runs every morning via pg_cron. It:
1. Loads all users with complete profiles, grouped by lat/lng
2. Fetches today's weather from Open-Meteo once per unique location (checking `weather_cache` first)
3. Updates each user's cumulative GDD by adding today's increment
4. Checks each user's GDD and soil temp against the rule set
5. Inserts into `recommendation_events` and sends a push notification when a rule fires

### Client side (runs when the user opens the app)

The Home screen fetches `pending` recommendations via TanStack Query and renders them as task cards above the regular task list. Each card shows a plain-English question and Yes/No buttons. Yes confirms the recommendation; No snoozes it for a configurable number of days.

---

## Data Model

### Changes to `user_profiles`

```sql
-- Add at onboarding (geocoded from ZIP, stored once)
lat               numeric(9,6)
lng               numeric(9,6)

-- GDD tracking (updated daily by Edge Function)
cumulative_gdd    numeric   DEFAULT 0
gdd_last_updated  date      -- NULL = new user awaiting backfill

-- Push notifications
push_token        text      -- Expo push token, upserted at app launch
```

### New table: `recommendation_events`

```sql
CREATE TABLE recommendation_events (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid REFERENCES auth.users ON DELETE CASCADE,
  type                   text NOT NULL,  -- 'pre_emergent' | 'dormancy_break' | 'spring_fertilize' | etc.
  status                 text NOT NULL DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'snoozed' | 'dismissed'
  snoozed_until          date,           -- set when status = 'snoozed'
  gdd_at_trigger         numeric,        -- cumulative GDD when this fired (for debugging)
  soil_temp_at_trigger   numeric,        -- averaged soil temp when this fired (for debugging)
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- RLS: users read and update their own rows only
-- Edge Function (service role) handles inserts
CREATE POLICY "own_recommendations"
  ON recommendation_events
  USING (auth.uid() = user_id);
```

### New table: `weather_cache`

```sql
CREATE TABLE weather_cache (
  lat             numeric(9,6),
  lng             numeric(9,6),
  fetched_date    date,
  soil_temp_6cm   numeric,   -- °F (Open-Meteo called with temperature_unit=fahrenheit)
  soil_temp_18cm  numeric,   -- °F
  tmax            numeric,   -- °F, daily max air temp
  tmin            numeric,   -- °F, daily min air temp
  created_at      timestamptz DEFAULT now(),
  PRIMARY KEY (lat, lng, fetched_date)
);
```

> All temperatures stored in °F. Request Open-Meteo with `temperature_unit=fahrenheit` so no conversion is needed before applying the GDD formula or soil temp thresholds.

Static tasks (shared, seeded) remain completely separate from `recommendation_events` (per-user, dynamic).

---

## GDD Calculation

### Base temperatures and season start dates

| Grass type    | Base temp | Season start |
|---------------|-----------|--------------|
| Cool-season   | 32°F      | January 1    |
| Warm-season   | 50°F      | March 1      |

### Daily formula

```
GDD_today = max(((tmax + tmin) / 2) − base_temp, 0)
cumulative_gdd += GDD_today
```

### Season reset

If `gdd_last_updated < season_start_this_year`, reset `cumulative_gdd = 0` before adding any new data. This handles the annual rollover automatically without a separate job.

---

## Soil Temperature

Fetch `soil_temperature_6cm` and `soil_temperature_18cm` from Open-Meteo and average them:

```
soil_temp = (soil_temperature_6cm + soil_temperature_18cm) / 2
```

This averages the upper root zone for a stable, accurate reading. Surface temperature (0cm) fluctuates too much with direct sunlight and air temp to be reliable for grass dormancy or pre-emergent timing.

---

## Edge Function — Daily Run

### Step 1 — Load and group users

Query `user_profiles` for all users with `grass_type != 'unknown'`, `lat IS NOT NULL`, and `push_token IS NOT NULL`. Group into a map of `"lat,lng" → [users]`. Split users into two buckets: **new** (`gdd_last_updated IS NULL`) and **existing**.

### Step 2 — Fetch weather per unique location

For each unique lat/lng:
1. Check `weather_cache` for a row matching today's date — if found, use it (handles cron retries and shared locations)
2. If not found:
   - **Existing users at this location:** fetch only today's data from Open-Meteo (`tmax`, `tmin`, `soil_temp_6cm`, `soil_temp_18cm`)
   - **New users at this location:** fetch historical data from season start to today (one-time backfill cost)
3. Insert into `weather_cache`

### Step 3 — Update cumulative GDD per user

Four cases handled in order:

| Condition | Action |
|---|---|
| `gdd_last_updated = today` | Skip — already processed (safe for retries) |
| `gdd_last_updated IS NULL` | Backfill: sum GDD from season start to today, store |
| `gdd_last_updated < season_start_this_year` | New season: reset to 0, then backfill from season start |
| Otherwise | Add today's single increment to stored total |

### Step 4 — Check rules

For each user, check their `cumulative_gdd` and averaged soil temp against the rule set. Each rule specifies:
- `type` — identifier string
- `grassTypes` — which grass types it applies to
- `condition` — function of `{ gdd, soilTemp }` returning boolean
- `snooze_days` — how long to snooze if user answers No
- `notificationTitle` / `notificationBody` — push copy

Before firing, verify no existing row for this `user_id + type` is `pending`, `confirmed`, or `snoozed` with `snoozed_until` in the future. If the coast is clear, insert a `pending` row and send a push notification via Expo Push API.

> **Note:** Specific GDD thresholds per rule type to be provided by Farai and added to the rule set before implementation.

### Step 5 — Season rollover cleanup

On Jan 1 (cool-season) and Mar 1 (warm-season), mark any leftover `pending` or `snoozed` rows from the previous season as `dismissed`. Confirmed rows are retained as historical record.

---

## Geocoding Strategy

Geocoding (ZIP → lat/lng) happens **once** at the end of onboarding via Zippopotam.us (free, no API key, US/Canada). The result is stored in `user_profiles`. The Edge Function reads lat/lng directly from the DB on every run — Zippopotam.us is never called again after signup.

---

## Grass Type Inference

When a user selects "I'm not sure" on the GrassType screen:
1. Geocode their ZIP to get lat/lng
2. Infer grass type from latitude: above 37°N = cool-season, below 37°N = warm-season
3. Show the inferred type as a recommendation — **do not silently save it**
4. UI copy (example intent): "Based on your location, we think you have cool-season grass. Does that sound right?"
5. User confirms or overrides before continuing
6. After confirming, inform them: "You can change this in Settings if you discover your grass type is different"

The recommendation engine never runs against a user whose grass type is unresolved.

---

## Grass Type — 37°N Reference

| Above 37°N (cool-season) | Below 37°N (warm-season) |
|---|---|
| WA, OR, ID, MT, WY, CO, UT, NV (north), ND, SD, NE, KS, MN, WI, MI, IA, IL, IN, OH, MO (most), PA, NY, NJ, CT, RI, MA, VT, NH, ME, DE, MD, WV, N. Virginia | HI, FL, GA, AL, MS, LA, SC, AR, OK, TX, NM, AZ, S. California, S. Nevada, S. Virginia, NC, TN |

Transition zone states (VA, NC, TN, MO bootheel, central CA, central NV) straddle the line — the inferred recommendation is shown to the user for confirmation rather than applied silently.

---

## Client Side

### New feature folder: `features/recommendations/`

```
features/recommendations/
  components/RecommendationCard/
    RecommendationCard.tsx
    RecommendationCard.test.tsx
    index.tsx
  hooks/
    useActiveRecommendations.ts   -- TanStack Query, fetches status='pending'
    useConfirmRecommendation.ts   -- mutation: status → 'confirmed'
    useSnoozeRecommendation.ts    -- mutation: status → 'snoozed', sets snoozed_until
  services/
    recommendations.service.ts
  constants/
    recommendationContent.ts     -- maps type → { title, question, yesLabel, noLabel }
  types.ts
```

### RecommendationCard

- Renders above the regular task list on the Home screen (time-sensitive, so shown first)
- Shows: title, plain-English question, Yes button, "Not yet" button
- Yes → `useConfirmRecommendation` → card disappears, query invalidated
- Not yet → `useSnoozeRecommendation` → card disappears, Edge Function skips until `snoozed_until`
- Multiple pending cards stack vertically
- If fetch fails, Home screen degrades gracefully — regular task list still loads

### Push notification tap

Deep-links to `kura://home`. TanStack Query refetches on screen focus — the pending card is waiting. No special handling needed beyond existing deep link infrastructure.

---

## Settings Additions

### Change grass type
Simple picker — updates `grass_type` in `user_profiles`. No data loss. Recommendation engine uses the new type from the next cron run.

### I've moved
Full data reset flow:
1. User taps "I've moved"
2. Warning: "Moving to a new location will erase all your lawn history, photos, and progress. This cannot be undone. Are you sure?"
3. On confirm → call `reset_user_data` RPC
4. Navigate to onboarding (Location step)

**`reset_user_data` Postgres RPC:**
Wrapped in a transaction — atomically deletes `user_profiles`, `task_completions`, `recommendation_events`, and `lawn_photos` rows for the user. Auth account (email/session) is preserved. After the transaction commits, calls `storage.remove()` on the user's `lawn-photos` folder. If storage deletion fails, it is logged for manual cleanup — DB is already clean and onboarding proceeds.

---

## Error Handling

| Failure | Behaviour |
|---|---|
| Open-Meteo unreachable for a location | Log, skip all users at that location, continue with remaining locations |
| Single user GDD update fails | Log, skip that user, continue |
| Push notification fails (expired token) | Log, continue — recommendation row still inserted, card visible on next app open |
| Confirm/snooze mutation fails on client | Show brief error message, leave card visible for retry |
| `reset_user_data` storage deletion fails | Log for manual cleanup — DB deletion already committed, onboarding proceeds |

Cron retries are always safe: `gdd_last_updated = today` guard skips already-processed users, and `weather_cache` PK prevents duplicate inserts.

---

## Testing

| What | How |
|---|---|
| GDD calculation | Unit tests — known tmax/tmin arrays → assert correct cumulative totals for both grass types |
| Season reset logic | Unit tests — assert cumulative_gdd resets on Jan 1 (cool) and Mar 1 (warm) |
| Mid-season backfill | Unit test with mocked Open-Meteo response — new user gets correct GDD on first run |
| Weather deduplication | Unit test — assert Open-Meteo called once when two users share lat/lng |
| Rule evaluation | Unit tests — each rule type fires at threshold, skips snoozed/confirmed users |
| RecommendationCard | RNTL — renders question text, Yes/No tappable, calls correct mutation |
| Confirm/snooze mutations | Integration tests against local Supabase — assert DB state after each action |
| `reset_user_data` RPC | Integration test — assert all rows deleted, auth user preserved |

---

## Open Items

- GDD threshold ranges per rule type — to be provided by Farai before implementation begins
