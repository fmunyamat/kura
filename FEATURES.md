# Kura — Features

## Data Model

All FK references to `auth.users` use `ON DELETE CASCADE` so account deletion removes all user data automatically.

| Table | Key columns |
|---|---|
| `user_profiles` | `user_id` (FK → auth.users CASCADE DELETE), `zip_code`, `grass_type`, `season_override`, `notifications_enabled` |
| `tasks` | `id`, `title`, `subtitle`, `why_it_matters`, `estimated_minutes`, `recurrence`, `seasons text[]`, `grass_types text[]` |
| `task_completions` | `id`, `user_id` (RLS + CASCADE DELETE), `task_id`, `completed_at`, `week_of` |
| `lawn_photos` | `id`, `user_id` (RLS + CASCADE DELETE), `storage_path`, `taken_at`, `week_number`, `season` |

**Supabase Storage:** private bucket `lawn-photos`. Objects are stored at `{user_id}/{timestamp}-week-{n}.jpg`. Access is controlled by Storage policies — there is no public URL. The account deletion Edge Function must call `storage.remove()` on the user's folder in addition to relying on the cascade FK for row cleanup.

Types generated via: `supabase gen types typescript > src/types/supabase.ts`

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
