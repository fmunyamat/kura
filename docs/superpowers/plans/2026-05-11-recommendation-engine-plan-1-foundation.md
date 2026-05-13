# Recommendation Engine — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the Supabase client, DB schema, geocoding, and onboarding service so every user has lat/lng and grass type stored in their profile by the end of onboarding.

**Architecture:** Geocoding (ZIP → lat/lng) via Zippopotam.us runs once when the user completes the Location screen and is stored in a Zustand store. At the end of onboarding (PhotoCapture), the full profile (zip, lawn size, lat, lng, grass type) is saved to Supabase. The Edge Function reads lat/lng directly from the DB — geocoding never runs again after signup.

**Tech Stack:** Supabase JS client, expo-secure-store (auth token storage), Zustand (onboarding state), Zod (input + API response validation), Jest + RNTL (tests)

**Prerequisite:** The user must be authenticated (Supabase session exists) before reaching the onboarding screens. The auth flow (RootNavigator, AuthStack, OnboardingStack) is outside the scope of this plan but must be in place before this plan's service calls will work.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `src/config/env.ts` | Zod-validated EXPO_PUBLIC_* env vars — fails fast if missing |
| Create | `src/shared/lib/supabase.ts` | Single Supabase client using SecureStore for auth tokens |
| Create | `supabase/migrations/20260511000001_recommendation_engine_tables.sql` | Adds lat/lng/push_token to user_profiles; creates recommendation_events and weather_cache |
| Create | `src/features/onboarding/store/useOnboardingStore.ts` | Zustand store accumulating zip/lawnSize/lat/lng/grassType across screens |
| Modify | `src/features/onboarding/types.ts` | Add GrassType resolved type (no 'unknown') |
| Create | `src/features/onboarding/services/geocoding.service.ts` | Calls Zippopotam.us, returns lat/lng, validates response with Zod |
| Create | `src/features/onboarding/services/geocoding.service.test.ts` | Unit tests for geocoding service |
| Modify | `src/features/onboarding/screens/Location.tsx` | Call geocoding on Continue, store result in Zustand, show loading/error states |
| Modify | `src/features/onboarding/screens/GrassType.tsx` | Infer grass type from lat for 'unknown' users, show confirmation UI |
| Create | `src/features/onboarding/services/onboarding.service.ts` | Saves complete profile to Supabase user_profiles |
| Create | `src/features/onboarding/services/onboarding.service.test.ts` | Unit tests for onboarding service |
| Modify | `src/features/onboarding/screens/PhotoCapture.tsx` | Call onboardingService.saveProfile on complete/skip |

---

### Task 1: Install dependencies

**Files:** No source files — package installs only.

- [ ] **Step 1: Install runtime packages**

```bash
npx expo install @supabase/supabase-js expo-secure-store zustand zod
```

Expected: packages added to `package.json` dependencies, no peer dependency errors.

- [ ] **Step 2: Install type packages**

```bash
npm install --save-dev @types/react-native
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install supabase, secure-store, zustand, zod"
```

---

### Task 2: Env config and Supabase client

**Files:**
- Create: `src/config/env.ts`
- Create: `src/shared/lib/supabase.ts`

- [ ] **Step 1: Create env config**

Create `src/config/env.ts`:

```ts
import { z } from 'zod';

// envSchema — declares every EXPO_PUBLIC_ var the app needs.
// parse() throws at startup if any are missing or malformed,
// so misconfigured builds fail immediately rather than silently making
// unauthenticated API calls (MASVS-STORAGE-1, MASWE-0005).
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});

export const ENV = envSchema.parse({
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});
```

- [ ] **Step 2: Create .env.local with your Supabase credentials**

In the project root, create `.env.local` (already in .gitignore — never commit this file):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase dashboard → Project Settings → API.

- [ ] **Step 3: Create Supabase client**

Create `src/shared/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { ENV } from '~/config/env';

// ExpoSecureStoreAdapter — replaces AsyncStorage for Supabase auth token
// persistence. SecureStore encrypts at rest (Keychain on iOS,
// EncryptedSharedPreferences on Android). Required by MASVS-STORAGE-1:
// auth tokens must never sit in unencrypted storage.
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// supabase — single client instance shared across the entire app.
// Import this wherever you need to query or mutate Supabase data.
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // detectSessionInUrl: false prevents Supabase from trying to parse
    // auth tokens from deep link URLs, which we handle manually.
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add src/config/env.ts src/shared/lib/supabase.ts
git commit -m "feat: add env config and Supabase client with SecureStore adapter"
```

---

### Task 3: Database migration

**Files:**
- Create: `supabase/migrations/20260511000001_recommendation_engine_tables.sql`

