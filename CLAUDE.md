# Kura — CLAUDE.md

Beginner lawn care app. Target audience: People with zero lawn experience. Every decision prioritizes simplicity and plain language over feature depth. If a beginner has to ask "what does this mean?", we've failed.

---

## Stack

| Layer | Tool |
|---|---|
| Framework | React Native 0.76+ (New Architecture on by default) |
| Language | TypeScript strict mode — no `.js` files permitted |
| Toolchain | Expo SDK 52+ · EAS Build · EAS Submit |
| JS Engine | Hermes — never disable it |
| Renderer | Fabric (JSI, no bridge) |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| UI State | Zustand |
| Server State | TanStack Query v5 (React Query) |
| Forms | React Hook Form + Zod |
| Styling | styled-components/native v6+ |
| Images | expo-image |
| Camera / Photo picker | expo-image-picker |
| Secure Storage | expo-secure-store |
| Screen Capture | expo-screen-capture |
| Testing | Jest · React Native Testing Library · Detox (E2E) |
| CI/CD | GitHub Actions + EAS pipelines |
| Error Tracking | Sentry (expo-sentry) |

---

## Absolute Rules

These are non-negotiable. Don't work around them, don't ask if they apply.

- **No secrets in the codebase.** API keys, Supabase URLs, anon keys — all via `EXPO_PUBLIC_*` env vars. Never hardcoded. (MASVS-STORAGE-1, MASWE-0005)
- **No AsyncStorage for sensitive data.** Tokens and session data go through `expo-secure-store` only. AsyncStorage is unencrypted and readable on rooted/jailbroken devices. (MASVS-STORAGE-1, MASWE-0006)
- **No class-based components.** Functional components with hooks only, always.
- **No `React.FC`.** Type props directly in the function signature instead. This keeps the type information in one place and avoids the hidden `children` prop that `React.FC` used to add automatically. Use: `export const MyComponent = ({ prop }: MyProps) => { ... }` — never `React.FC<MyProps>`.
- **No inline `style={}`** except for values that must be computed at runtime (e.g. `Animated.Value` transforms, `onLayout` widths). Everything else is a styled-component.
- **No `StyleSheet.create()`.** Styles belong in styled-components co-located with the component.
- **No hardcoded color or spacing values** in component files. All tokens come from `theme`.
- **No Redux.** Zustand for client state, TanStack Query for server state.
- **Dependencies point inward only.** Services never import components. Hooks never import screens. `shared/` never imports from `features/`.
- **RLS on every user table.** No exceptions. (MASVS-AUTH-2, MASWE-0042)
- **TypeScript strict.** No `any`, no `// @ts-ignore` without a comment explaining why.
- **No `console.log` in production.** All logging must be stripped or gated behind `__DEV__`. (MASVS-STORAGE-2, MASWE-0001)
- **All network traffic over TLS 1.2+ only.** No `http://` URLs anywhere in the codebase. (MASVS-NETWORK-1, MASWE-0050)
- **Validate all external input with Zod** before it touches app state or the service layer. (MASVS-CODE-4, MASWE-0079)
- **Never expose internal errors to the UI.** Log to Sentry; show a generic user-facing message. (MASVS-CODE-4, MASWE-0087)
- **No custom cryptography.** Delegate all crypto to Supabase Auth, expo-secure-store, and TLS. (MASVS-CRYPTO-1, MASWE-0019)

---

## Code Style & Readability

These rules exist because the codebase is actively being debugged and extended — comments are a first-class tool here, not noise.

### Comment everything — in plain English

Write comments as if explaining to someone who has never seen this code before. Use everyday words, no jargon. Every comment must explain **how** the code works, not just name what it is.

Add a comment on:

- **Every component** — describe what it draws on screen and how it behaves when the user interacts with it.
- **Every hook** — explain what it tracks, what triggers it, and what it hands back to the component.
- **Every service function** — describe the database or API call it makes, what data goes in, and what comes back.
- **Every styled-component** — explain its visual role and any behaviour-driven styles (e.g. why opacity changes on a certain prop).
- **Non-trivial logic** — walk through what the condition checks, what each branch does, and why.
- **Security controls** — explain in plain English why the restriction exists, not just that it does.

```tsx
// EmailInput — the text box where the user types their email address.
// We turn off autoComplete and textContentType so the device doesn't save
// what the user types here — that prevents the keyboard from caching
// sensitive input on the device (required by MASVS-PLATFORM-2).
const EmailInput = styled(TextInput)`
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.inputBorderDark};
`;

// useTaskList — loads the list of lawn tasks for this user.
// It asks Supabase for tasks that match the user's grass type and the
// current season, then hands them back ready to display.
// Results are kept fresh for 1 hour — if the hour hasn't passed,
// the cached list is shown instantly while a background refresh runs.
export const useTaskList = () => { ... };

// If Supabase returns an error, we throw so TanStack Query catches it
// and shows the error state — we never pass raw error messages to the UI
// because they can contain internal database details (MASWE-0087).
if (error) throw new Error(error.message);
```

