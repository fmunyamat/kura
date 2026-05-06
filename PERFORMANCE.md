# Kura — Performance

- Use `FlashList` (Shopify) instead of `FlatList` for any list with 20+ items
- `useMemo` for expensive computations; `useCallback` for stable callbacks passed as props
- `React.memo` on pure presentational components that receive the same props frequently
- No anonymous functions or object literals in JSX props (new reference every render)
- Never disable Hermes
- All images via `expo-image` — lazy loading, blurhash placeholders, disk cache
- TanStack Query `staleTime`: task lists → 1 hour, user profile → 24 hours
- Use `Suspense` boundaries with skeleton loaders — never blank screens or mid-content spinners