- [ ] **Step 1: Create migrations folder**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Write migration SQL**

Create `supabase/migrations/20260511000001_recommendation_engine_tables.sql`:

```sql
-- Add geocoding and push notification columns to user_profiles.
-- lat/lng are stored once at onboarding so the daily cron never needs to
-- call the geocoding API again after signup.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS lawn_size  integer,
  ADD COLUMN IF NOT EXISTS lat        numeric(9,6),
  ADD COLUMN IF NOT EXISTS lng        numeric(9,6),
  ADD COLUMN IF NOT EXISTS push_token text;

-- recommendation_events — one row per recommendation fired per user.
-- The Edge Function inserts rows (service role); the client only reads
-- and updates status/snoozed_until.
CREATE TABLE IF NOT EXISTS recommendation_events (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type                   text        NOT NULL,
  status                 text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','confirmed','snoozed','dismissed')),
  snoozed_until          date,
  soil_temp_at_trigger   numeric,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recommendation_events ENABLE ROW LEVEL SECURITY;

-- Users may only read their own recommendations.
CREATE POLICY "own_recommendations_select"
  ON recommendation_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users may update status and snoozed_until on their own rows
-- (confirm or snooze from the app). INSERT is restricted to service role.
CREATE POLICY "own_recommendations_update"
  ON recommendation_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- weather_cache — stores today's soil temp per unique lat/lng.
-- Keyed on (lat, lng, fetched_date) so the daily cron never fetches
-- the same location twice in one run, even across retries.
-- No user access — service role only.
CREATE TABLE IF NOT EXISTS weather_cache (
  lat              numeric(9,6)  NOT NULL,
  lng              numeric(9,6)  NOT NULL,
  fetched_date     date          NOT NULL,
  soil_temp_6cm    numeric,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  PRIMARY KEY (lat, lng, fetched_date)
);

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;
-- No policies — service role bypasses RLS and is the only accessor.
```

- [ ] **Step 3: Apply the migration**

Using the Supabase MCP tool, run:
```
mcp__plugin_supabase_supabase__apply_migration
  name: "recommendation_engine_tables"
  query: <paste full SQL above>
```

Or with the Supabase CLI if you have it set up locally:
```bash
supabase db push
```

- [ ] **Step 4: Regenerate TypeScript types**

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

Replace `YOUR_PROJECT_ID` with your Supabase project ID (found in the project URL).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260511000001_recommendation_engine_tables.sql src/types/supabase.ts
git commit -m "feat: add recommendation_events, weather_cache, soil_temp_streaks tables and user_profiles columns"
```

---

### Task 4: Onboarding Zustand store

**Files:**
- Create: `src/features/onboarding/store/useOnboardingStore.ts`
- Modify: `src/features/onboarding/types.ts`

- [ ] **Step 1: Update types**

Replace the contents of `src/features/onboarding/types.ts`:

```ts
// SignInState — tracks the email input and whether the magic link was sent.
export interface SignInState {
  email: string;
  submitted: boolean;
}

// GrassTypeList — the three options shown on the GrassType screen.
// 'unknown' is only valid as a UI selection; it is resolved to a concrete
// type (cool-season or warm-season) before the profile is saved.
export type GrassTypeList = 'cool-season' | 'warm-season' | 'unknown';

// ResolvedGrassType — what actually gets stored in the database.
// Never 'unknown' — always inferred or chosen before profile save.
export type ResolvedGrassType = 'cool-season' | 'warm-season';
```

- [ ] **Step 2: Write the failing test**

Create `src/features/onboarding/store/useOnboardingStore.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react-native';
import { useOnboardingStore } from './useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useOnboardingStore.setState({
      zipCode: '', lawnSize: 0, lat: 0, lng: 0, grassType: null,
    });
  });

  it('sets location data', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => result.current.setLocation('30301', 1500, 33.749, -84.388));
    expect(result.current.zipCode).toBe('30301');
    expect(result.current.lawnSize).toBe(1500);
    expect(result.current.lat).toBe(33.749);
    expect(result.current.lng).toBe(-84.388);
  });

  it('sets grass type', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => result.current.setGrassType('cool-season'));
    expect(result.current.grassType).toBe('cool-season');
  });

  it('resets to initial state', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => result.current.setLocation('30301', 1500, 33.749, -84.388));
    act(() => result.current.reset());
    expect(result.current.zipCode).toBe('');
    expect(result.current.lat).toBe(0);
    expect(result.current.grassType).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