### Naming

- Components, hooks, services, and variables must be named for what they **do**, not what they **are**.
  - ✅ `useSubmitMagicLink`, `TaskCompletionRow`, `fetchTasksForSeason`
  - ❌ `useHelper`, `MyComponent`, `getData`
- Booleans prefix with `is`, `has`, or `can`: `isLoading`, `hasError`, `canSubmit`.
- Event handlers prefix with `handle`: `handleSubmit`, `handleEmailChange`.

### Structure for scannability

- Keep components under ~120 lines. Extract sub-components or hooks if they grow beyond that.
- Order within a component file:
  1. Imports
  2. Types / interfaces
  3. Styled-components
  4. Component function
  5. Exports
- One concept per file — don't co-locate unrelated components.

---

## Folder Structure

```
src/
├── app/
│   ├── App.tsx
│   ├── providers/
│   │   ├── QueryProvider.tsx      # TanStack Query client
│   │   ├── AuthProvider.tsx       # Supabase session context
│   │   ├── ThemeProvider.tsx      # styled-components ThemeProvider
│   │   └── SentryProvider.tsx     # error tracking with PII scrubbing
│   └── navigation/
│       ├── RootNavigator.tsx      # gates on auth session
│       ├── AuthStack.tsx          # unauthenticated: onboarding
│       └── AppTabs.tsx            # authenticated: Home | Settings
│
├── features/
│   ├── onboarding/
│   │   ├── screens/               # LocationScreen, GrassTypeScreen, PreviewScreen
│   │   ├── components/GrassTypePicker/
│   │   ├── hooks/useOnboarding.ts
│   │   ├── services/onboarding.service.ts
│   │   └── types.ts
│   ├── tasks/
│   │   ├── screens/               # TaskListScreen, TaskDetailScreen
│   │   ├── components/TaskCard/   # TaskCard.tsx + TaskCard.test.tsx + index.tsx
│   │   ├── components/TaskList/
│   │   ├── hooks/                 # useTaskList.ts, useCompleteTask.ts
│   │   ├── services/tasks.service.ts
│   │   └── types.ts
│   ├── notifications/
│   │   ├── hooks/useNotifications.ts
│   │   ├── services/notifications.service.ts
│   │   │   # platform split: .ios.ts / .android.ts / .ts (fallback)
│   │   └── types.ts
│   └── progress-photos/
│       ├── screens/               # LawnProgressScreen, PhotoCaptureScreen
│       ├── components/PhotoTimeline/  # scrollable before→now timeline
│       ├── components/PhotoThumbnail/ # single photo cell with date label
│       ├── hooks/                 # useLawnPhotos.ts, useUploadPhoto.ts
│       ├── services/progressPhotos.service.ts
│       └── types.ts
│
├── shared/
│   ├── components/                # Button, Typography, TooltipModal, ProgressBar
│   ├── hooks/
│   │   ├── useAppState.ts
│   │   ├── useSafeInsets.ts
│   │   ├── useDebounce.ts
│   │   └── useDeviceIntegrity.ts  # root/jailbreak detection
│   ├── lib/supabase.ts            # single client instance (uses SecureStore adapter)
│   └── utils/
│       ├── season.ts
│       ├── date.ts
│       ├── validation.ts          # Zod schemas shared across features
│       └── logger.ts              # production-safe logger (Sentry in prod, console in dev)
│
├── config/
│   ├── env.ts                     # Zod-validated env vars — fails fast if missing
│   ├── features.ts                # feature flags
│   └── constants.ts
│
└── types/
    ├── supabase.ts                # generated: supabase gen types typescript
    ├── navigation.ts              # typed param lists for all navigators
    └── styled.d.ts                # DefaultTheme module augmentation
```

---

## Dependency Rule

```
Screens
  └── Components
        └── Hooks
              └── Services
                    └── Config / Types / Utils
```

Inner layers never import from outer layers. If you need to share something between layers, it belongs in `shared/` or `config/`.

---

## Components

### Every component gets its own folder

```
features/tasks/components/TaskCard/
  index.tsx          ← barrel: export { TaskCard } from './TaskCard'
  TaskCard.tsx       ← implementation
  TaskCard.test.tsx  ← co-located test
```

