# Kura — Testing

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

---

## Security-specific tests required

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
- Deep link: `kura://progress/capture` — assert navigation to `PhotoCapture`
- Logger: in production mode, assert `console.log` is never called