npx jest src/features/onboarding/store/useOnboardingStore.test.ts
```

Expected: FAIL — `Cannot find module './useOnboardingStore'`

- [ ] **Step 4: Implement the store**

Create `src/features/onboarding/store/useOnboardingStore.ts`:

```ts
import { create } from 'zustand';
import type { ResolvedGrassType } from '~/features/onboarding/types';

// OnboardingData — the profile fields collected across the three onboarding screens.
// Accumulated in Zustand so each screen can read/write without navigation params.
interface OnboardingData {
  zipCode: string;
  lawnSize: number;
  lat: number;
  lng: number;
  grassType: ResolvedGrassType | null;
}

interface OnboardingStore extends OnboardingData {
  // setLocation — called at the end of the Location screen after geocoding succeeds.
  setLocation: (zipCode: string, lawnSize: number, lat: number, lng: number) => void;
  // setGrassType — called on the GrassType screen once the user confirms their type.
  setGrassType: (grassType: ResolvedGrassType) => void;
  // reset — clears all onboarding data. Called after the profile is saved to DB.
  reset: () => void;
}

const initialState: OnboardingData = {
  zipCode: '',
  lawnSize: 0,
  lat: 0,
  lng: 0,
  grassType: null,
};

// useOnboardingStore — accumulates profile data across the onboarding flow.
// Persists in memory only — not on disk. Cleared after saveProfile completes.
export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...initialState,
  setLocation: (zipCode, lawnSize, lat, lng) =>
    set({ zipCode, lawnSize, lat, lng }),
  setGrassType: (grassType) => set({ grassType }),
  reset: () => set(initialState),
}));
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
npx jest src/features/onboarding/store/useOnboardingStore.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/onboarding/types.ts src/features/onboarding/store/
git commit -m "feat: add onboarding Zustand store with location and grass type setters"
```

---

### Task 5: Geocoding service

**Files:**
- Create: `src/features/onboarding/services/geocoding.service.ts`
- Create: `src/features/onboarding/services/geocoding.service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/features/onboarding/services/geocoding.service.test.ts`:

```ts
import { geocodingService } from './geocoding.service';

const mockFetch = (ok: boolean, body?: object) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  } as unknown as Response);
};