Import always via the barrel: `import { TaskCard } from '@/features/tasks/components/TaskCard'`

### Compound components for multi-part UI

```tsx
const TooltipModal: React.FC<TooltipModalProps> & TooltipModalComposition = ...
TooltipModal.Trigger = TooltipTrigger;
TooltipModal.Content = TooltipContent;

<TooltipModal>
  <TooltipModal.Trigger><Icon name="help-circle" /></TooltipModal.Trigger>
  <TooltipModal.Content>Why this task matters...</TooltipModal.Content>
</TooltipModal>
```

### Screens vs Components

| | Screens | Components |
|---|---|---|
| Data fetching | ✅ via TanStack Query hooks | ❌ never |
| Supabase calls | ❌ never directly | ❌ never |
| Props | minimal (nav params) | all data via props |
| State | screen-level side effects | local UI state only |
| Reused | ❌ never | ✅ highly reusable |

---

## Styling (styled-components/native)

### Theme tokens — always use the theme, never hardcode

```ts
// config/theme.ts
export const lightTheme = {
  colors: {
    primary:    '#2D6A2D',
    primaryMid: '#5A9E3A',
    background: '#FFFFFF',
    surface:    '#EAF4E5',
    text:       '#1A1A1A',
    textMuted:  '#888888',
    border:     '#CCCCCC',
    success:    '#C8E6C0',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radii:   { sm: 4, md: 8, lg: 16, full: 9999 },
  typography: {
    sizeXs: 12, sizeSm: 14, sizeMd: 16, sizeLg: 20, sizeXl: 24, size2xl: 32,
    weightRegular: '400' as const,
    weightMedium:  '500' as const,
    weightBold:    '700' as const,
  },
};

export const darkTheme: AppTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#0F1F0F',
    surface:    '#1A2E1A',
    text:       '#F0F0F0',
    textMuted:  '#AAAAAA',
    border:     '#2E4A2E',
  },
};
```

### TypeScript augmentation

```ts
// types/styled.d.ts
import type { lightTheme } from '@/config/theme';
type AppTheme = typeof lightTheme;

declare module 'styled-components/native' {
  export interface DefaultTheme extends AppTheme {}
}
```

### Component usage

```tsx
import styled from 'styled-components/native';

const Container = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius:    ${({ theme }) => theme.radii.md}px;
  padding:          ${({ theme }) => theme.spacing.md}px;
`;

// Transient props for variants — $ prefix prevents forwarding to native element
const TaskRow = styled.View<{ $completed: boolean }>`
  opacity: ${({ $completed }) => ($completed ? 0.5 : 1)};
  background-color: ${({ $completed, theme }) =>
    $completed ? theme.colors.success : theme.colors.surface};
`;
```

---

## State Management

| State type | Tool |
|---|---|
| Server / async (Supabase data) | TanStack Query |
| Global client (session, onboarding step, prefs) | Zustand |
| Form | React Hook Form + Zod |
| Local UI (modal open, press state) | `useState` / `useReducer` |
| Navigation | React Navigation — do not mirror in Zustand |

---

## Service Layer

Services are the only layer that calls Supabase or Expo APIs directly.

```ts
// features/tasks/services/tasks.service.ts
export const tasksService = {
  async getTasksForProfile(grassType: GrassType, season: Season): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .contains('grass_types', [grassType])
      .contains('seasons', [season]);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async completeTask(taskId: string): Promise<void> {
    // Validate input before touching the DB (MASVS-CODE-4)
    taskIdSchema.parse(taskId);

    const { error } = await supabase
      .from('task_completions')
      .insert({ task_id: taskId, completed_at: new Date().toISOString() });
      // user_id is set server-side by RLS from auth.uid() — never passed from client

    if (error) throw new Error(error.message);
  },
};
```

---

## Security (OWASP MASVS)

Every control maps to its MASVS category and MASWE weakness ID. All rules are mandatory.

### MASVS-STORAGE-1 — Sensitive data stored securely (MASWE-0002, 0006, 0036)

**What counts as sensitive in Kura:** auth tokens, Supabase JWT, user ID, ZIP code,  any PII.

```ts
// shared/lib/supabase.ts
import * as SecureStore from 'expo-secure-store';

const secureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  { auth: { storage: secureStoreAdapter, autoRefreshToken: true } }
);
// expo-secure-store uses iOS Keychain (hardware-backed) and Android EncryptedSharedPreferences
```

| Storage type | Allowed for | Forbidden for |
|---|---|---|
| `expo-secure-store` | tokens, session, user ID | — |
| Supabase (server) | user_profiles, task data | raw PII logs |
| In-memory (Zustand) | UI state, onboarding step | tokens, PII |
| `AsyncStorage` | non-sensitive UI prefs only | anything sensitive |
| External storage | **nothing** | all app data (MASWE-0007) |

### MASVS-STORAGE-2 — No sensitive data in logs or backups (MASWE-0001, 0003, 0004)

```ts
// shared/utils/logger.ts
export const logger = {
  debug: (msg: string, data?: unknown) => {
    if (__DEV__) console.log(`[Kura] ${msg}`, data);
    // Stripped entirely in production builds by Hermes dead-code elimination
  },
  error: (msg: string, error?: unknown) => {
    if (__DEV__) {
      console.error(`[Kura] ${msg}`, error);
    } else {
      Sentry.captureException(error, { extra: { msg } });
    }
  },
};

// ❌ Forbidden anywhere in the codebase:
// console.log('session:', session)     ← leaks JWT to device logs
// console.log('zip:', user.zipCode)    ← logs PII
// console.error('error:', error)       ← may contain Supabase error payloads
```

**Android backup exclusion (`app.json`):**
```json
{ "android": { "allowBackup": false } }
```

**iOS:** expo-secure-store data is automatically excluded from iCloud backup. Never write sensitive data outside SecureStore on iOS. (MASTG-BEST-0004, MASWE-0004)

**Screenshot protection on backgrounding** (MASWE-0055, MASTG-BEST-0014):
```ts
// shared/hooks/useScreenshotGuard.ts
import * as ScreenCapture from 'expo-screen-capture';

export const useScreenshotGuard = () => {
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => { ScreenCapture.allowScreenCaptureAsync(); };
  }, []);
};
// Apply on all authenticated screens to prevent app-switcher screenshots
```

### MASVS-AUTH-1 & AUTH-2 — Server-side auth and authorization (MASWE-0041, 0042)

All authentication is Supabase Auth (JWT). Authorization is enforced by RLS — **never** on the client only.

```sql
-- RLS on every user table — no exceptions
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"     ON user_profiles   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_completions" ON task_completions FOR ALL USING (auth.uid() = user_id);


Additional auth rules:
- **Never pass `user_id` from the client** on INSERT — always derive from `auth.uid()` server-side
- **Never use `service_role` key in the app bundle** — it bypasses all RLS (MASWE-0005)
- **401 from Supabase** → clear session from SecureStore → navigate to AuthStack (MASWE-0038)
- **Token refresh** is automatic via `autoRefreshToken: true`; do not implement manual refresh logic

### MASVS-CRYPTO-1 — No broken or custom cryptography (MASWE-0013, 0019, 0021, 0027)

Kura delegates all cryptographic operations to the platform and Supabase. No custom crypto is written.

| Operation | Delegate to | Never use |
|---|---|---|
| Password hashing | Supabase Auth (bcrypt) | MD5, SHA-1, custom hash |
| Token signing | Supabase Auth (RS256 JWT) | HS256 with hardcoded secret |
| At-rest encryption | expo-secure-store (Keychain/Keystore) | Custom AES, DES, RC4 |
| Data in transit | TLS 1.2+ (iOS ATS / Android NSC) | HTTP, TLS 1.0/1.1 |
| Random values | Platform CSPRNG only if ever needed | `Math.random()` |

No hardcoded keys, IVs, salts, or secret strings anywhere in the codebase — the Zod env schema and git pre-commit hooks catch these.

### MASVS-NETWORK-1 & NETWORK-2 — Secure network communication (MASWE-0050, 0052)

```ts
// config/env.ts — HTTPS enforced at startup; http:// throws ZodError before app loads
const envSchema = z.object({
  SUPABASE_URL:      z.string().url().startsWith('https://'),
  SUPABASE_ANON_KEY: z.string().min(1),
  SENTRY_DSN:        z.string().url().optional(),
});
```

**iOS — do not weaken App Transport Security:**
```json
{
  "ios": {
    "infoPlist": {
      "NSAppTransportSecurity": { "NSAllowsArbitraryLoads": false }
    }
  }
}
```

