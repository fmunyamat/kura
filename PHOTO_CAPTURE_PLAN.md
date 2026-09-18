# Lawn Photo Capture — Phased Implementation Plan

Feature plan for the lawn photo capture experience. Each phase is implemented on its
own branch and manually tested on-device before the next phase begins. Check items
off as they're completed.

---

## What we're building

The last onboarding step (step 5) currently is a stub — both "take photo" and "skip"
just finish onboarding. The real feature:

- Users photograph their lawn in up to **3 categories**: front yard, back yard,
  side yard. All optional — they pick which ones to take, or skip entirely.
- **Portrait orientation only**, with clear UI messaging that photos can only be
  taken upright.
- After each capture, a **preview** asks "Use photo" or "Retake".
- Confirmed photos always upload to **Supabase** (private `lawn-photos` bucket +
  `lawn_photos` table) and always copy to a private app folder. Saving a copy to the
  **device photo library** is opt-in, not automatic: the first time a user ever
  confirms a photo, an in-app dialog explains that photos stay in Kura for the
  current calendar year only and asks whether they'd also like a copy saved to their
  phone. Their answer is stored in `user_profiles.save_photos_to_device` and reused
  silently after that — changeable anytime from a new **Settings → Photos** toggle.
- The **front yard photo becomes the background** of all tab screens (Home, Settings,
  Gallery). No front photo → a random one of their captures. Skipped entirely → the
  current default (`assets/images/sprinkler.png`, blur 7).
- A new **Gallery tab** shows the year's photos and lets users capture more photos
  year-round with the same flow.
- **Calendar-year retention**: on January 1, all previous-year photos are deleted
  from the app and Supabase. Device copies remain on the phone.
- Each photo gets a **share sheet** with social platform options (Instagram,
  Facebook, X, TikTok) — UI stub only, nothing wired yet.

## Verified starting state

- Supabase project `pdpqvojftsusqvgzccax`: `lawn_photos` table exists (RLS on) but
  has **no location column** — Phase 3 adds it. Private `lawn-photos` bucket exists.
- No camera packages installed — `expo-camera`, `expo-media-library`,
  `expo-file-system` all missing. `expo-image` is installed (rendering only).
- `app.json` already sets `"orientation": "portrait"`, so an in-app camera is
  portrait-locked for free — the requirement reduces to UI copy.
- The backdrop (`sprinkler.png`, blur 7) is `require`d in 4 separate files:
  `src/features/home/constants/backdrop.ts` (HomeScreen + MergedHeaderBar), a local
  copy in SettingsScreen, OnboardingScreenShell, and SprinklerSystem.
- Tabs are Today + Settings only, drawn by the custom `FloatingTabBar`
  (`src/shared/components/FloatingTabBar`).