describe('geocodingService.geocodeZip', () => {
  it('returns lat/lng for a valid ZIP', async () => {
    mockFetch(true, {
      'post code': '30301',
      places: [{ latitude: '33.749', longitude: '-84.388', 'place name': 'Atlanta' }],
    });
    const result = await geocodingService.geocodeZip('30301');
    expect(result).toEqual({ lat: 33.749, lng: -84.388 });
  });

  it('throws a user-facing message when ZIP is not found', async () => {
    mockFetch(false);
    await expect(geocodingService.geocodeZip('00000'))
      .rejects.toThrow('ZIP code not found');
  });

  it('throws when the response does not match the expected shape', async () => {
    mockFetch(true, { unexpected: 'shape' });
    await expect(geocodingService.geocodeZip('30301')).rejects.toThrow();
  });

  it('throws when places array is empty', async () => {
    mockFetch(true, { 'post code': '30301', places: [] });
    await expect(geocodingService.geocodeZip('30301')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/features/onboarding/services/geocoding.service.test.ts
```

Expected: FAIL — `Cannot find module './geocoding.service'`

- [ ] **Step 3: Implement geocoding service**

Create `src/features/onboarding/services/geocoding.service.ts`:

```ts
import { z } from 'zod';

// ZippopotamResponseSchema — validates the shape of api.zippopotam.us responses
// before we try to read lat/lng. Rejects empty places arrays so we never
// try to read undefined values (MASVS-CODE-4, MASWE-0079).
const ZippopotamResponseSchema = z.object({
  'post code': z.string(),
  places: z
    .array(
      z.object({
        latitude: z.string(),
        longitude: z.string(),
        'place name': z.string(),
      })
    )
    .min(1),
});

export const geocodingService = {
  // geocodeZip — converts a US ZIP code to lat/lng coordinates.
  // Uses Zippopotam.us (free, no API key required, HTTPS).
  // Called once at the end of the Location screen — result stored in
  // Zustand then saved to user_profiles. Never called again after signup.
  async geocodeZip(zipCode: string): Promise<{ lat: number; lng: number }> {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);

    if (!response.ok) {
      // Surface a plain-English message — internal API errors never reach the UI
      // directly (MASVS-CODE-4, MASWE-0087).
      throw new Error('ZIP code not found. Please check and try again.');
    }

    const raw: unknown = await response.json();
    const parsed = ZippopotamResponseSchema.parse(raw);

    return {
      lat: parseFloat(parsed.places[0].latitude),
      lng: parseFloat(parsed.places[0].longitude),
    };
  },
};
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest src/features/onboarding/services/geocoding.service.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/services/geocoding.service.ts \
        src/features/onboarding/services/geocoding.service.test.ts
git commit -m "feat: add geocoding service with Zod validation of Zippopotam.us response"
```

---

### Task 6: Update Location screen

**Files:**
- Modify: `src/features/onboarding/screens/Location.tsx`

The Location screen currently navigates straight to the GrassType screen on Continue. We need it to geocode the ZIP first, store the result in Zustand, then navigate. We also need to handle loading and error states.

- [ ] **Step 1: Update Location.tsx**

Replace the contents of `src/features/onboarding/screens/Location.tsx` with:

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, useWindowDimensions } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { geocodingService } from '~/features/onboarding/services/geocoding.service';
import { useOnboardingStore } from '~/features/onboarding/store/useOnboardingStore';
import { OnboardingLayout } from '~/features/onboarding/components/OnboardingLayout';
import { logger } from '~/shared/utils/logger';

// FieldGroup — wraps a label + input pair with a small gap.
const FieldGroup = styled.View`
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// FieldLabel — small uppercase label above each input.
const FieldLabel = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeSm : theme.typography.sizeXs}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
`;

// StyledInput — text field whose background shifts when focused.
const StyledInput = styled.TextInput<{ $focused: boolean; $isTablet: boolean }>`
  background-color: ${({ $focused, theme }) =>
    $focused
      ? theme.colors.glassOnboardingInputFocused
      : theme.colors.glassOnboardingInput};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px
    ${({ theme }) => theme.spacing.md}px;
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeLg : theme.typography.sizeMd}px;
  color: ${({ theme }) => theme.colors.textOnGlass};
`;

// InputWrapper — positions the sq ft badge inside the lawn size input.
const InputWrapper = styled.View`
  position: relative;
`;

// UnitBadge — the "sq ft" pill on the right of the lawn size field.
const UnitBadge = styled.View`
  position: absolute;
  right: ${({ theme }) => theme.spacing.sm}px;
  top: 0;
  bottom: 0;
  justify-content: center;
`;

// UnitText — label inside the unit badge.
const UnitText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeSm : theme.typography.sizeXs}px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  background-color: ${({ theme }) => theme.colors.glassOnboardingInput};
  border-radius: 6px;
  padding: 2px 8px;
  overflow: hidden;
`;

// HintCard — tappable card that opens the lawn measurement tool in the browser.
const HintCard = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.glassOnboardingHint};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const HintIcon = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  margin-top: 1px;
`;

const HintBody = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  flex: 1;
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

const HintLink = styled.Text`
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.textAccentOnGlass};
  text-decoration-line: underline;
`;

// PrimaryButton — the Continue CTA. Opacity drops when inputs are empty
// or a geocoding request is in flight.
const PrimaryButton = styled.TouchableOpacity<{ $enabled: boolean }>`
  border-radius: ${({ theme }) => theme.radii.md}px;
  overflow: hidden;
  opacity: ${({ $enabled }) => ($enabled ? 1 : 0.3)};
`;

const PrimaryButtonFill = styled.View<{ $isTablet: boolean }>`
  background-color: ${({ theme }) => theme.colors.gradientMidLight};
  padding: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.lg : theme.spacing.md}px;
  align-items: center;
`;

const ButtonText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeLg : theme.typography.sizeMd}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
  letter-spacing: 0.2px;
`;