**Android — Network Security Config:**
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
```

Rules:
- Never set `rejectUnauthorized: false` — SSL validation must never be disabled (MASWE-0052)
- Never add user-supplied CAs to the trust store
- TLS 1.0 and 1.1 are not permitted — Supabase enforces TLS 1.2+ server-side; iOS ATS and Android NSC enforce it client-side

### MASVS-PLATFORM-1 & PLATFORM-2 — Safe platform interaction (MASWE-0054, 0055, 0058, 0117)

**Permission minimization — only request what is strictly needed:**

| Permission | Timing | Reason |
|---|---|---|
| `NOTIFICATIONS` | At end of onboarding, with explanation shown | Weekly task reminders and photo check-in reminders |
| `CAMERA` | When user taps "Take a photo" in Progress tab, with plain-English rationale shown first | Lawn progress photos |
| `LOCATION` | **Never** | ZIP is entered manually — no GPS |
| `MEDIA_LIBRARY` | **Never** | Photos go directly to Supabase Storage — not saved to device gallery |
| `CONTACTS` | **Never** | No social features |
| `MICROPHONE` | **Never** | No audio features |

**Deep link validation** (MASWE-0058): All deep link paths must be defined in the React Navigation linking config. Unregistered paths silently do nothing.

```ts
const linking: LinkingOptions<RootParamList> = {
  prefixes: ['kura://', 'https://app.kura.com'],
  config: {
    screens: {
      AppTabs: { screens: { Home: 'tasks' } },
      // Only registered paths navigate — all others are ignored by RN
    },
  },
};
```

**Notifications must not expose PII** (MASWE-0054, MASTG-BEST-0027):
```ts
// ✅ Generic — no PII in notification content
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Your lawn needs attention',
    body:  'You have tasks waiting this week 🌱',
    // No user name, email, ZIP, or account data
  },
});
```

**Keyboard cache disabled on inputs** (MASWE-0055, MASTG-BEST-0026):
```tsx
<TextInput
  keyboardType="numeric"
  autoCorrect={false}
  autoComplete="off"
  textContentType="none"   // iOS: disables QuickType / keyboard learning
  maxLength={5}
/>
```

**Clipboard:** Never write auth tokens, user IDs, or PII to the system clipboard. (MASWE-0065)

### MASVS-CODE-1 through CODE-4 — Code quality and input safety (MASWE-0076, 0079, 0086, 0087)

**All external input validated with Zod:**
```ts
// shared/utils/validation.ts
export const zipCodeSchema = z.string().regex(/^\d{5}$/, 'Must be a 5-digit US ZIP code');
export const grassTypeSchema = z.enum(['cool-season', 'warm-season']);
export const taskIdSchema = z.string().uuid();
export const taskCompletionSchema = z.object({
  taskId:      z.string().uuid(),
  completedAt: z.string().datetime(),
});
export const lawnPhotoSchema = z.object({
  weekNumber: z.number().int().min(0).max(52),
});
// storagePathSchema ensures paths follow the expected {uuid}/{timestamp}-week-{n}.jpg shape
// before they are passed to Supabase Storage — prevents path-traversal style inputs
export const storagePathSchema = z
  .string()
  .regex(/^[0-9a-f-]{36}\/\d+-week-\d+\.jpg$/, 'Invalid storage path format');
// All service layer inputs pass through these schemas before any DB write
```

**No SQL injection** (MASWE-0086): Supabase JS client uses parameterized queries. Never concatenate user input into `.rpc()` calls or raw SQL strings.

**Error handling — internals never reach the UI** (MASWE-0087):
```ts
try {
  await tasksService.completeTask(taskId);
} catch (err) {
  logger.error('completeTask failed', err); // Sentry in prod, console in dev
  showToast('Something went wrong. Please try again.'); // generic to user
}
// Never: Alert.alert('Error', err.message) — may expose DB error strings
```

**Dependency auditing** (MASWE-0076): `npm audit --audit-level=high` runs in CI on every PR and blocks merge on high-severity findings.

**Platform version targets** (MASWE-0077, 0078, MASTG-BEST-0010):
- Android `minSdkVersion` = 31 (Android 12) — security patches available
- iOS deployment target = 16.0 — security patches available
- Upgrade Expo SDK within 3 months of each major release

### MASVS-RESILIENCE-1 through RESILIENCE-4 — Tamper resistance

**Debuggable disabled in production** (MASWE-0067, MASTG-BEST-0007):
EAS Build production profile sets `debuggable=false` automatically. Confirm in `eas.json` that the production profile does not set `NODE_ENV=development`. All `if (__DEV__)` branches are dead code in release builds — Hermes eliminates them.

**Root / jailbreak detection** (MASWE-0097, MASTG-BEST-0030):
```ts
// shared/hooks/useDeviceIntegrity.ts
import * as Device from 'expo-device';

export const useDeviceIntegrity = () => {
  const [isCompromised, setIsCompromised] = useState(false);

  useEffect(() => {
    Device.isRootedExperimentalAsync().then(setIsCompromised);
  }, []);

  return { isCompromised };
};

