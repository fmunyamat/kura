# Recommendation Engine — Design Spec
Date: 2026-05-11

## Overview

The recommendation engine decides what lawn care actions to recommend and when. It uses soil temperature as the primary signal to trigger time-sensitive recommendations. A fine-tuning layer of in-app Yes/No questions personalises recommendations per user based on what they're actually observing on their lawn.

---

## Scope

This spec covers:
- Daily server-side recommendation evaluation (Supabase Edge Function + pg_cron)
- Soil temperature fetching (6cm depth) and streak tracking
- Weather API deduplication and caching
- Client-side recommendation display (task cards with Yes/No)
- Grass type inference and confirmation at onboarding
- "I've moved" data reset in Settings

---

## Architecture Overview

The system has two independent halves that communicate through the database.

### Server side (runs daily without user interaction)

A Supabase Edge Function called `recommendation-engine` runs every morning via pg_cron. It:
1. Loads all users with complete profiles, grouped by lat/lng
2. Fetches today's soil temperature from Open-Meteo once per unique location (checking `weather_cache` first)
3. Updates the `soil_temp_streaks` table for each location
4. Checks each user's soil temp and streak against the rule set
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
  soil_temp_at_trigger   numeric,        -- soil temp when this fired (for debugging)
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
  created_at      timestamptz DEFAULT now(),
  PRIMARY KEY (lat, lng, fetched_date)
);
```

> Temperatures stored in °F. Request Open-Meteo with `temperature_unit=fahrenheit` so no conversion is needed before applying soil temp thresholds.

Static tasks (shared, seeded) remain completely separate from `recommendation_events` (per-user, dynamic).

---

## Soil Temperature

Fetch `soil_temperature_6cm` from Open-Meteo. This is the closest depth to the 2-inch threshold cited by university turfgrass research for pre-emergent timing. Surface temperature (0cm) fluctuates too much with direct sunlight and air temp to be reliable for grass dormancy or pre-emergent timing.

### Thresholds (both warm-season and cool-season complete)

#### Cool-season grass

Directional column shows whether the threshold fires on the way up (spring warm-up) or the way down (fall cool-down).

| Soil temp | Direction | Recommendation type | What is happening | Recommended action |
|---|---|---|---|---|
| 40–45°F | Rising | — (internal only, no card) | Root growth begins | Too early for fertilizer; roots growing but shoots dormant |
| 50°F | Rising | `pre_emergent` | Pre-emergent window opens; grass breaking dormancy | Apply pre-emergent herbicide (standalone, without heavy nitrogen) |
| 55°F | Rising | `fertilize, water, mow` | Actively growing; crabgrass germination begins | First spring fertilizer window |
| 55–65°F | Rising/holding | `fertilize, water, mow` | Optimal growth range | Primary fertilizer window; slow-release nitrogen most effective |
| 77–80°F | Rising | `heat_stress` | Root growth stops; heat-stressed | Raise mow height, hold watering steady, stop fertilizing, stay off the lawn |
| 50–45°F | Falling | `winterizer` | Cooling toward dormancy | Apply a winterizer fertilizer |
| Below 45°F | Falling | `fertilize_stop` | Approaching dormancy | No more fertilizer until spring |
| Below 40°F | Falling | `dormant` | Fully dormant for winter | No mowing, no fertilizing, no scheduled watering |

Falling back out of `heat_stress` (77–80°F cooling back into 55–65°F) is not silent — the `fertilize, water, mow` card re-fires, same as warm-season. `winterizer`, `fertilize_stop`, and `dormant` are a one-way trip — once fired, none of them re-fire or reverse on a temperature bounce back up.

#### Cool-season card copy

Full card text for the new/detailed types above. Existing terse types (`pre_emergent`, `fertilize/water/mow`) don't need bespoke copy beyond the table's action column.

**`heat_stress` — "Your lawn is under heat stress"**
> Cool-season grass slows down and can go semi-dormant once soil gets this warm — it's built for cooler weather, so this range is genuinely stressful for it.
>
> - **Raise your mowing height to 3–4 inches.** Taller grass shades its own roots and holds onto moisture better through the heat.
> - **Keep watering on your normal schedule — about 1 inch a week.** No need to add extra, just stick with what you've been doing (unless your area has drought restrictions in place, in which case follow those).
> - **Stop fertilizing.** We'll let you know when it's time to start again.
> - **Stay off the lawn when you can.** Stressed grass bruises and thins more easily under foot traffic in this range.

**`winterizer` — "Time for your last fertilizer application"**
> Soil's cooling down and your lawn is getting ready for winter. This is the last feeding of the season, but it's an important one — it uses a different kind of fertilizer than what you've been using.
>
> - **Apply a winterizer fertilizer** (look for "winterizer" or "fall fertilizer" on the bag). It's higher in potassium and lower in nitrogen — that helps the grass store energy in its roots for winter instead of pushing new green growth right before a freeze.
> - **Water it in lightly after applying**, about a quarter inch, so it soaks down to the roots.
> - **This is the last fertilizer application until spring.** After this, hold off until we let you know it's time to start again.

**`fertilize_stop` — "No more fertilizer this season"**
> Soil's dropped below 45°F. Fertilizing now would actually hurt your lawn — it can force out tender new growth right when a hard freeze is likely, and that new growth is the first thing the cold kills. It weakens your lawn heading into winter instead of helping it.
>
> - **Don't fertilize again until spring.** We'll let you know when it's time to start.
> - **If you missed your winterizer application, skip it now** — it's too late in the season for it to help. Just wait for spring instead of trying to catch up.
> - **Keep mowing if the grass is still growing at all**, but expect that to taper off soon.

**`dormant` — "Your lawn has gone dormant for the season"**
> Soil's dropped below 40°F — your grass may have turned brown for the winter. That's completely normal, not a sign it's dying. It's just conserving energy until it warms back up in spring.
>
> - **No need to mow** unless you're clearing fallen leaves or debris.
> - **No need to fertilize** — the lawn can't use it while dormant.
> - **No need to water on a schedule.** Dormant grass needs very little moisture.

#### Warm-season grass

Directional column shows whether the threshold fires on the way up (spring warm-up) or the way down (fall cool-down) — several thresholds share a number but mean different things depending on direction.

| Soil temp | Direction | Recommendation type | What is happening | Recommended action |
|---|---|---|---|---|
| 45°F | Rising | `mower_blade_sharpen` (universal — fires for all users regardless of `grass_type`) | Warming up, mowing season approaching | Sharpen blade now; one spare per mowing month if possible, sharpened all at once |
| 50–55°F | Rising | `pre_emergent` | Pre-emergent window opens; crabgrass germination begins | Apply pre-emergent herbicide (standalone, without heavy nitrogen) |
| 65°F | Rising | `fertilize, water, mow` | Grasses fully awake | First fertilizer application (bermuda, zoysia, St. Augustine) |
| 65–90°F | Rising/holding | `fertilize, water, mow` | Peak growth | Continue warm-season feeding program |
| 91–95°F | Rising | `heat_prep` | Pre-stress period | Raise mow height to 3–4", confirm ~1"/week watering, ease off fertilizer timing |
| 95–100°F | Rising | `heat_stress` | Stress period, growth rate slows | Water deeply as normal, fertilize at half the normal rate, mow less often |
| 100°F+ | Rising | `drought` | Drought / survival mode | Stop fertilizing, mow only if needed, add a watering day if locally permitted |
| Below 70°F | Falling | `fertilize_stop` | Growth slowing toward dormancy | No more fertilizer for the season |
| 55°F and below | Falling | `dormant` | Fully dormant for winter | No mowing, no fertilizing, no scheduled watering |

Falling back out of a heat stage (e.g. 100°F+ drought cooling back into the 65–90°F range) is not silent — the `fertilize, water, mow` card re-fires to let the user know they're back in the normal feeding window.

#### Warm-season card copy

Full card text for the new/detailed types above (`recommendationContent.ts` will source from this). Existing terse types (`pre_emergent`, `fertilize/water/mow`) don't need bespoke copy beyond the table's action column.

**`mower_blade_sharpen` — "Sharpen your mower blade"**
> Soil's warming up — mowing season is on its way. Now's the time to get your blade sharp before you need it.
>
> A dull blade rips grass instead of cutting it cleanly, which leaves ragged, brown-tipped tips that are more likely to get sick or dry out.
>
> **Our tip:** if you can, pick up one extra blade for every month you'll be mowing this season, and get them all sharpened at the same time — most sharpening shops charge less per blade when you bring in several at once. Then swap in a fresh one each month, so you're always cutting with a sharp edge without a monthly trip to the shop.
>
> Only have one blade? No problem — just get that one re-sharpened once a month instead.

Yes/No: "Got it, I'll sharpen my blade" / "Remind me later" (snooze). Never asks the user how many blades they own — it's one-time guidance, not tracked data.

**`heat_prep` — "Get ahead of the heat"**
> Soil's heading into a stressful range for your lawn. A few adjustments now will help it handle the heat that's coming.
>
> - **Raise your mowing height to 3–4 inches.** Taller grass shades its own roots and holds onto moisture better.
> - **Water about 1 inch a week.** That's enough — no need to add extra just because it's getting hot.
> - **Still okay to fertilize**, but skip it if a heat wave is about to hit — fertilizing right before one can stress the grass further.

**`heat_stress` — "Your lawn is under heat stress"**
> Growth slows down in this heat, so your lawn needs less than usual right now — not more.
>
> - **Keep watering deeply, same as before** — about 1 inch a week, no change.
> - **Cut your fertilizer to half the normal amount.** Growth has slowed, so it can't use a full dose.
> - **Mow less often.** Slower growth means it won't need cutting as frequently.

**`drought` — "Drought conditions — protect what you have"**
> This heat puts your lawn in survival mode. The goal now is to protect it, not push growth.
>
> - **Stop fertilizing** until temperatures come back down.
> - **Mow only when the grass actually needs it.**
> - **Check your local watering rules.** Many cities and counties restrict watering during droughts — if yours allows an extra day, adding one can help your lawn get through this stretch.

**`fertilize_stop` — "Last call for fertilizer this season"**
> Soil's cooling back down below 70°F, and your lawn's growth is slowing for the year. Fertilizing now would push out tender new growth right before frost — and that new growth is the first thing cold weather damages, which weakens your lawn heading into winter.
>
> **Stop fertilizing now.** Your lawn doesn't need it again until things warm back up in spring.

**`dormant` — "Your lawn has gone dormant for the season"**
> Soil's dropped to 55°F and below — your grass has stopped actively growing and turned brown for the winter. That's completely normal, not a sign it's dying. It's just conserving energy until it warms back up in spring.
>
> - **No need to mow** unless you're clearing fallen leaves or debris.
> - **No need to fertilize** — the lawn can't use it while dormant.
> - **No need to water on a schedule.** Dormant grass needs very little moisture.

---

## Edge Function — Daily Run

### Step 1 — Load and group users

Query `user_profiles` for all users with `grass_type != 'unknown'`, `lat IS NOT NULL`, and `push_token IS NOT NULL`. Group into a map of `"lat,lng" → [users]`.

### Step 2 — Fetch weather per unique location

For each unique lat/lng:
1. Check `weather_cache` for a row matching today's date — if found, use it (handles cron retries and shared locations)
2. If not found, fetch today's `soil_temp_6cm` from Open-Meteo and insert into `weather_cache`
3. Upsert `soil_temp_streaks` — increment `streak_days` if `soil_temp_6cm >= 50°F`, otherwise reset to 0

### Step 3 — Check rules

For each user, check `soil_temp_6cm` and `streak_days` from `soil_temp_streaks` against the rule set. Each rule specifies:
- `type` — identifier string
- `grassTypes` — which grass types it applies to
- `condition` — function of `{ soilTemp, streakDays }` returning boolean
- `snooze_days` — how long to snooze if user answers No
- `notificationTitle` / `notificationBody` — push copy

Before firing, verify no existing row for this `user_id + type` is `pending`, `confirmed`, or `snoozed` with `snoozed_until` in the future. If the coast is clear, insert a `pending` row and send a push notification via Expo Push API.

### Step 4 — Season rollover cleanup

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
| Push notification fails (expired token) | Log, continue — recommendation row still inserted, card visible on next app open |
| Confirm/snooze mutation fails on client | Show brief error message, leave card visible for retry |
| `reset_user_data` storage deletion fails | Log for manual cleanup — DB deletion already committed, onboarding proceeds |

Cron retries are always safe: `weather_cache` PK prevents duplicate inserts, and `soil_temp_streaks` upsert is idempotent.

---

## Testing

| What | How |
|---|---|
| Weather deduplication | Unit test — assert Open-Meteo called once when two users share lat/lng |
| Streak tracking | Unit test — streak increments on warm days, resets on cold day |
| Rule evaluation | Unit tests — each rule type fires at soil temp threshold, skips snoozed/confirmed users |
| RecommendationCard | RNTL — renders question text, Yes/No tappable, calls correct mutation |
| Confirm/snooze mutations | Integration tests against local Supabase — assert DB state after each action |
| `reset_user_data` RPC | Integration test — assert all rows deleted, auth user preserved |

---

## Open Items

- ~~Soil temp threshold ranges per rule type~~ — done. Both warm-season and cool-season grass are fully confirmed start-to-finish (see Thresholds section above). Plan 3 (Edge Function) is now unblocked on this front.
- Any grass-type-specific variations within warm-season (e.g. bermuda vs. St. Augustine vs. centipede) or within cool-season (e.g. tall fescue vs. Kentucky bluegrass vs. perennial ryegrass) — currently every grass within each group is treated identically.
- Effort-tier gating (`min_effort_level`) interaction with these recommendations — do heat-stress/drought/dormancy cards apply regardless of effort tier, or only at tier 2+? Not decided yet.