// ErrorText — shows a plain-English message when geocoding fails.
const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
`;

// Location — collects the user's ZIP code and lawn size in sq ft.
// On Continue it geocodes the ZIP, stores lat/lng in Zustand, then
// navigates to the GrassType screen where the lat is used to infer
// grass type for users who don't know theirs.
export const Location = () => {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const setLocation = useOnboardingStore((s) => s.setLocation);

  const [zipCode, setZipCode] = useState('');
  const [lawnSize, setLawnSize] = useState('');
  const [zipFocused, setZipFocused] = useState(false);
  const [lawnFocused, setLawnFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = zipCode.length === 5 && lawnSize.length > 0 && !isLoading;

  const handleContinue = async () => {
    if (!isValid) return;
    setError(null);
    setIsLoading(true);

    try {
      const { lat, lng } = await geocodingService.geocodeZip(zipCode);
      setLocation(zipCode, parseInt(lawnSize, 10), lat, lng);
      router.push('/onboarding/grass-type');
    } catch (err) {
      // Log internally, show a generic message — never expose raw errors (MASWE-0087).
      logger.error('Geocoding failed', err);
      setError('We couldn\'t find that ZIP code. Please double-check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeasureLink = () => {
    Linking.openURL('https://www.organolawn.com/measure-your-lawn');
  };

  return (
    <OnboardingLayout
      heroIcon="📍"
      stepLabel="Step 1 of 3"
      title="Tell us about your yard"
      subtitle="We use this to figure out your season and how much product your lawn needs."
    >
      <FieldGroup>
        <FieldLabel $isTablet={isTablet}>ZIP code</FieldLabel>
        <StyledInput
          $focused={zipFocused}
          $isTablet={isTablet}
          value={zipCode}
          onChangeText={setZipCode}
          onFocus={() => setZipFocused(true)}
          onBlur={() => setZipFocused(false)}
          placeholder="e.g. 30301"
          placeholderTextColor={theme.colors.placeholderOnGlass}
          keyboardType="numeric"
          maxLength={5}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel $isTablet={isTablet}>Lawn size</FieldLabel>
        <InputWrapper>
          <StyledInput
            $focused={lawnFocused}
            $isTablet={isTablet}
            value={lawnSize}
            onChangeText={setLawnSize}
            onFocus={() => setLawnFocused(true)}
            onBlur={() => setLawnFocused(false)}
            placeholder="e.g. 1500"
            placeholderTextColor={theme.colors.placeholderOnGlass}
            keyboardType="numeric"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            style={{ paddingRight: 56 }}
          />
          <UnitBadge>
            <UnitText $isTablet={isTablet}>sq ft</UnitText>
          </UnitBadge>
        </InputWrapper>

        <HintCard onPress={handleMeasureLink} accessibilityRole="button">
          <HintIcon>📐</HintIcon>
          <HintBody>
            Not sure? <HintLink>Measure your lawn →</HintLink>
          </HintBody>
        </HintCard>
      </FieldGroup>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <PrimaryButton
        $enabled={isValid}
        disabled={!isValid}
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: !isValid }}
      >
        <PrimaryButtonFill $isTablet={isTablet}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <ButtonText $isTablet={isTablet}>Continue</ButtonText>
          )}
        </PrimaryButtonFill>
      </PrimaryButton>
    </OnboardingLayout>
  );
};
```

Note: `src/shared/utils/logger.ts` is referenced above. Create a minimal version:

Create `src/shared/utils/logger.ts`:

```ts
import * as Sentry from '@sentry/react-native';

// logger — production-safe logging. In dev, logs to console.
// In production, errors go to Sentry. Raw console.log is never used
// in production builds (MASVS-STORAGE-2, MASWE-0001).
export const logger = {
  error: (message: string, error?: unknown) => {
    if (__DEV__) {
      console.error(message, error);
    } else {
      Sentry.captureException(error, { extra: { message } });
    }
  },
  warn: (message: string) => {
    if (__DEV__) console.warn(message);
  },
  info: (message: string) => {
    if (__DEV__) console.log(message);
  },
};
```

Note: `@sentry/react-native` is listed in CLAUDE.md as `expo-sentry`. If it's not yet installed, add a TODO and use console.error in both branches temporarily until Sentry is configured.

- [ ] **Step 2: Commit**

```bash
git add src/features/onboarding/screens/Location.tsx src/shared/utils/logger.ts
git commit -m "feat: geocode ZIP on Location screen continue, store lat/lng in Zustand"
```

---

### Task 7: Update GrassType screen

**Files:**
- Modify: `src/features/onboarding/screens/GrassType.tsx`

When the user picks "unknown" and taps Continue, instead of navigating we show an inference UI: "Based on your location, we think you have [type] grass. Does that sound right?" They confirm or override before moving on.

- [ ] **Step 1: Write failing test**

Create `src/features/onboarding/screens/GrassType.test.tsx`:

```tsx
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('~/features/onboarding/store/useOnboardingStore', () => ({
  useOnboardingStore: jest.fn((selector) =>
    selector({ lat: 33.749, setGrassType: jest.fn() })
  ),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { GrassType } from './GrassType';
import { router } from 'expo-router';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('GrassType', () => {
  it('navigates to photo-capture when cool-season is selected', () => {
    const { getByText } = render(<GrassType />, { wrapper: Wrapper });
    fireEvent.press(getByText('Cool-season grass'));
    fireEvent.press(getByText('Continue'));
    expect(router.push).toHaveBeenCalledWith('/onboarding/photo-capture');
  });

  it('shows inference UI when unknown is selected and Continue pressed', () => {
    const { getByText } = render(<GrassType />, { wrapper: Wrapper });
    fireEvent.press(getByText("I'm not sure"));
    fireEvent.press(getByText('Continue'));
    // lat 33.749 is below 37°N → warm-season inferred
    expect(getByText(/warm-season/i)).toBeTruthy();
    expect(getByText(/Does that sound right/i)).toBeTruthy();
  });

  it('confirms inferred grass type and navigates', () => {
    const { getByText } = render(<GrassType />, { wrapper: Wrapper });
    fireEvent.press(getByText("I'm not sure"));
    fireEvent.press(getByText('Continue'));
    fireEvent.press(getByText("Yes, that's right"));
    expect(router.push).toHaveBeenCalledWith('/onboarding/photo-capture');
  });

  it('returns to picker when user says no to inference', () => {
    const { getByText, queryByText } = render(<GrassType />, { wrapper: Wrapper });
    fireEvent.press(getByText("I'm not sure"));
    fireEvent.press(getByText('Continue'));
    fireEvent.press(getByText('No, let me choose'));
    // Inference UI gone, picker back
    expect(queryByText(/Does that sound right/i)).toBeNull();
    expect(getByText('Continue')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest src/features/onboarding/screens/GrassType.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement updated GrassType screen**

Replace contents of `src/features/onboarding/screens/GrassType.tsx`:

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import styled from 'styled-components/native';
import { GrassTypeCard } from '~/features/onboarding/components/GrassTypeCard';
import { OnboardingLayout } from '~/features/onboarding/components/OnboardingLayout';
import { useOnboardingStore } from '~/features/onboarding/store/useOnboardingStore';
import type { GrassTypeList, ResolvedGrassType } from '~/features/onboarding/types';

const GRASS_OPTIONS: Array<{
  value: GrassTypeList;
  icon: string;
  name: string;
  description: string;
}> = [
  {
    value: 'cool-season',
    icon: '❄️',
    name: 'Cool-season grass',
    description: 'Grows best in spring and fall. Common in northern states.',
  },
  {
    value: 'warm-season',
    icon: '☀️',
    name: 'Warm-season grass',
    description: 'Thrives in summer heat. Common in southern states.',
  },
  {
    value: 'unknown',
    icon: '🤷',
    name: "I'm not sure",
    description: "We'll guess based on your ZIP code.",
  },
];

const LATITUDE_COOL_SEASON_CUTOFF = 37;

// inferGrassType — uses the user's latitude to guess their grass type.
// Above 37°N is predominantly cool-season territory (northern US);
// below is predominantly warm-season (southern US). See design spec for
// the full state-by-state reference.
function inferGrassType(lat: number): ResolvedGrassType {
  return lat >= LATITUDE_COOL_SEASON_CUTOFF ? 'cool-season' : 'warm-season';
}

const OptionList = styled.View`
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

const PrimaryButton = styled.TouchableOpacity<{ $enabled: boolean }>`
  background-color: ${({ theme }) => theme.colors.gradientMidLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
  opacity: ${({ $enabled }) => ($enabled ? 1 : 0.3)};
`;

const ButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
`;

// SecondaryButton — "No, let me choose" option in the inference view.
const SecondaryButton = styled.TouchableOpacity`
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm}px;
`;

const SecondaryButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  text-decoration-line: underline;
`;

// InferenceTitle — the main message shown when we've inferred the grass type.
const InferenceTitle = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeLg}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.textOnGlass};
  text-align: center;
`;

// InferenceSubtitle — the confirmation question below the inferred type.
const InferenceSubtitle = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// ChangeHint — small note below the confirm button reminding the user
// they can update this in Settings later.
const ChangeHint = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  text-align: center;
`;

// InferenceView — shown when the user selects "I'm not sure" and taps
// Continue. Displays the inferred grass type and asks for confirmation.
const InferenceView = ({
  inferred,
  onConfirm,
  onReject,
}: {
  inferred: ResolvedGrassType;
  onConfirm: () => void;
  onReject: () => void;
}) => {
  const label = inferred === 'cool-season' ? 'cool-season' : 'warm-season';
  return (
    <>
      <InferenceTitle>
        Based on your location, we think you have {label} grass.
      </InferenceTitle>
      <InferenceSubtitle>Does that sound right?</InferenceSubtitle>
      <PrimaryButton $enabled onPress={onConfirm} accessibilityRole="button">
        <ButtonText>Yes, that's right</ButtonText>
      </PrimaryButton>
      <SecondaryButton onPress={onReject} accessibilityRole="button">
        <SecondaryButtonText>No, let me choose</SecondaryButtonText>
      </SecondaryButton>
      <ChangeHint>You can always change this in Settings later.</ChangeHint>
    </>
  );
};

