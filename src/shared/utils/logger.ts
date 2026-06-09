import * as Sentry from '@sentry/react-native';

// logger — production-safe logging utility.
// In development: writes to the console so engineers can see output in Metro.
// In production: routes errors to Sentry for remote monitoring. console.log
// calls are eliminated by Hermes dead-code elimination in release builds.
//
// NEVER log PII (email, ZIP, session tokens) through this utility.
// Safe to log: operation names, non-sensitive IDs (user_id, task_id),
// Supabase error codes. See SECURITY.md MASVS-STORAGE-2 for the full list.
export const logger = {
  // debug — low-priority info only visible during development.
  // Stripped entirely in production builds.
  debug: (msg: string, data?: unknown) => {
    if (__DEV__) {
      console.log(`[Kura] ${msg}`, data);
    }
  },

  // error — records failures. In dev, logs to console so the stack is visible.
  // In production, sends to Sentry so the team is alerted automatically.
  // Callers must pass only safe, non-PII context (see SECURITY.md).
  error: (msg: string, data?: unknown) => {
    if (__DEV__) {
      console.error(`[Kura] ${msg}`, data);
    } else {
      Sentry.captureException(new Error(msg), { extra: { data } });
    }
  },
};