// In App.tsx — advisory only, not a hard block (respects legitimate unlocked bootloaders)
// "Kura works best on unmodified devices. Some security features may be limited."
```

**No debug symbols in production** (MASWE-0093): Sentry source maps are uploaded in EAS post-build hooks. They are never bundled with the app binary. `.sentry-properties` is in `.gitignore`.

**App signing** (MASTG-BEST-0006): All production builds signed via EAS Credentials. Android uses APK Signature Scheme v3+. iOS uses Apple Distribution certificate. Signing keys are stored in EAS — never in the repo.

### MASVS-PRIVACY-1 through PRIVACY-4 — Privacy by design (MASWE-0109, 0110, 0111, 0112, 0113, 0115)

Data minimization: collect only what is required for each feature.

| Data | Purpose | Retention | User control |
|---|---|---|---|
| ZIP code | Season detection | Until account deleted | Editable in Settings |
| Grass type | Task filtering | Until account deleted | Editable in Settings |
| Task completion timestamps | Progress tracking | Until account deleted | Deletable |
| Lawn progress photos | Visual progress timeline | Until account deleted | Deletable individually from Progress tab; all deleted on account deletion |
| Device push token | Notifications | Until notifications disabled | Toggle in Settings |
| Crash reports (Sentry) | App stability | 90 days | No PII in reports |

Rules:
- **No GPS data** — ZIP entered manually, no location permission requested (MASWE-0109)
- **No analytics or ad SDK** permitted in the bundle (MASWE-0110)
- **Sentry PII scrubbing** — `beforeSend` strips email and IP before events leave the device:

```ts
// app/providers/SentryProvider.tsx
Sentry.init({
  dsn: env.SENTRY_DSN,
  beforeSend(event) {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }
    return event;
  },
});
```

- **Account deletion** triggers a Supabase Edge Function that: (1) cascade-deletes all rows in `user_profiles`, `task_completions`, and `lawn_photos` via `ON DELETE CASCADE` FK; (2) calls `storage.remove()` to delete all objects under `{user_id}/` in the `lawn-photos` bucket — Storage objects are not covered by FK cascades. (MASWE-0113)
- **Privacy policy** linked in Settings screen and App Store listing — accurately reflects data table above (MASWE-0111)
- **App Store privacy nutrition label** must accurately declare data collection (MASWE-0112)

---

## Secrets Management

```ts
// app.config.ts
export default {
  extra: {
    supabaseUrl:     process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    sentryDsn:       process.env.EXPO_PUBLIC_SENTRY_DSN,
  },
};
```

```bash
# .env.example  — commit this
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SENTRY_DSN=

# .env.local  — NEVER commit (in .gitignore)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

Production secrets are stored in EAS Secrets (`eas secret:create`), never in the repository or directly in `app.json`.

---

## Navigation

```
RootNavigator (reads Supabase session)
  ├── AuthStack      — unauthenticated
  │   └── Onboarding: LocationScreen → GrassTypeScreen → PreviewScreen → PhotoCaptureScreen (before photo)
  └── AppTabs        — authenticated
      ├── HomeStack:     TaskListScreen → TaskDetailScreen
      ├── ProgressStack: LawnProgressScreen → PhotoCaptureScreen
      └── SettingsScreen
```

- All param lists typed in `src/types/navigation.ts` — no untyped `route.navigate()` calls
- Notification taps deep-link to `HomeStack > TaskListScreen` via registered `kura://` scheme
- Photo reminder notification taps deep-link to `ProgressStack > PhotoCaptureScreen` via `kura://progress/capture`
- All deep link paths validated against the registered scheme — unrecognized paths are silently dropped (MASWE-0058)

---

## Feature Flags