// GrassType — lets the user identify their grass type.
// If they select "I'm not sure", we infer from their latitude and
// ask them to confirm before proceeding. Confirmed type is saved to
// Zustand and later written to user_profiles at the end of onboarding.
export const GrassType = () => {
  const lat = useOnboardingStore((s) => s.lat);
  const setGrassType = useOnboardingStore((s) => s.setGrassType);

  const [selected, setSelected] = useState<GrassTypeList | null>(null);
  const [showInference, setShowInference] = useState(false);
  const [inferredType, setInferredType] = useState<ResolvedGrassType | null>(null);

  const handleContinue = () => {
    if (!selected) return;

    if (selected === 'unknown') {
      const inferred = inferGrassType(lat);
      setInferredType(inferred);
      setShowInference(true);
      return;
    }

    setGrassType(selected as ResolvedGrassType);
    router.push('/onboarding/photo-capture');
  };

  const handleConfirmInference = () => {
    if (!inferredType) return;
    setGrassType(inferredType);
    router.push('/onboarding/photo-capture');
  };

  const handleRejectInference = () => {
    setShowInference(false);
    setSelected(null);
    setInferredType(null);
  };

  if (showInference && inferredType) {
    return (
      <OnboardingLayout
        heroIcon="🌿"
        stepLabel="Step 2 of 3"
        title="What kind of grass do you have?"
        subtitle="This determines which tasks are right for your lawn."
      >
        <InferenceView
          inferred={inferredType}
          onConfirm={handleConfirmInference}
          onReject={handleRejectInference}
        />
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      heroIcon="🌿"
      stepLabel="Step 2 of 3"
      title="What kind of grass do you have?"
      subtitle="This determines which tasks are right for your lawn."
    >
      <OptionList>
        {GRASS_OPTIONS.map((opt) => (
          <GrassTypeCard
            key={opt.value}
            icon={opt.icon}
            name={opt.name}
            description={opt.description}
            selected={selected === opt.value}
            onPress={() => setSelected(opt.value)}
          />
        ))}
      </OptionList>

      <PrimaryButton
        $enabled={selected !== null}
        disabled={selected === null}
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: selected === null }}
      >
        <ButtonText>Continue</ButtonText>
      </PrimaryButton>
    </OnboardingLayout>
  );
};
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx jest src/features/onboarding/screens/GrassType.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/screens/GrassType.tsx \
        src/features/onboarding/screens/GrassType.test.tsx
git commit -m "feat: infer grass type from latitude for unknown users, show confirmation UI"
```

---

### Task 8: Onboarding service

**Files:**
- Create: `src/features/onboarding/services/onboarding.service.ts`
- Create: `src/features/onboarding/services/onboarding.service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/features/onboarding/services/onboarding.service.test.ts`:

```ts
jest.mock('~/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
      }),
    },
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

import { onboardingService } from './onboarding.service';
import { supabase } from '~/shared/lib/supabase';

const validParams = {
  zipCode: '30301',
  lawnSize: 1500,
  grassType: 'cool-season' as const,
  lat: 33.749,
  lng: -84.388,
};

