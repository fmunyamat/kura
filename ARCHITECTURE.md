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
│       ├── RootNavigator.tsx      # gates on auth session
│       ├── AuthStack.tsx          # unauthenticated: onboarding
│       └── AppTabs.tsx            # authenticated: Home | Settings
│
├── features/
│   ├── onboarding/
│   │   ├── screens/               # Location, GrassType
│   │   ├── components/GrassTypePicker/
│   │   ├── hooks/useOnboarding.ts
│   │   ├── services/onboarding.service.ts
│   │   └── types.ts
│   ├── tasks/
│   │   ├── screens/               # TaskList, TaskDetail
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
RootNavigator (reads Supabase session)
  ├── AuthStack      — unauthenticated
  │   └── Onboarding: Location → GrassType → PhotoCapture (before photo)
  └── AppTabs        — authenticated
      ├── HomeStack:     TaskList → TaskDetail
      ├── ProgressStack: LawnProgress → PhotoCapture
      └── SettingsScreen
```

- All param lists typed in `src/types/navigation.ts` — no untyped `route.navigate()` calls
- Notification taps deep-link to `HomeStack > TaskList` via registered `kura://` scheme
- Photo reminder notification taps deep-link to `ProgressStack > PhotoCapture` via `kura://progress/capture`
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