```ts
// config/features.ts
export const FEATURES = {
  STREAK_COUNTER:       true,
  GLOSSARY:             false,  // in development
  PUSH_DIGEST:          true,
  LAWN_PROGRESS_PHOTOS: true,
} as const;
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
-- Only the owning user can read their own photos.
-- The path must begin with their auth UID — enforced by the policy, not the client.
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

## Platform Handling

| Concern | Approach |
|---|---|
| Notifications | `expo-notifications`. Register Android channels at startup. |
| Secure storage | `expo-secure-store` (Keychain iOS / EncryptedSharedPreferences Android) |
| Camera / photo picker | `expo-image-picker`. Always `exif: false`. Request permission at point of use. |
| Safe areas | `react-native-safe-area-context`. Never hardcode status bar heights. |
| Keyboard | `KeyboardAvoidingView` with platform-appropriate `behavior` prop. |
| Haptics | `expo-haptics` — silently no-ops on unsupported devices. |
| Screen capture | `expo-screen-capture` on all authenticated screens (MASVS-PLATFORM-2) |
| Platform-specific logic | `.ios.ts` / `.android.ts` file resolution — no inline `Platform.OS ===` in JSX |

---

## Data Model

All FK references to `auth.users` use `ON DELETE CASCADE` so account deletion removes all user data automatically.

| Table | Key columns |
|---|---|
| `user_profiles` | `user_id` (FK → auth.users CASCADE DELETE), `zip_code`, `grass_type`, `season_override`, `notifications_enabled` |
| `tasks` | `id`, `title`, `subtitle`, `why_it_matters`, `estimated_minutes`, `recurrence`, `seasons text[]`, `grass_types text[]` |
| `task_completions` | `id`, `user_id` (RLS + CASCADE DELETE), `task_id`, `completed_at`, `week_of` |
| `lawn_photos` | `id`, `user_id` (RLS + CASCADE DELETE), `storage_path`, `taken_at`, `week_number`, `season` |

**Supabase Storage:** private bucket `lawn-photos`. Objects are stored at `{user_id}/{timestamp}-week-{n}.jpg`. Access is controlled by Storage policies (see Lawn Progress Photos section) — there is no public URL. The account deletion Edge Function must call `storage.remove()` on the user's folder in addition to relying on the cascade FK for row cleanup.

Types generated via: `supabase gen types typescript > src/types/supabase.ts`

---

## Testing

Test files co-located with source — never in a top-level `__tests__` folder.

| Layer | Tool | Rule |
|---|---|---|
| Utils | Jest | Pure functions, no mocks. 100% coverage target. |
| Services | Jest + supabase-js mock | Verify queries and error handling. No network. |
| Hooks | RNTL `renderHook()` | Mock service layer. Test state transitions. |
| Components | RNTL `render()` | Props in, assertions out. No Supabase. |
| E2E | Detox | Onboarding flow, task completion, notification toggle. |
| RLS | `supabase start` (local) | SQL-level cross-user isolation tests. |
| Security | `npm audit` in CI | Blocks merge on high-severity CVEs. |

**Security-specific tests required:**

- RLS: sign in as User A, query `task_completions` filtering by User B's `user_id` — expect empty result
- RLS: INSERT `task_completion` with spoofed `user_id` — expect RLS policy rejection
- RLS: sign in as User A, query `lawn_photos` filtering by User B's `user_id` — expect empty result
- Storage policy: request signed URL for a path starting with a different user's UID — expect 403
- Photos: confirm `expo-image-picker` is always called with `exif: false` — assert no EXIF keys in upload payload
- Photos: confirm uploaded bytes go to Supabase Storage, not `AsyncStorage` or external storage
- Photos: E2E — tap "Take a photo", grant permission, capture, verify thumbnail appears in `LawnProgressScreen`
- Notifications: after before photo captured, assert 4 photo reminder notifications are scheduled with correct fire dates
- Input: pass malformed ZIP codes to `zipCodeSchema.parse()` — expect `ZodError`
- Input: pass non-UUID string to `taskIdSchema.parse()` — expect `ZodError`
- Deep link: pass unrecognized scheme to linking config — assert no navigation occurs
- Deep link: `kura://progress/capture` — assert navigation to `PhotoCaptureScreen`
- Logger: in production mode, assert `console.log` is never called

---

## Performance

- Use `FlashList` (Shopify) instead of `FlatList` for any list with 20+ items
- `useMemo` for expensive computations; `useCallback` for stable callbacks passed as props
- `React.memo` on pure presentational components that receive the same props frequently
- No anonymous functions or object literals in JSX props (new reference every render)
- Never disable Hermes
- All images via `expo-image` — lazy loading, blurhash placeholders, disk cache
- TanStack Query `staleTime`: task lists → 1 hour, user profile → 24 hours
- Use `Suspense` boundaries with skeleton loaders — never blank screens or mid-content spinners

---

## OWASP MASVS Compliance Checklist

Use as a PR review gate for all security-relevant changes.

### MASVS-STORAGE
- [ ] No sensitive data in AsyncStorage (MASWE-0006)
- [ ] All tokens in expo-secure-store (MASWE-0036)
- [ ] No PII or tokens in `console.log` or Sentry breadcrumbs (MASWE-0001)
- [ ] `allowBackup: false` in Android config (MASWE-0003, 0004)
- [ ] Notification content contains no user PII (MASWE-0054)
- [ ] `expo-screen-capture` active on all authenticated screens (MASWE-0055)
- [ ] No sensitive data written to external/shared storage (MASWE-0007)
- [ ] Lawn photos uploaded directly to Supabase Storage — not written to device gallery or AsyncStorage (MASWE-0007)

