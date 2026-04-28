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
│   └── notifications/
│       ├── hooks/useNotifications.ts
│       ├── services/notifications.service.ts
│       │   # platform split: .ios.ts / .android.ts / .ts (fallback)
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
| `NOTIFICATIONS` | At end of onboarding, with explanation shown | Weekly reminders |
| `LOCATION` | **Never** | ZIP is entered manually — no GPS |
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

- **Account deletion** triggers a Supabase Edge Function that: (1) cascade-deletes all rows in `user_profiles`, `task_completions` via `ON DELETE CASCADE` FK. (MASWE-0113)
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
  │   └── Onboarding: LocationScreen → GrassTypeScreen → PreviewScreen
  └── AppTabs        — authenticated
      ├── HomeStack:     TaskListScreen → TaskDetailScreen
      └── SettingsScreen
```

- All param lists typed in `src/types/navigation.ts` — no untyped `route.navigate()` calls
- Notification taps deep-link to `HomeStack > TaskListScreen` via registered `kura://` scheme
- All deep link paths validated against the registered scheme — unrecognized paths are silently dropped (MASWE-0058)

---

## Feature Flags

```ts
// config/features.ts
export const FEATURES = {
  STREAK_COUNTER: true,
  GLOSSARY:       false,  // in development
  PUSH_DIGEST:    true,
} as const;
```

---

## Platform Handling

| Concern | Approach |
|---|---|
| Notifications | `expo-notifications`. Register Android channels at startup. |
| Secure storage | `expo-secure-store` (Keychain iOS / EncryptedSharedPreferences Android) |
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
- Input: pass malformed ZIP codes to `zipCodeSchema.parse()` — expect `ZodError`
- Input: pass non-UUID string to `taskIdSchema.parse()` — expect `ZodError`
- Deep link: pass unrecognized scheme to linking config — assert no navigation occurs
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
- [ ] Deep link paths validated — unrecognized paths ignored (MASWE-0058)
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
- [ ] No analytics or ad SDK in bundle (MASWE-0110)
- [ ] Sentry `beforeSend` strips email and IP from crash reports (MASWE-0108)
- [ ] Account deletion removes all rows and Storage objects via cascade + Edge Function (MASWE-0113)
- [ ] Privacy policy linked in Settings and App Store listing (MASWE-0111)
- [ ] App Store privacy nutrition label matches actual data collection (MASWE-0112)

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