- **FEATURES.md has already been updated** (ahead of Phase 3, at the user's request)
  with the opt-in device-save preference model: the "Device save preference"
  subsection under Lawn Progress Photos documents the first-photo prompt, the
  `save_photos_to_device` column (nullable — `NULL` = not yet asked), the
  `savePhotosToDeviceSchema` Zod schema, and the Settings toggle. The Data Model
  table also already lists the new column. No further FEATURES.md edit is needed for
  this piece in Phase 3 — only the code needs to be built to match.

## Global decisions

- **Feature folder**: `src/features/progress-photos/` (the name ARCHITECTURE.md and
  FEATURES.md already use). Service files use dot-naming
  (`progressPhotos.service.ts`).
- **Camera**: `expo-camera` (in-app viewfinder), NOT `expo-image-picker`. We need
  portrait messaging and our own preview/retake step — the system camera would show
  its own confusing second preview. Always `takePictureAsync({ exif: false })` so
  GPS/EXIF is stripped from every photo (keeps the MASWE-0109 invariant).
- **Background persistence**: the canonical backdrop is a file copy at
  `Paths.document/lawn-photos/backdrop.jpg` in the app documents directory. Not a
  signed URL (those expire in 1 hour), not AsyncStorage, and it survives the user
  deleting the photo from their device library. If the file is missing at launch,
  fall back to the sprinkler default. Confirmed originals are also copied to
  `Paths.document/lawn-photos/originals/`.
- **State**: `useLawnPhotoStore` (Zustand, transient capture-session state in
  `features/progress-photos/stores/`) + `useBackdropStore`
  (`src/shared/stores/backdropStore.ts` — lives in `shared/` so Home/Settings/
  Gallery can read it without importing from `features/`; dependencies keep
  pointing inward).
- **Server state**: plain hooks over the service layer (useState +
  `useFocusEffect`), no TanStack Query install.
- **Retention mechanism**: client-side purge on app launch — query rows with
  `taken_at` before Jan 1 of the current year → `storage.remove()` (allowed by the
  existing `own_photos_delete` policy) → delete rows → delete local originals →
  reset the backdrop if it was purged. Plain pg_cron SQL can't delete storage
  objects; a scheduled Edge Function is the documented future upgrade path.
- **Upload bytes**: `new File(localUri).bytes()` → `Uint8Array` →
  `storage.upload(path, bytes, { contentType: 'image/jpeg' })`. Never
  `fetch(uri).blob()` — the classic React Native 0-byte-upload trap.
- **Storage path**: `{user_id}/{timestamp}-{location}-week-{n}.jpg` — the first
  folder segment must equal `auth.uid()` or the storage RLS policies reject it.
- **Device-save preference**: `user_profiles.save_photos_to_device` (nullable
  boolean — `NULL` = never asked). Supabase upload is unconditional; the device
  library save only happens when this is `true`, and the `MEDIA_LIBRARY` write
  permission is only ever requested at that moment (never bundled with the camera
  permission, never requested up front). The first-ever "Use photo" tap shows an
  in-app explanation dialog before the OS permission dialog, writes the user's
  choice to this column, and every later photo reuses it silently. See FEATURES.md
  → Lawn Progress Photos → "Device save preference" for the full spec.
- Each phase gets its own feature branch per CLAUDE.md git rules.

---

## Phase 0 — Plan doc ✅

- [x] Create this file (`PHOTO_CAPTURE_PLAN.md`) at the project root.

---

## Phase 1 — Packages + permissions config

**Goal:** native deps installed and dev client rebuilt; app boots unchanged.

- [ ] `npx expo install expo-camera expo-media-library expo-file-system`
- [ ] Add to `app.json` plugins:
  - [ ] `["expo-camera", { "cameraPermission": "Kura uses your camera to take photos of your lawn so you can watch it improve." }]`
  - [ ] `["expo-media-library", { "savePhotosPermission": "Kura saves your lawn photos to your photo library so you always keep a copy.", "isAccessMediaLocationEnabled": false }]`
        — save-only permission; we never *read* the library.
- [ ] Regenerate native projects (`npx expo prebuild`) and rebuild the dev client.

**Risk:** committed `ios/`/`android/` dirs mean config plugins only take effect
after regeneration — this is the most time-consuming phase.

**Test:**
- [ ] App builds and runs exactly as before.
- [ ] `Info.plist` contains both permission usage strings.

---

## Phase 2 — Onboarding capture UI (local state only, no saving)

**Goal:** full picker → camera → preview → retake flow on step 5; photos held in
memory only; skip unchanged.

Create:
- [ ] `src/features/progress-photos/types.ts` — `LawnPhotoLocation = 'front' | 'back' | 'side'` + display metadata (label, icon, description).
- [ ] `src/features/progress-photos/stores/lawnPhotoStore.ts` — `photosByLocation`, `setPhotoForLocation`, `reset` (INITIAL + reset pattern like `onboardingStore`).
- [ ] `src/features/progress-photos/screens/PhotoSessionScreen.tsx` — reads a Zod-validated `location` route param; owns `'permission' | 'camera' | 'preview'` state; composition only, <120 lines.
- [ ] `src/features/progress-photos/components/CameraPermissionGate/` — plain-English rationale shown BEFORE the system dialog (MASWE-0117); denied state offers `Linking.openSettings()`.
- [ ] `src/features/progress-photos/components/LawnCameraView/` — full-bleed `CameraView`, portrait notice pill ("Portrait only — hold your phone upright"), shutter button, close X; `takePictureAsync({ quality: 0.8, exif: false })`.
- [ ] `src/features/progress-photos/components/PhotoPreviewPanel/` — full-screen preview + "Use photo" / "Retake" CTAs.
- [ ] `src/features/progress-photos/components/PhotoLocationList/` — the 3 location rows; captured rows show a thumbnail + check.
- [ ] `app/(app)/onboarding/photo-session.tsx` — thin route wrapper (must live under `/onboarding` so the routing guard doesn't bounce pre-profile users).

Modify:
- [ ] `src/features/onboarding/screens/PhotoCapture.tsx` — replace the single CameraWell with `PhotoLocationList`; subtext mentions portrait-only; CTA reads "Continue" when ≥1 photo captured, else "Skip for now →"; both still call the existing `handleComplete`. Row tap → `router.push('/onboarding/photo-session?location=front')`.

**Test (physical device — the simulator has no camera):**
- [ ] Each location round-trips: rationale → system permission → live camera → capture → preview → Retake reopens camera → Use photo returns to step 5 with a thumbnail.
- [ ] Denying camera permission shows the recovery UI with a path to Settings.
- [ ] Skip still completes onboarding as before.

---

## Phase 3 — Persist: Supabase, opt-in device save, Settings toggle (+ migration)

**Goal:** "Use photo" always uploads to Supabase and copies to the app documents
dir. The very first confirmed photo also asks the user whether to save a copy to
their device; their answer is stored and reused silently afterward, and is
editable later from Settings.

Backend (Supabase MCP migration on `pdpqvojftsusqvgzccax`):
- [ ] Add the location column:
  ```sql
  ALTER TABLE public.lawn_photos
    ADD COLUMN location text NOT NULL DEFAULT 'front'
    CONSTRAINT lawn_photos_location_check CHECK (location IN ('front','back','side'));
  ```
- [ ] Add the device-save preference column:
  ```sql
  -- NULL until the user answers the first-photo prompt ("not yet asked").
  -- true/false once they've chosen; reused silently for every later photo.
  ALTER TABLE public.user_profiles
    ADD COLUMN save_photos_to_device boolean;
  ```
- [ ] Verify `own_photos_select/insert/delete` storage policies exist on the
      `lawn-photos` bucket (query `pg_policies`); create any missing ones.
- [ ] Run database advisors after the migration.

Create:
- [ ] `src/features/progress-photos/schemas.ts` — Zod: `lawnPhotoLocationSchema`, `weekNumberSchema`, `storagePathSchema`, `savePhotosToDeviceSchema` (`z.boolean()`).
- [ ] `src/features/progress-photos/services/progressPhotos.service.ts` — `uploadLawnPhoto(localUri, location)` (Zod parse → auth check → bytes upload → insert row with location/week_number/season; remove the storage object if the row insert fails), `getSignedPhotoUrl(storagePath)` (3600s), `deleteLawnPhotos(paths)`. Generic errors to the UI, details to Sentry.
- [ ] `src/features/progress-photos/services/localPhotos.service.ts` — `saveToDeviceLibrary(uri)` (write-only MediaLibrary permission; only ever called when the preference is `true`), `copyToAppStorage(uri, location)`, `deleteLocalOriginalsBefore(date)`.
- [ ] `src/features/progress-photos/services/photoPreference.service.ts` — `getSavePhotosPreference()` (reads `user_profiles.save_photos_to_device`), `setSavePhotosPreference(value: boolean)` (Zod parse → update).
- [ ] `src/features/progress-photos/components/DeviceSavePromptModal/` — the one-time explanation dialog: "Photos stay in Kura for the current calendar year, then they're removed. Want us to also save a copy to your phone?" with "Yes, save to my phone" / "No, just keep it in Kura" — shown before the OS permission dialog, only when the preference is still `NULL`.
- [ ] `src/features/progress-photos/hooks/useConfirmLawnPhoto.ts` — orchestrates: check preference → if `NULL`, show `DeviceSavePromptModal` and persist the choice first → copy to app storage → upload to Supabase (always) → save to device library only if preference is `true` (denial of the OS dialog does not block the upload) → exposes `isSaving` / `hasError`.
- [ ] `src/features/settings/hooks/useUpdateSavePhotosPreference.ts` — mutation wrapping `setSavePhotosPreference`, following the same pattern as the existing grass-type/effort-level settings updates.
- [ ] `src/shared/utils/date.ts` (`getIsoWeekNumber`) and `src/shared/utils/season.ts` (`getCurrentSeason`) — documented in ARCHITECTURE.md but don't exist yet.

Modify:
- [ ] `PhotoSessionScreen.tsx` — wire `useConfirmLawnPhoto`; loading state on "Use photo"; generic error + retry.
- [ ] `SettingsScreen.tsx` — add a **Photos** section with a toggle row ("Also save photos to my phone"), same `RowCard` pattern as Account/Data, bound to `useUpdateSavePhotosPreference`. Reflects `NULL` as off until the user has captured a first photo.

**Test:**
- [ ] First-ever photo confirm shows the explanation dialog before anything saves.
- [ ] Choosing "Yes" → OS permission prompt → photo appears in the device Photos app; choosing "No" → no permission prompt at all.
- [ ] Either way, the Supabase dashboard shows the storage object under `{uid}/` and a `lawn_photos` row with `location='front'`.
- [ ] Second and later photos skip the dialog entirely and follow the stored preference.
- [ ] Denying the OS photo-library permission after choosing "Yes" → the Supabase upload still succeeds.
- [ ] Settings → Photos toggle flips the preference and is reflected on the next capture.
- [ ] Airplane mode → generic error, retry works, no orphan rows or objects.
- [ ] Unit tests: Zod rejection, upload path shape, orphan cleanup on insert failure, preference read/write (Supabase mocked at the service boundary).

---

## Phase 4 — Dynamic background across tabs

**Goal:** front-yard photo (else a random capture, else the sprinkler default)
backs Home + Settings, surviving app restarts.

Create:
- [ ] `src/shared/constants/backdrop.ts` — `DEFAULT_BACKDROP`, `BACKDROP_BLUR_RADIUS = 7`, `BACKDROP_FILE_PATH` / `LAWN_PHOTOS_DIR` path constants.
- [ ] `src/shared/stores/backdropStore.ts` — `backdropSource` (init default), `setBackdropSource`, `resetToDefault`.
- [ ] `src/shared/hooks/useHydrateBackdrop.ts` — on mount, check `backdrop.jpg` exists → set the store; cache-bust the uri with the file's modification time so a replaced backdrop isn't served stale by the image cache.
- [ ] `src/features/progress-photos/services/backdrop.service.ts` — `applyBackdropFromSession(photosByLocation)` (front → copy to `backdrop.jpg`; no front but ≥1 → random pick; none → no-op) and `setBackdropFromPhoto(uri)` for later gallery captures (latest front-yard photo wins).

Modify:
- [ ] `PhotoCapture.tsx` `handleComplete` — call `applyBackdropFromSession` (non-fatal on failure), then reset `lawnPhotoStore`.
- [ ] `app/(app)/(tabs)/_layout.tsx` — mount `useHydrateBackdrop()`.
- [ ] `HomeScreen.tsx`, `MergedHeaderBar.tsx`, `SettingsScreen.tsx` — read source/blur from `useBackdropStore`; delete `src/features/home/constants/backdrop.ts` and Settings' local copies. Keep the `PhotoWash` gradient untouched — it's what keeps text readable over arbitrary user photos. `OnboardingScreenShell` keeps its static sprinkler image.

**Test:**
- [ ] Onboard with a front photo → Home and Settings show it blurred.
- [ ] `MergedHeaderBar`'s clipped slice still aligns pixel-perfect while scrolling.
- [ ] Force-quit + relaunch → the background persists.
- [ ] Onboard with only a back-yard photo → that photo appears.
- [ ] Skip all photos → sprinkler default.
- [ ] Text stays readable in both light and dark mode over a real photo.

---

## Phase 5 — Gallery tab

**Goal:** third tab with a photo grid and a year-round capture entry point.

Create:
- [ ] `app/(app)/(tabs)/gallery.tsx` → `src/features/progress-photos/screens/GalleryScreen.tsx` — backdrop + PhotoWash + header matching Settings; grid; capture button; floating-tab-bar clearance padding.
- [ ] `src/features/progress-photos/hooks/useLawnPhotos.ts` — fetch current-year rows on `useFocusEffect`; display uri prefers the local original file if it exists, else a signed URL.
- [ ] `src/features/progress-photos/components/PhotoGrid/` + `PhotoThumbnail/` — FlatList `numColumns={2}`, `expo-image` with `recyclingKey={storage_path}`, date + location label per cell, location filter chips (All / Front / Back / Side), empty state.
- [ ] `src/features/progress-photos/components/LocationPickerSheet/` — front/back/side modal shown before a gallery capture.
- [ ] `app/(app)/photo-session.tsx` — second thin wrapper over the same `PhotoSessionScreen` (modal presentation) for post-onboarding captures; a gallery front-yard capture also calls `setBackdropFromPhoto`.

Modify:
- [ ] `app/(app)/(tabs)/_layout.tsx` — add `<Tabs.Screen name="gallery" options={{ title: 'Gallery' }} />` between index and settings.
- [ ] `FloatingTabBar.tsx` — add `gallery: 'images-outline'` to the ICONS map.

**Test:**
- [ ] Third tab renders with icon, label, and active state.
- [ ] Onboarding photos appear in the grid.
- [ ] Gallery capture (all 3 categories, same portrait/preview flow) → grid + device Photos + Supabase.
- [ ] A gallery front-yard capture updates the tab backgrounds.
- [ ] Filters and empty state work.
- [ ] Reinstall simulation (photos only in Supabase) still renders via signed URLs.

---

## Phase 6 — Share sheet stub + Jan-1 retention

Create:
- [ ] `src/features/progress-photos/components/PhotoShareSheet/` — modal opened from a thumbnail: photo preview + platform rows (Instagram, Facebook, X, TikTok, "More…"); every `handleShareTo*` shows a "Sharing is coming soon" notice — nothing wired, no expo-sharing yet.
- [ ] `src/features/progress-photos/services/retention.service.ts` — `purgePreviousYearPhotos()`: rows with `taken_at` < Jan 1 of the current year → `storage.remove(paths)` → delete rows → delete local originals → reset the backdrop if it was purged. Idempotent.
- [ ] `src/features/progress-photos/hooks/usePhotoRetention.ts` — runs the purge once per app session from the tabs layout; failures log to Sentry and retry next launch; never blocks the UI.

Modify:
- [ ] `PhotoThumbnail` / `GalleryScreen` — open the share sheet.
- [ ] `app/(app)/(tabs)/_layout.tsx` — mount `usePhotoRetention`.

**Test:**
- [ ] Share sheet opens and dismisses; every platform row shows the stub notice.
- [ ] Seed a row with `taken_at = '2025-06-01'` + a matching storage object via SQL → relaunch → row, object, and local copy are gone; current-year photos untouched.
- [ ] If the backdrop photo was purged, tabs revert to the sprinkler default.
- [ ] Unit test: year-boundary query in `retention.service.ts`.

---

## Phase 7 — Documentation sweep

- [x] **FEATURES.md** — device-save preference model already documented (done ahead
      of schedule, see Verified starting state above). Still remaining: rewrite the
      rest of Lawn Progress Photos — 3 locations, portrait-only, swap the
      `expo-image-picker` code sample for `expo-camera`, `location` column + new
      path convention, gallery tab, client-side retention + Edge Function upgrade
      note, share stub.
- [ ] **ARCHITECTURE.md** — progress-photos folder contents, tab list Home | Gallery | Settings, camera row in Platform Handling, shared backdrop store/hook.
- [ ] **CLAUDE.md** stack table — `expo-camera` + `expo-media-library`.

**Test:**
- [ ] Grep docs for `expo-image-picker` — zero stale hits (the `MEDIA_LIBRARY`
      wording is already resolved).

---

## Cross-cutting risks

- **Phase 1** native rebuild is the schedule risk (committed `ios/`/`android/` dirs).
- **Phase 3**: the RN blob 0-byte-upload trap (always use `File.bytes()`); the
  storage path's first folder segment must equal `auth.uid()` or RLS rejects it.
- **Phase 4**: `MergedHeaderBar` misalignment if it and HomeScreen ever read
  different sources — both must read the same store value.
- Camera testing requires a **physical device** from Phase 2 onward.
- Run `tsc --noEmit` at the end of every phase.
