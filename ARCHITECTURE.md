# Kura — Architecture

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
│       ├── RootNavigator.tsx      # gates on session + profile + has_seen_welcome
│       ├── AuthStack.tsx          # unauthenticated: sign-in via Supabase OTP
│       ├── OnboardingStack.tsx    # authenticated but no profile yet: Location → GrassType → EffortLevel → PhotoCapture
│       ├── WelcomeFlow.tsx        # profile complete but has_seen_welcome=false: 4-screen tutorial
│       └── AppTabs.tsx            # authenticated + onboarded + welcomed: Home | Settings
│
├── features/
│   ├── onboarding/
│   │   ├── screens/               # Location, GrassType, EffortLevel, PhotoCapture
│   │   ├── components/GrassTypePicker/
│   │   ├── store/useOnboardingStore.ts  # Zustand — accumulates zip/lawnSize/lat/lng/grassType across screens
│   │   ├── services/
│   │   │   ├── geocoding.service.ts    # ZIP → lat/lng via Zippopotam.us (called once at onboarding)
│   │   │   └── onboarding.service.ts   # saves complete profile to user_profiles at end of onboarding
│   │   └── types.ts
│   ├── home/
│   │   ├── screens/
│   │   │   └── HomeScreen.tsx          # Focus Card dashboard — owns focusedId state
│   │   └── components/
│   │       ├── FocusTaskRow/           # compact overview row (icon · name · meta · time pill · chevron)
│   │       ├── FocusTaskDetail/        # expanded detail (why it matters / steps / CTA)
│   │       └── CompletedTaskRow/       # struck-through row with filled check circle
│   ├── recommendations/
│   │   ├── constants/recommendationContent.ts  # maps recommendation type → icon, copy, steps
│   │   ├── hooks/
│   │   │   ├── useActiveRecommendations.ts  # TanStack Query — fetches status=pending rows joined with tasks
│   │   │   ├── useConfirmRecommendation.ts  # mutation — status → confirmed
│   │   │   └── useSnoozeRecommendation.ts   # mutation — status → snoozed + snoozed_until
│   │   ├── services/recommendations.service.ts
│   │   └── types.ts
│   ├── settings/
│   │   ├── screens/SettingsScreen.tsx  # change grass type, change effort level, "I've moved" data reset
│   │   └── hooks/useUpdateEffortLevel.ts  # (to implement) mutation — updates user_profiles.effort_level
│   ├── tasks/
│   │   ├── services/tasks.service.ts   # fetches tasks table for display metadata (estimated_minutes, etc.)
│   │   └── types.ts
│   ├── notifications/
│   │   ├── hooks/
│   │   │   ├── useNotifications.ts
│   │   │   └── usePushToken.ts    # registers device + upserts Expo push token to user_profiles
│   │   ├── services/notifications.service.ts
│   │   │   # platform split: .ios.ts / .android.ts / .ts (fallback)
│   │   └── types.ts
│   ├── welcome/
│   │   ├── screens/
│   │   │   └── WelcomeFlow.tsx        # pager container — owns currentStep (0–3)
│   │   ├── components/
│   │   │   ├── WelcomeStep1.tsx       # Welcome + "Let's go →"
│   │   │   ├── WelcomeStep2.tsx       # Today Feature + sample task card
│   │   │   ├── WelcomeStep3.tsx       # Navigation pills + live tab bar
│   │   │   ├── WelcomeStep4.tsx       # All Set + "Start Growing" (writes has_seen_welcome)
│   │   │   ├── WelcomeDots.tsx        # progress dot row
│   │   │   └── WelcomeStepLabel.tsx   # "Quick Tour · X of 4" pill
│   │   └── services/
│   │       └── welcome.service.ts     # markWelcomeSeen() — PATCH user_profiles.has_seen_welcome = true
│   └── progress-photos/
│       ├── screens/               # LawnProgress, PhotoCapture
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

**Supabase Edge Functions** live outside `src/` in the Supabase project folder:

```
supabase/
├── functions/
│   └── recommendation-engine/    # daily cron — soil temp rule eval, push notifications
│       ├── index.ts               # main orchestrator: load users → fetch weather → check rules
│       ├── weather.ts             # Open-Meteo fetching + weather_cache + soil_temp_streaks write
│       ├── rules.ts               # rule definitions keyed by type; soil temp + streak conditions
│       └── push.ts                # Expo Push API notification sender
└── migrations/
    ├── 20260511000001_recommendation_engine_tables.sql
    └── 20260511000002_reset_user_data_rpc.sql
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

## Navigation

```
RootNavigator
  ├── AuthStack          — no Supabase session
  │   └── SignIn: email input → OTP verification (Supabase magic link)
  ├── OnboardingStack    — session exists but user profile not yet created
  │   └── Location → GrassType → EffortLevel → PhotoCapture
  ├── WelcomeFlow        — profile complete but has_seen_welcome = false
  │   └── Step 1 (Welcome) → Step 2 (Today) → Step 3 (Navigation) → Step 4 (All Set)
  └── AppTabs            — profile complete and has_seen_welcome = true
      ├── HomeStack:     HomeScreen (Focus Card dashboard — single screen, no push navigation)
      ├── ProgressStack: LawnProgress → PhotoCapture
      └── SettingsScreen
```

**Auth flow:** The user enters their email, receives a one-time passcode via Supabase, and confirms it. Once the session is established, `RootNavigator` checks for an existing profile row. A missing row → `OnboardingStack`. A present row with `has_seen_welcome = false` → `WelcomeFlow`. A present row with `has_seen_welcome = true` → `AppTabs`.

**Profile gate:** `RootNavigator` queries `user_profiles` (RLS-protected, `auth.uid()`) on session change. Zustand caches the resolved state — `{ hasProfile, hasSeenWelcome }` — so the gate only queries Supabase once per session. `WelcomeFlow` is non-dismissible: no back gesture, no way to reach `AppTabs` without tapping "Start Growing" on the final screen, which calls `welcomeService.markWelcomeSeen()` and sets `hasSeenWelcome: true` in the Zustand store before `RootNavigator` re-evaluates.

- All param lists typed in `src/types/navigation.ts` — no untyped `route.navigate()` calls
- Notification taps deep-link to `kura://home` — `HomeScreen` refetches on focus so any pending recommendation card is already visible
- Recommendation deep links do not push a new screen — `HomeScreen` handles all states inline
- Photo reminder notifications deep-link to `kura://progress/capture` → `ProgressStack > PhotoCapture`
- All deep link paths validated against the registered scheme — unrecognized paths are silently dropped (MASWE-0058)

---

## Feature Flags

```ts
// config/features.ts
export const FEATURES = {
  STREAK_COUNTER:        true,
  GLOSSARY:              false,  // in development
  PUSH_DIGEST:           true,
  LAWN_PROGRESS_PHOTOS:  true,
  RECOMMENDATION_ENGINE: true,   // soil temp rule engine + RecommendationCard UI
} as const;
```

---

## Error Handling

Every error must be caught, logged with enough context to diagnose it, and — if it surfaces to the user — shown as a generic message. Silent failures are not acceptable. If something breaks and there is no Sentry event, we have no idea it happened.

### The three layers where errors must be handled

#### 1. Service layer — catch and rethrow with context

Services are the only place that touches Supabase or external APIs. Wrap every call. Log the operation name, the user ID, and a safe summary of the input. Never log the raw Supabase error object directly — it can contain query strings or row data.

```ts
// features/tasks/services/tasks.service.ts
export const tasksService = {
  async completeTask(taskId: string, userId: string): Promise<void> {
    taskIdSchema.parse(taskId); // validate input first (MASVS-CODE-4)

    const { error } = await supabase
      .from('task_completions')
      .insert({ task_id: taskId, completed_at: new Date().toISOString() });

    if (error) {
      // Log with context so Sentry shows exactly what broke and for whom.
      // userId is a non-sensitive identifier — safe to include (see SECURITY.md).
      logger.error('tasksService.completeTask failed', {
        operation: 'completeTask',
        userId,
        taskId,
        supabaseCode: error.code, // error code only — not the full message
      });
      throw new Error('completeTask failed'); // generic message propagated upward
    }
  },
};
```

Never swallow errors in services (`catch { return null }`). If the call failed, throw. Let the layer above decide how to show it.

#### 2. Hook / TanStack Query layer — handle loading, error, and empty states explicitly

Every `useQuery` and `useMutation` must handle its `isError` state. Do not leave it unhandled and let the component render stale or empty UI without explanation.

```ts
// features/tasks/hooks/useCompleteTask.ts
export const useCompleteTask = () => {
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (taskId: string) => tasksService.completeTask(taskId, userId!),
    onError: (error, taskId) => {
      // Log at the hook layer so we know which mutation triggered it.
      logger.error('useCompleteTask mutation failed', {
        operation: 'useCompleteTask',
        userId,
        taskId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
```

For queries, always destructure `isError` and handle it in the screen:

```ts
const { data, isLoading, isError } = useActiveRecommendations();

if (isError) {
  // Show the generic error UI — do not render a blank screen silently.
  return <FullScreenError message="Couldn't load your tasks. Pull to refresh." />;
}
```

#### 3. Screen / component layer — catch async handlers and form submissions

`onPress` handlers that call async functions must be wrapped in try/catch. An unhandled promise rejection in a button press shows nothing to the user and logs nothing to Sentry.

```tsx
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
    await someService.doSomething(input);
  } catch {
    // The service already logged to Sentry. The screen just needs to tell
    // the user something went wrong without exposing the internals.
    setErrorMessage('Something went wrong. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### React Error Boundary — catch rendering errors

Wrap each major feature boundary in a React Error Boundary so a rendering crash in one feature doesn't take down the whole app. The boundary logs to Sentry and shows a fallback UI.

```tsx
// shared/components/ErrorBoundary/ErrorBoundary.tsx
import * as Sentry from '@sentry/react-native';

interface State { hasError: boolean }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; context: string },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // context tells us which feature tree crashed — 'HomeTab', 'OnboardingStack', etc.
    Sentry.captureException(error, {
      extra: { context: this.props.context, componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <FullScreenError message="Something went wrong." />;
    }
    return this.props.children;
  }
}
```

Wrap each tab and each major stack at the navigator level:

```tsx
// In AppTabs or each tab screen
<ErrorBoundary context="HomeTab">
  <HomeStack />
</ErrorBoundary>
```

---

### Global unhandled rejection handler

Some async errors fall outside React's tree entirely (background syncs, push token registration). Wire up a global handler in `App.tsx` so nothing is silently dropped.

```ts
// src/app/App.tsx — call once at startup
import * as Sentry from '@sentry/react-native';

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
  });
};

// React Native exposes this on the global ErrorUtils object
if (global.ErrorUtils) {
  const previousHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
    Sentry.captureException(error, { extra: { isFatal } });
    previousHandler(error, isFatal);
  });
}
```

---

### What context to always include when logging

When you call `logger.error(...)`, the second argument must have enough detail to answer: *what operation was running, who was affected, and what input triggered it?*

| Field | Why |
|---|---|
| `operation` | Which function or mutation failed — `'tasksService.completeTask'` |
| `userId` | Which account is affected — non-PII identifier, safe to log |
| `screen` | Which screen the user was on — `'HomeTab'`, `'PhotoCapture'` |
| `supabaseCode` | Supabase error code only — never the full `.message` (may contain row data) |
| Input identifiers | IDs like `taskId`, `zipCode` (not names, emails, or sizes) |

Never log: raw Supabase error messages, JWT tokens, session objects, email addresses, user-entered text. See `SECURITY.md → MASVS-STORAGE-2` for the full list.

---

### Edge Function errors

Edge Functions return HTTP status codes. The client must handle non-2xx responses explicitly — `supabase.functions.invoke` does not throw on 4xx/5xx by default.

```ts
const { data, error } = await supabase.functions.invoke('recommendation-engine');

if (error || !data) {
  logger.error('recommendation-engine invocation failed', {
    operation: 'invokeRecommendationEngine',
    userId,
    errorMessage: error?.message,
  });
  throw new Error('recommendation-engine failed');
}
```

Inside Edge Functions themselves, wrap the main handler in try/catch and return a structured error response — never let an exception bubble up to an unformatted 500:

```ts
// supabase/functions/recommendation-engine/index.ts
Deno.serve(async (req) => {
  try {
    const result = await runEngine(req);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err) {
    console.error('[recommendation-engine] fatal error', { message: err.message });
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 });
  }
});
```

---

## Platform Handling

| Concern | Approach |
|---|---|
| Notifications | `expo-notifications`. Register Android channels at startup. |
| Secure storage | `expo-secure-store` (Keychain iOS / EncryptedSharedPreferences Android) |
| Camera / photo picker | `expo-image-picker`. Always `exif: false`. Request permission at point of use. |
| Safe areas | `react-native-safe-area-context`. Never hardcode status bar heights. |
| Keyboard | `KeyboardAvoidingView` with platform-appropriate `behavior` prop. Android with `edgeToEdgeEnabled: true` requires manual Reanimated offset — KAV receives no layout events in that mode. |
| Haptics | `expo-haptics` — silently no-ops on unsupported devices. |
| Screen capture | `expo-screen-capture` on all authenticated screens (MASVS-PLATFORM-2) |
| Platform-specific logic | `.ios.ts` / `.android.ts` file resolution — no inline `Platform.OS ===` in JSX |
