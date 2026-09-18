# Kura — CLAUDE.md

Beginner lawn care app. Target audience: People with zero lawn experience. Every decision prioritizes simplicity and plain language over feature depth. If a beginner has to ask "what does this mean?", we've failed.

---

## Session Memory

At the start of every new background or foreground ssession, keep `MEMORY.md` in the project root updated in real time — log every task started, decision made, problem hit, and what's next. Write enough detail that if the computer dies mid-session, reading `MEMORY.md` alone is enough to pick up exactly where we stopped.

At the end of every completed task, ask: **"Do you want to keep or erase the contents of MEMORY.md?"**

---

## Git Workflow

- Before making edits, create a descriptive feature branch (e.g., `feat/sign-in-ui`, `docs/remove-camera-section`)
- Never edit directly on main
- Communicate clearly when working in a git worktree and state the worktree path upfront

---

## Reference Docs

| Topic | File |
|---|---|
| Architecture, folder structure, components, navigation | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Styling, theme tokens, tablet scaling | [DESIGN.md](./DESIGN.md) |
| Security (OWASP MASVS), secrets, compliance checklist | [SECURITY.md](./SECURITY.md) |
| Data model, lawn progress photos feature | [FEATURES.md](./FEATURES.md) |
| Testing strategy and required security tests | [TESTING.md](./TESTING.md) |
| Performance rules | [PERFORMANCE.md](./PERFORMANCE.md) |
| In-app glossary (UI tooltip copy) | [GLOSSARY.md](./GLOSSARY.md) |

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
- **No `React.FC`.** Type props directly in the function signature instead. Use: `export const MyComponent = ({ prop }: MyProps) => { ... }` — never `React.FC<MyProps>`.
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

## Testing

Write tests for any code that is critical to the app working correctly. "Critical" means: if this breaks silently, a user loses data, can't sign in, sees wrong information, or the core lawn-care loop stops working.

**Always test:**
- Auth flows — magic link submission, OTP verification, session routing (new user → onboarding, returning user → tabs)
- Service functions that read or write to Supabase — verify the right query runs and errors are handled
- Routing guards — unauthenticated users can't reach protected screens; authenticated users skip sign-in
- Any function that makes a routing decision based on user state (e.g. `hasCompletedOnboarding`)
- Recommendation logic — wrong triggers mean users get bad lawn advice
- Zod validation schemas — ensure invalid input is rejected before it reaches the service layer

**Don't bother testing:**
- Styled-components (visual output — test with eyes, not assertions)
- Simple display components with no logic
- Wrappers that just pass props through

**Test stack:** Jest + React Native Testing Library for unit/integration. Detox for E2E flows (sign-in, onboarding). Mock Supabase at the service boundary — never hit the real DB in unit tests.

---

## Implementation vs Planning
- When the user asks to 'build', 'implement', or 'create' a UI, go directly to implementation
- Do NOT invoke brainstorming/planning skills or ask clarifying questions unless the request is ambiguous
- Only plan when explicitly asked to 'design', 'brainstorm', or 'plan'
- Default to UI-only scope; do NOT install state management or backend packages unless asked

---

## Code Style & Readability

These rules exist because the codebase is actively being debugged and extended — comments are a first-class tool here, not noise.

### Comment everything — in plain English

Write comments as if explaining to someone who has never seen this code before. Use everyday words, no jargon. Every comment must explain **how** the code works, not just name what it is.

**Every file starts with a top-of-file summary.** Before any import, add a short block comment (3–6 lines) that a non-technical teammate could read and understand what the file is for. This applies to every file that holds code — screens, components, hooks, services, stores, barrels (`index.tsx` re-exports), Expo Router route files and `_layout.tsx` files, config, and utils. No exceptions for "it's just a one-liner" — a barrel file gets a short summary explaining what it re-exports and why; a route file gets a summary explaining what screen it maps to.

The summary should cover, in plain words:
- What the file is (a screen, a reusable component, a service, a store, a route, etc.)
- What it draws or does, and when it runs
- How it fits into the surrounding feature (what calls it, what it calls)

```tsx
// The sign-in screen — the whole logged-out entry point of the app. It stitches
// the two auth steps together into one sliding, two-panel experience: the email
// form (OtpRequestForm) on the left and the 6-digit code entry (OtpVerifyPanel)
// on the right. This screen owns the shared state between them — the email being
// typed, whether a code has been sent, error messages, and the keyboard state —
// and it drives the horizontal slide animation between panels. The actual
// talking-to-Supabase work is delegated to authService.

import { Image } from 'expo-image';
...
```

```tsx
// Barrel file for the CtaButton component. Its only job is to re-export the
// button from one tidy path, so other files can write
// `import { CtaButton } from '@/src/shared/components/CtaButton'` instead of
// reaching all the way into the CtaButton.tsx file. Nothing here draws to the
// screen — it just forwards the real component along.

export { CtaButton } from './CtaButton';
```

**Then, comment every block inside the file.** Add a comment on:

- **Every component** — describe what it draws on screen and how it behaves when the user interacts with it.
- **Every hook** — explain what it tracks, what triggers it, and what it hands back to the component.
- **Every service function** — describe the database or API call it makes, what data goes in, and what comes back.
- **Every styled-component** — explain its visual role and any behaviour-driven styles (e.g. why opacity changes on a certain prop). No styled-component is left without a one-line comment, even simple layout wrappers (`flex: 1`, `width: 100%`) — say what it's a wrapper *for*.
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
```

This is not a one-time cleanup pass — it applies to every new file and every new block added from now on. When editing an existing file that's missing its top-of-file summary, add one as part of the edit rather than leaving it out.

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
