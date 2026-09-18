// Shared type definitions for the onboarding flow. These describe the *shape* of
// the data onboarding screens pass around — they don't do anything at runtime,
// they just let TypeScript catch mistakes (like a typo'd field name) before the
// app ever runs. Keeping them in one file means every onboarding screen agrees
// on what the data looks like.

// SignInState — the two things we track while the user is signing in: the email
// they've typed so far, and whether they've hit submit yet (used to show the
// "check your inbox" state).
export interface SignInState {
  email: string;
  submitted: boolean;
}

// GrassTypeList — the only three answers we accept for "what kind of grass do
// you have?". Cool-season and warm-season are the two real categories; "unknown"
// is the escape hatch for beginners who genuinely don't know yet.
export type GrassTypeList = 'cool-season' | 'warm-season' | 'unknown';
