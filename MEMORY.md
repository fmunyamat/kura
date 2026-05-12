# Kura — Session Memory
Last updated: 2026-05-11

---

## Current Session Goal
Design and build the core recommendation engine — the logic that decides what lawn care actions to recommend and when.

---

## Active Tasks (Brainstorming Phase)
- [x] Task 1: Explore project context ✅
- [ ] Task 2: Ask clarifying questions (IN PROGRESS — Q1 answered)
- [ ] Task 3: Propose 2-3 architecture approaches
- [ ] Task 4: Present and get approval on design
- [ ] Task 5: Write design doc to docs/superpowers/specs/
- [ ] Task 6: Transition to implementation plan (invoke writing-plans skill)

---

## Recommendation Engine — What We Know

### Two primary data signals:
1. **Soil Temperature** — triggers:
   - Grass coming out of dormancy
   - When to apply pre-emergent herbicide
2. **Growing Degree Days (GDD)** — triggers:
   - Fertilizing schedule
   - Lawn stress indicators
   - Other triggers (Farai will provide specific GDD ranges later)

### Fine-tuning layer (user questions):
- After a GDD/soil temp threshold is hit, ask the user a targeted in-app question about what they're actually seeing on their lawn
- Example intent: "Based on our data, your grass should be waking up soon — are you starting to see green blades growing?"
- GDD + soil temp = primary logic; user answers = fine-tuning per user
- This is NOT final copy, just the concept

### Known inputs per user (already captured in onboarding):
- `zip_code` — used to fetch weather/soil temp data
- `grass_type` — affects which thresholds apply

---

## Clarifying Questions Log

### Q1: Where does soil temp and weather data come from?
**Asked:** What API provides soil temperature and forecast data?
**Answer:** Farai had no preference (option C — open to recommendation).
**Decision:** Use **Open-Meteo** (free, no API key, provides soil temp at multiple depths + daily high/low for GDD calculation) + **Zippopotam.us** (free, no API key, converts ZIP code → lat/lng).
- Neither API requires a key
- Onboarding data chain: ZIP → zippopotam.us → lat/lng → stored in user_profiles (once only)
- Daily cron data chain: lat/lng (from DB) → Open-Meteo → soil temp + daily high/low → GDD calc → recommendation engine
- Open-Meteo soil temp depth: 0–3cm surface (relevant for grass dormancy + pre-emergent timing)
- Open-Meteo also provides historical weather → can backfill GDD for days user wasn't active
- Confirmed: US/Canada ZIP support is sufficient

### Q2: How do recommendations surface in the UI?
**Asked:** How do recommendations surface in the UI?
**Answer:** Combination of push notification + task card on the dashboard (Home tab).
**Decision:** 
- Threshold crossed → push notification sent to user
- User taps notification → app opens to dashboard
- Dashboard shows a task card for the recommended action
- Same task card UI the user already knows from the TaskList

### Q3: When does the engine check thresholds?
**Asked:** Server-side daily schedule vs client-side on app open?
**Answer:** A — server-side on a daily schedule.
**Decision:** Supabase Edge Function + pg_cron runs daily. Fetches weather for all users, calculates GDD/soil temp, sends push notification via Expo Push API when threshold crossed. User taps notification → app opens → task card on dashboard.

### Q4: How do user questions work mechanically?
**Asked:** How does the user answer fine-tuning questions, and what changes based on their answer?
**Answer:** A — Yes/No buttons directly on the task card. Yes confirms and unlocks the task. No snoozes it — engine rechecks in a few days and asks again.

---

## Architecture Decision
**Option A selected:** Separate `recommendation_events` table.
- Edge Function writes a row when threshold is crossed
- Columns: user_id, type, status (pending | confirmed | snoozed | dismissed), snoozed_until
- App fetches active rows via TanStack Query → renders as task cards on dashboard
- Yes → confirmed | No → snoozed with snoozed_until date
- Static tasks (shared/seeded) stay completely separate from dynamic recommendations (per-user)

## GDD Calculation Rules
- **Cool-season grass:** GDD accumulation restarts January 1 each year. Base temp: 32°F.
- **Warm-season grass:** GDD accumulation restarts March 1 each year. Base temp: 50°F.
- **Unknown grass type:** infer from lat at onboarding time (above 37°N = cool-season, below = warm-season)
- Formula: GDD per day = max(((Tmax + Tmin) / 2) - base_temp, 0), accumulated from season start date to today
- Open-Meteo historical data used to backfill from season start to today on each daily run

## Soil Temperature
- Fetch `soil_temperature_6cm` and `soil_temperature_18cm` from Open-Meteo
- Average the two: `soil_temp = (soil_temperature_6cm + soil_temperature_18cm) / 2`
- Rationale: averages the upper root zone for a more stable, accurate reading than surface temp
- Open-Meteo exposes both as exact variables — no interpolation needed

