# Kura — Features

## Data Model

All FK references to `auth.users` use `ON DELETE CASCADE` so account deletion removes all user data automatically.

| Table | Key columns |
|---|---|
| `user_profiles` | `user_id` (FK → auth.users CASCADE DELETE), `zip_code`, `lawn_size`, `grass_type`, `lat`, `lng`, `cumulative_gdd`, `gdd_last_updated`, `push_token`, `season_override`, `notifications_enabled` |
| `tasks` | `id`, `title`, `subtitle`, `why_it_matters`, `estimated_minutes`, `recurrence`, `seasons text[]`, `grass_types text[]` |
| `task_completions` | `id`, `user_id` (RLS + CASCADE DELETE), `task_id`, `completed_at`, `week_of` |
| `lawn_photos` | `id`, `user_id` (RLS + CASCADE DELETE), `storage_path`, `taken_at`, `week_number`, `season` |
| `recommendation_events` | `id`, `user_id` (RLS + CASCADE DELETE), `type`, `status`, `snoozed_until`, `gdd_at_trigger`, `soil_temp_at_trigger`, `created_at`, `updated_at` |
| `weather_cache` | `lat`, `lng`, `fetched_date` (PK composite), `soil_temp_6cm`, `tmax`, `tmin` |
| `soil_temp_streaks` | `lat`, `lng` (PK composite), `streak_days`, `last_updated` |

**Supabase Storage:** private bucket `lawn-photos`. Objects are stored at `{user_id}/{timestamp}-week-{n}.jpg`. Access is controlled by Storage policies — there is no public URL. The account deletion Edge Function must call `storage.remove()` on the user's folder in addition to relying on the cascade FK for row cleanup.

Types generated via: `supabase gen types typescript > src/types/supabase.ts`

---

## Recommendation Engine

The recommendation engine decides what lawn care actions to recommend and when. It uses two primary data signals — soil temperature and cumulative Growing Degree Days (GDD) — to trigger time-sensitive recommendations. A fine-tuning layer of in-app Yes/No questions personalises each recommendation based on what the user is actually observing on their lawn.

### How it works

1. A Supabase Edge Function (`recommendation-engine`) runs daily via pg_cron
2. For each user it fetches weather data, updates their cumulative GDD, and checks rules
3. When a rule fires, it inserts a row into `recommendation_events` and sends a push notification
4. The user taps the notification → app opens → a task card appears on the Home screen
5. The card asks a plain-English question ("Are you seeing green blades?") with Yes / Not yet buttons
6. **Yes** → `status = confirmed` — task accepted
7. **Not yet** → `status = snoozed` — hidden for 5 days, Edge Function rechecks after

### GDD calculation

Growing Degree Days measure accumulated heat over a season. They reset annually and are stored per user so the daily cron only needs to add today's increment — not recalculate from scratch.

| Grass type | Base temp | Season start (annual reset) |
|---|---|---|
| Cool-season | 32°F | January 1 |
| Warm-season | 50°F | March 1 |

**Daily formula:**
```
GDD_today = max(((tmax + tmin) / 2) − base_temp, 0)
cumulative_gdd += GDD_today
```

`cumulative_gdd` and `gdd_last_updated` are stored on `user_profiles`. If `gdd_last_updated < season_start_this_year` the value is reset to 0 before the new increment is added.

**Mid-season signup:** New users (`gdd_last_updated IS NULL`) get a one-time backfill on their first cron run. The Edge Function fetches historical weather from season start to today, calculates the full cumulative GDD, and stores it. From the next day forward only today's increment is added. This means recommendations fire immediately at the correct GDD level for users who sign up part-way through the season.

### Soil temperature

Fetch `soil_temperature_6cm` from Open-Meteo. This is the closest depth to the 2-inch threshold cited by university turfgrass research for pre-emergent timing. Surface temperature (0cm) fluctuates too much with direct sunlight to be reliable.

### Weather data (Open-Meteo)

Open-Meteo is free, requires no API key, and provides soil temperature at 6cm depth alongside daily temperature max/min. All temperatures are requested in °F (`temperature_unit=fahrenheit`).

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
| `gdd_at_trigger` | Cumulative GDD when the rule fired (for debugging) |
| `soil_temp_at_trigger` | Averaged soil temp when the rule fired (for debugging) |

**RLS:** Users may SELECT and UPDATE their own rows. INSERT is restricted to the Edge Function service role.

### weather_cache table

Stores today's weather per unique lat/lng. Columns: `soil_temp_6cm`, `tmax`, `tmin`. Keyed on `(lat, lng, fetched_date)` so duplicate inserts are blocked by the primary key. No user access — service role only (RLS enabled, no policies).

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

- GDD threshold ranges per rule type — to be provided by Farai before Plan 3 (Edge Function) is implemented

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
