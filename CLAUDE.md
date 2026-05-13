# Kura — CLAUDE.md

Beginner lawn care app. Target audience: People with zero lawn experience. Every decision prioritizes simplicity and plain language over feature depth. If a beginner has to ask "what does this mean?", we've failed.

---

## Session Memory

At the start of every new session, read `MEMORY.md` and resume from where we left off.

Throughout the session, keep `MEMORY.md` updated in real time — log every task started, decision made, problem hit, and what's next. Write enough detail that if the computer dies mid-session, reading `MEMORY.md` alone is enough to pick up exactly where we stopped.

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