## Weather API Deduplication
- Before making any Open-Meteo calls, group all users by lat/lng
- Fetch weather ONCE per unique lat/lng, not once per user
- Cache today's result in a `weather_cache` table (keyed by lat + lng + fetched_date)
- Before calling Open-Meteo, check if a row already exists for that lat/lng + today's date — if yes, use it; if no, fetch and insert
- Benefits: (1) avoids duplicate API calls within a run, (2) handles retries
- `weather_cache` schema: lat, lng, fetched_date (PK), soil_temp_6cm, soil_temp_18cm, tmax, tmin, created_at
- daily_temps jsonb REMOVED — no longer needed (cumulative GDD stored per user instead)

## Cumulative GDD Storage
- `user_profiles` gets two new columns: `cumulative_gdd numeric DEFAULT 0`, `gdd_last_updated date`
- Each day Edge Function adds only TODAY's GDD increment to the stored total — no full season recalculation
- `gdd_last_updated = null` → new user, needs full backfill from season start
- `gdd_last_updated < season_start_this_year` → new season, reset to 0 then recalculate from season start
- `gdd_last_updated = today` → already processed (handles cron retries, skip)
- Otherwise → fetch today's tmax/tmin from weather_cache, add increment, update total

## Mid-Season Signup Handling
- New users (gdd_last_updated IS NULL) get a one-time backfill on their first cron run
- Edge Function makes a historical Open-Meteo call: start_date = season_start, end_date = today
- Calculates full cumulative GDD from that range, stores it in user_profiles
- From the next day forward, only today's increment is added
- Recommendations fire immediately based on where the user's GDD lands — no waiting to "catch up"

## Geocoding Strategy
- Geocoding (ZIP → lat/lng) happens ONCE at end of onboarding, NOT on every cron run
- `lat` and `lng` stored directly in `user_profiles` table
- Edge Function reads lat/lng from DB — never calls Zippopotam.us on cron runs
- lat can also be used to infer grass type when user selects "unknown" (above ~37°N = cool-season, below = warm-season)

## Unknown Grass Type Handling
- When user selects "I'm not sure" on GrassType screen, infer from lat/lng (above 37°N = cool-season, below = warm-season)
- Show the inferred grass type as a RECOMMENDATION to the user — do NOT silently save it
- UI: "Based on your location, we think you have [cool-season / warm-season] grass. Does that sound right?"
- User can confirm the recommendation, or change it right there before continuing
- After confirming, inform user: "You can change this later in Settings if you discover your grass type is different"
- User can also change grass type later in Settings
- Recommendation engine never runs against a user whose grass type is unresolved

## "I've Moved" Feature (Settings)
- User can tap "I've moved" in Settings
- Warning shown: "Moving to a new location will erase all your lawn history, photos, and progress. This cannot be undone. Are you sure?"
- If confirmed → all user data erased: user_profiles row, task_completions, recommendation_events, lawn_photos rows + Storage objects in lawn-photos bucket
- Auth account (email/session) is preserved — user does NOT need to re-register
- After deletion → onboarding restarts from the Location step
- Deletion handled by a Supabase RPC/Edge Function to ensure it's atomic and complete
- The auth.users record stays intact; only profile + lawn data is wiped

## Still Unknown / Pending
- GDD ranges for each trigger (Farai will provide)

---

## Implementation Plans
- Plan 1 (Foundation): `docs/superpowers/plans/2026-05-11-recommendation-engine-plan-1-foundation.md`
  - Tasks: install deps, env/Supabase client, DB migration, onboarding Zustand store, geocoding service, Location screen, GrassType screen, onboarding service, PhotoCapture screen
- Plan 2 (Client Side): `docs/superpowers/plans/2026-05-11-recommendation-engine-plan-2-client.md`
  - Tasks: TanStack Query setup, types/constants, recommendations service, hooks, RecommendationCard, Dashboard, Settings screen, reset_user_data RPC, push token
- Plan 3 (Edge Function): NOT YET WRITTEN — blocked on GDD threshold ranges from Farai

## Session Log (chronological)
1. User asked "where did we stop?" — no memory existed, couldn't recover previous session
2. User asked how to fix memory issue for future sessions
3. Added Session Memory rules to CLAUDE.md: read MEMORY.md at session start, log everything in real time, ask to keep/erase at end of each task
4. User described recommendation engine concept (soil temp + GDD + user questions)
5. Invoked superpowers:brainstorming skill
6. Created 6 tasks for brainstorming checklist
7. Explored project context: existing data model, ARCHITECTURE.md, folder structure
8. Q1 asked and answered → decided on Open-Meteo + Zippopotam.us
9. User asked me to update MEMORY.md in real time going forward — doing that now