### MASVS-CRYPTO
- [ ] No custom crypto implemented (MASWE-0019)
- [ ] No broken algorithms (MD5, SHA-1, DES, RC4, ECB) (MASWE-0021)
- [ ] No hardcoded keys, IVs, or salts in codebase (MASWE-0013)
- [ ] `Math.random()` not used for any security purpose (MASWE-0027)

### MASVS-AUTH
- [ ] No API keys or secrets hardcoded in app bundle (MASWE-0005)
- [ ] RLS enabled on every user-scoped table (MASWE-0042)
- [ ] `service_role` key never in app bundle (MASWE-0005)
- [ ] Session cleared from SecureStore on sign-out (MASWE-0036)
- [ ] 401 response triggers auth redirect (MASWE-0038)
- [ ] `user_id` never passed from client on INSERT — derived from `auth.uid()` server-side (MASWE-0042)

### MASVS-NETWORK
- [ ] All URLs use `https://` — Zod schema rejects `http://` at startup (MASWE-0050)
- [ ] iOS `NSAllowsArbitraryLoads: false` (MASWE-0050)
- [ ] Android `cleartextTrafficPermitted: false` in Network Security Config (MASWE-0050)
- [ ] SSL certificate validation never disabled (MASWE-0052)
- [ ] No user-supplied CAs added to trust store (MASWE-0052)

### MASVS-PLATFORM
- [ ] Only necessary permissions declared in manifest (MASWE-0117)
- [ ] Permissions requested at point of use with rationale string (MASWE-0117)
- [ ] `CAMERA` permission requested only when user taps "Take a photo", with plain-English rationale shown first (MASWE-0117)
- [ ] `MEDIA_LIBRARY` permission not requested — photos bypass the device gallery entirely (MASWE-0117)
- [ ] Deep link paths validated — unrecognized paths ignored (MASWE-0058)
- [ ] `kura://progress/capture` registered in linking config and navigates to `PhotoCaptureScreen` (MASWE-0058)
- [ ] No PII or tokens written to system clipboard (MASWE-0065)
- [ ] Keyboard cache disabled on sensitive text inputs (MASWE-0055)

### MASVS-CODE
- [ ] All external/network/user input validated with Zod before use (MASWE-0079, 0081)
- [ ] No raw SQL string concatenation — Supabase parameterized queries only (MASWE-0086)
- [ ] Internal errors go to Sentry; generic message shown to user (MASWE-0087)
- [ ] `npm audit --audit-level=high` passes in CI (MASWE-0076)
- [ ] iOS target ≥ 16, Android `minSdkVersion` ≥ 31 (MASWE-0077, 0078)

### MASVS-RESILIENCE
- [ ] `debuggable: false` confirmed in production EAS build profile (MASWE-0067)
- [ ] No `__DEV__` paths active in production bundle (MASWE-0094)
- [ ] Sentry source maps uploaded separately — not bundled in app binary (MASWE-0093)
- [ ] Root/jailbreak detection active with advisory message (MASWE-0097)
- [ ] Production builds signed via EAS with APK Signature Scheme v3+ (MASTG-BEST-0006)

### MASVS-PRIVACY
- [ ] No GPS/location data collected anywhere (MASWE-0109)
- [ ] `exif: false` passed to `expo-image-picker` — GPS EXIF stripped before upload (MASWE-0109)
- [ ] No analytics or ad SDK in bundle (MASWE-0110)
- [ ] Sentry `beforeSend` strips email and IP from crash reports (MASWE-0108)
- [ ] Account deletion removes all rows and Storage objects via cascade + Edge Function (MASWE-0113)
- [ ] Account deletion Edge Function calls `storage.remove()` on `{user_id}/` in `lawn-photos` bucket (MASWE-0113)
- [ ] Privacy policy linked in Settings and App Store listing — updated to declare photo collection (MASWE-0111)
- [ ] App Store privacy nutrition label updated to declare "Photos or Videos" data type (MASWE-0112)

---

## Glossary (in-app — any term used in UI needs a tooltip)

| Term | Plain-English definition |
|---|---|
| Aeration | Poking small holes in your lawn so water and air reach the roots |
| Dethatching | Removing the dead grass layer that builds up between soil and green grass |
| Overseeding | Spreading new seed over thin or bare spots to grow thicker grass |
| Pre-emergent | Weed control applied before weeds sprout — stops them before they're visible |
| Cool-season grass | Grows best in spring and fall (60–75°F) |
| Warm-season grass | Thrives in summer heat; goes dormant (brown) in cold months |
| Dormancy | Grass temporarily stops growing and turns brown — it's not dead |
| Topdressing | Spreading a thin layer of compost over your lawn to improve the soil |