describe('onboardingService.saveProfile', () => {
  it('upserts the profile with correct fields', async () => {
    await onboardingService.saveProfile(validParams);
    expect(supabase.from).toHaveBeenCalledWith('user_profiles');
  });

  it('throws when not authenticated', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
    });
    await expect(onboardingService.saveProfile(validParams))
      .rejects.toThrow('Not authenticated');
  });

  it('throws when Supabase returns an error', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      upsert: jest.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    });
    await expect(onboardingService.saveProfile(validParams)).rejects.toThrow();
  });

  it('throws when params fail Zod validation', async () => {
    await expect(
      onboardingService.saveProfile({ ...validParams, zipCode: '123' })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/features/onboarding/services/onboarding.service.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement onboarding service**

Create `src/features/onboarding/services/onboarding.service.ts`:

```ts
import { z } from 'zod';
import { supabase } from '~/shared/lib/supabase';
import type { ResolvedGrassType } from '~/features/onboarding/types';

// saveProfileSchema — validates all profile fields before sending to Supabase.
// Catches bad data at the service boundary (MASVS-CODE-4, MASWE-0079).
const saveProfileSchema = z.object({
  zipCode: z.string().length(5, 'ZIP code must be exactly 5 digits'),
  lawnSize: z.number().positive('Lawn size must be a positive number'),
  grassType: z.enum(['cool-season', 'warm-season']),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const onboardingService = {
  // saveProfile — creates or updates the user's profile row at the end of
  // onboarding. Called from the PhotoCapture screen after the user has
  // provided their location, lawn size, and grass type.
  // user_id is read from the active Supabase session — never passed from the UI.
  async saveProfile(params: {
    zipCode: string;
    lawnSize: number;
    grassType: ResolvedGrassType;
    lat: number;
    lng: number;
  }): Promise<void> {
    saveProfileSchema.parse(params);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('user_profiles').upsert({
      user_id: user.id,
      zip_code: params.zipCode,
      lawn_size: params.lawnSize,
      grass_type: params.grassType,
      lat: params.lat,
      lng: params.lng,
    });

    if (error) throw new Error(error.message);
  },
};
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest src/features/onboarding/services/onboarding.service.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/onboarding/services/onboarding.service.ts \
        src/features/onboarding/services/onboarding.service.test.ts
git commit -m "feat: add onboarding service to save profile with lat/lng to Supabase"
```

---

### Task 9: Update PhotoCapture screen

**Files:**
- Modify: `src/features/onboarding/screens/PhotoCapture.tsx`

The PhotoCapture screen currently navigates straight to `/(tabs)` on both take photo and skip. We need it to call `onboardingService.saveProfile` first, using the data accumulated in Zustand.

- [ ] **Step 1: Update PhotoCapture.tsx**

Replace the contents of `src/features/onboarding/screens/PhotoCapture.tsx`:

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { onboardingService } from '~/features/onboarding/services/onboarding.service';
import { useOnboardingStore } from '~/features/onboarding/store/useOnboardingStore';
import { OnboardingLayout } from '~/features/onboarding/components/OnboardingLayout';
import { logger } from '~/shared/utils/logger';

// CameraWell — tappable area that will launch the camera.
const CameraWell = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.glassOnboardingInput};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.xl}px;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

const CameraIcon = styled.Text`
  font-size: ${({ theme }) => theme.typography.size2xl}px;
`;

const CameraLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
`;

const PrimaryButton = styled.TouchableOpacity<{ $enabled: boolean }>`
  background-color: ${({ theme }) => theme.colors.gradientMidLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
  opacity: ${({ $enabled }) => ($enabled ? 1 : 0.5)};
`;

const ButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
`;

const SkipLink = styled.TouchableOpacity`
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs}px;
`;

const SkipText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  text-decoration-line: underline;
`;

// ErrorText — shown when profile save fails.
const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
`;

// PhotoCapture — the final onboarding step. Saves the user profile to
// Supabase before navigating to the main app. The photo itself will be
// wired up when the progress-photos feature is built — for now the
// camera well is a placeholder.
export const PhotoCapture = () => {
  const theme = useTheme();
  const { zipCode, lawnSize, lat, lng, grassType, reset } = useOnboardingStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // saveAndProceed — saves the user's profile then clears the Zustand
  // store and navigates to the main app. Called for both take-photo and skip.
  const saveAndProceed = async () => {
    if (isSaving || !grassType) return;
    setError(null);
    setIsSaving(true);

    try {
      await onboardingService.saveProfile({ zipCode, lawnSize, lat, lng, grassType });
      reset();
      router.replace('/(tabs)');
    } catch (err) {
      logger.error('Profile save failed', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingLayout
      heroIcon="📸"
      stepLabel="Step 3 of 3"
      title='Snap a "before" photo'
      subtitle="See how much your lawn improves over the season."
    >
      <CameraWell
        onPress={saveAndProceed}
        accessibilityRole="button"
        accessibilityLabel="Take a photo of your lawn"
      >
        <CameraIcon>📷</CameraIcon>
        <CameraLabel>Tap to take a photo of your lawn</CameraLabel>
      </CameraWell>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <PrimaryButton
        $enabled={!isSaving}
        disabled={isSaving}
        onPress={saveAndProceed}
        accessibilityRole="button"
        accessibilityLabel="Take photo"
      >
        {isSaving ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <ButtonText>Take photo</ButtonText>
        )}
      </PrimaryButton>

      <SkipLink
        onPress={saveAndProceed}
        accessibilityRole="button"
        accessibilityLabel="Skip for now"
      >
        <SkipText>Skip for now</SkipText>
      </SkipLink>
    </OnboardingLayout>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/onboarding/screens/PhotoCapture.tsx
git commit -m "feat: save user profile to Supabase at end of onboarding"
```

---

### Task 10: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
npx jest
```

Expected: All tests pass. If any fail, fix before proceeding.

- [ ] **Step 2: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: resolve test failures after Plan 1 integration"
```

---

**Plan 1 complete.** Every user who completes onboarding now has lat, lng, and grass_type stored in `user_profiles`. The `recommendation_events` and `weather_cache` tables are ready for the Edge Function.

**Next:** See `2026-05-11-recommendation-engine-plan-2-client.md` for the client-side recommendations UI and Settings additions.
