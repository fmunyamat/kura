# Kura — Security (OWASP MASVS)

Every control maps to its MASVS category and MASWE weakness ID. All rules are mandatory.

---

## MASVS-STORAGE-1 — Sensitive data stored securely (MASWE-0002, 0006, 0036)

**What counts as sensitive in Kura:** auth tokens, Supabase JWT, user ID, ZIP code, any PII.

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

**Never persist the full Zustand state tree to AsyncStorage.** Zustand's `persist` middleware is convenient but dangerous if applied to the entire store — the auth slice (session, user, tokens) would be written to unencrypted AsyncStorage where it can be read on any rooted/jailbroken device.

```ts
// ❌ WRONG — persists session and user tokens to unencrypted AsyncStorage
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create(
  persist(
    (set) => ({ session: null, user: null, taskFilter: 'all', ... }),
    { name: 'kura-store', storage: createJSONStorage(() => AsyncStorage) },
  )
);

// ✅ CORRECT — only persist non-sensitive UI preferences; let Supabase client
//              restore the session from expo-secure-store on launch
const useUIStore = create(
  persist(
    (set) => ({ taskFilter: 'all', selectedTab: 'home' }),
    { name: 'kura-ui-prefs', storage: createJSONStorage(() => AsyncStorage) },
  )
);
// Auth state lives in a separate non-persisted store; the Supabase client
// restores the session from expo-secure-store automatically via AuthProvider
```

**Never pass session data or tokens to Sentry, Crashlytics, or any crash-reporting SDK.** Error reports are transmitted off-device and stored on third-party servers. The Sentry `beforeSend` hook in `app/providers/SentryProvider.tsx` already strips email and IP — also ensure no `console.log(session)` or `captureException(error, { extra: { session } })` calls exist anywhere.

```ts
// ❌ WRONG — attaches raw session to a Sentry error report
Sentry.captureException(err, { extra: { session, user } });

// ✅ CORRECT — log only the non-sensitive identifier
Sentry.captureException(err, { extra: { userId: user?.id, screen: 'HomeTab' } });
```

---

## MASVS-STORAGE-2 — No sensitive data in logs or backups (MASWE-0001, 0003, 0004)

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

---

## MASVS-AUTH-1 & AUTH-2 — Server-side auth and authorization (MASWE-0041, 0042)

All authentication is Supabase Auth (JWT). Authorization is enforced by RLS — **never** on the client only.

```sql
-- RLS on every user table — no exceptions
ALTER TABLE user_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"     ON user_profiles   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_completions" ON task_completions FOR ALL USING (auth.uid() = user_id);
```

Additional auth rules:
- **Never pass `user_id` from the client** on INSERT — always derive from `auth.uid()` server-side
- **Never use `service_role` key in the app bundle** — it bypasses all RLS (MASWE-0005)
- **401 from Supabase** → clear session from SecureStore → navigate to AuthStack (MASWE-0038)
- **Token refresh** is automatic via `autoRefreshToken: true`; do not implement manual refresh logic

### OAuth2 + PKCE — Required for Any Social Auth Provider

When the Google and Apple buttons in `SocialAuthButtons` are wired up, the OAuth2 flow **must use PKCE** (Proof of Key Code Exchange). Without PKCE, an intercepting app that captures the authorization code from the redirect URL can exchange it for an access token — PKCE makes the intercepted code useless without the original verifier.

**How PKCE works:**
1. App generates a `code_verifier` — a cryptographically random string
2. App computes `code_challenge = base64url(SHA256(code_verifier))`
3. App opens the authorization URL with `code_challenge` included
4. After the user approves, the provider redirects with an authorization `code`
5. App sends the original `code_verifier` alongside the `code` to exchange for tokens
6. Provider verifies that `SHA256(code_verifier) == code_challenge` before issuing tokens

Step 6 means a stolen authorization code is worthless — the attacker doesn't have the original `code_verifier`.

```ts
// ✅ CORRECT — use react-native-app-auth which implements PKCE natively
// via the platform's AppAuth-iOS / AppAuth-Android SDK
import { authorize } from 'react-native-app-auth';

const config = {
  issuer: 'https://accounts.google.com',
  clientId: 'YOUR_GOOGLE_CLIENT_ID',     // public, not a secret
  redirectUrl: 'com.kura.app:/oauth2redirect/google',
  scopes: ['openid', 'profile', 'email'],
  usePKCE: true,                          // PKCE on by default in react-native-app-auth
};

const result = await authorize(config);
// result.accessToken is now safe to pass to supabase.auth.signInWithIdToken()

// ❌ WRONG — never implement the OAuth redirect manually in a WebView.
//            You lose PKCE, and the WebView can be inspected for tokens.
// <WebView source={{ uri: googleOAuthUrl }} />
```

**Never use the implicit grant flow** (no `response_type=token` in the authorization URL). The implicit flow returns tokens directly in the redirect URL fragment, which is visible to any intercepting app and is not supported by PKCE. Supabase Auth enforces PKCE automatically for mobile OAuth flows — do not override it.

```ts
// ❌ WRONG — implicit flow embeds tokens directly in the redirect URL
const authUrl = `https://accounts.google.com/o/oauth2/auth?response_type=token&...`;

// ✅ CORRECT — authorization code flow with PKCE
const authUrl = `https://accounts.google.com/o/oauth2/auth?response_type=code&code_challenge=...&code_challenge_method=S256&...`;
```

---

## MASVS-CRYPTO-1 — No broken or custom cryptography (MASWE-0013, 0019, 0021, 0027)

Kura delegates all cryptographic operations to the platform and Supabase. No custom crypto is written.

| Operation | Delegate to | Never use |
|---|---|---|
| Password hashing | Supabase Auth (bcrypt) | MD5, SHA-1, custom hash |
| Token signing | Supabase Auth (RS256 JWT) | HS256 with hardcoded secret |
| At-rest encryption | expo-secure-store (Keychain/Keystore) | Custom AES, DES, RC4 |
| Data in transit | TLS 1.2+ (iOS ATS / Android NSC) | HTTP, TLS 1.0/1.1 |
| Random values | Platform CSPRNG only if ever needed | `Math.random()` |

No hardcoded keys, IVs, salts, or secret strings anywhere in the codebase — the Zod env schema and git pre-commit hooks catch these.

---

## MASVS-NETWORK-1 & NETWORK-2 — Secure network communication (MASWE-0050, 0052)

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

### SSL Pinning

SSL pinning embeds a copy of the server's certificate (or its public key hash) in the app bundle. On each request, the app verifies the server's certificate matches the pinned copy. This prevents man-in-the-middle attacks where an attacker installs a rogue root CA on the device (corporate proxies, malware, or a malicious MDM profile) and intercepts HTTPS traffic.

**Kura's current posture:** Standard TLS validation enforced by iOS ATS and Android NSC. SSL pinning is not yet implemented. Consider adding it before the first production release, particularly to protect the Supabase auth endpoint.

**If implementing SSL pinning**, use a library that supports public key pinning (not full certificate pinning) so the pin survives a server-side certificate renewal without an app update:

```ts
// With react-native-ssl-public-key-pinning (community library)
import { fetch as pinnedFetch } from 'react-native-ssl-public-key-pinning';

const response = await pinnedFetch('https://pdpqvojftsusqvgzccax.supabase.co/auth/v1/token', {
  method: 'POST',
  pkPinning: {
    'pdpqvojftsusqvgzccax.supabase.co': {
      // Pin the Subject Public Key Info (SPKI) hash, not the leaf cert.
      // You can get this with: openssl s_client -connect host:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
      includeSubdomains: true,
      publicKeyHashes: ['base64-encoded-sha256-of-spki-hash'],
    },
  },
});
```

**⚠️ Critical: Certificate rotation planning.** If you pin the leaf certificate instead of the public key hash, every time Supabase renews their TLS certificate (typically every 1–2 years) your app will refuse all requests until users update. Pin the **public key hash** (SPKI) instead — Supabase's key rarely rotates even when the certificate does. Always ship at least two pins (the current key + the next one) so you can rotate without an emergency app update.

```ts
// ✅ Pin two keys so a rotation doesn't break the app
publicKeyHashes: [
  'currentKeyHash=',   // active key
  'backupKeyHash=',    // next key (obtained from Supabase support or cert transparency logs)
]
```

If Supabase does rotate their key before your backup pin is set up, your app will be completely broken for all users until a new release reaches them through the App Store review process (typically 24–48 hours minimum). Here is how to plan for that scenario:

**1. Monitor certificate transparency logs.**
Every TLS certificate issued by a public CA is logged to Certificate Transparency (CT) logs, which are publicly searchable. Set up a free alert at [crt.sh](https://crt.sh) or Cert Spotter for `*.supabase.co` — you will receive an email the moment a new certificate is issued for Supabase's domain, typically days or weeks before it goes live. That is your window to ship a new backup pin before the old one stops working.

```bash
# Check current certificate fingerprints for your Supabase project manually:
openssl s_client -connect pdpqvojftsusqvgzccax.supabase.co:443 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | base64
```

**2. Use Expo EAS Update (OTA) to push pin updates without App Store review.**
Expo's OTA update system can push a new JS bundle to all users in minutes — no App Store review required. The hardcoded pin hashes live in the JS bundle, so an OTA push is enough to update them. This shrinks the "broken window" from 24–48 hours of App Store review to the time it takes EAS Update to propagate (typically under 5 minutes for active users).

```bash
# Push an updated pin hash to all production users immediately
eas update --channel production --message "Update SSL pin hashes for Supabase cert rotation"
```

The one catch: users who have not opened the app recently will get the update on next launch, not immediately. This is still far faster than an App Store release.

**3. Serve pin hashes from your own backend (most robust).**
Instead of hardcoding pins in the bundle, fetch the current valid pin hashes from a Supabase Edge Function on app launch and cache them in `expo-secure-store`. The bundle keeps a hardcoded fallback for the initial cold start (no network yet), but after launch the app always has server-fresh pins.

```ts
// On app launch — fetch current pins from your own server
const fetchCurrentPins = async (): Promise<string[]> => {
  try {
    const { data } = await supabase.functions.invoke('get-ssl-pins');
    if (data?.pins) {
      await SecureStore.setItemAsync('ssl_pins', JSON.stringify(data.pins));
      return data.pins;
    }
  } catch {
    // Fall back to whatever is cached, or the hardcoded bundle default
  }
  const cached = await SecureStore.getItemAsync('ssl_pins');
  return cached ? JSON.parse(cached) : HARDCODED_FALLBACK_PINS;
};
```

This means you can rotate pins by updating the Edge Function alone — no app release, no OTA push needed.

**4. Alert on pinning failures in Sentry before they cascade.**
Configure your SSL pinning library to report failures to Sentry rather than silently failing or crashing. A spike in pinning failures across multiple users is an early signal that a key rotation is underway that you haven't accounted for yet.

```ts
try {
  const response = await pinnedFetch(url, options);
} catch (err) {
  if (err.message?.includes('pin')) {
    // SSL pinning failure — could be a legitimate key rotation
    Sentry.captureException(err, {
      tags: { type: 'ssl_pin_failure', host: new URL(url).hostname },
    });
  }
  throw err;
}
```

Set up a Sentry alert rule: if more than 5 `ssl_pin_failure` events fire within 10 minutes, send an immediate notification to the engineering channel. That is your real-time canary.

---

## MASVS-PLATFORM-1 & PLATFORM-2 — Safe platform interaction (MASWE-0054, 0055, 0058, 0117)

**Permission minimization — only request what is strictly needed:**

| Permission | Timing | Reason |
|---|---|---|
| `NOTIFICATIONS` | At end of onboarding, with explanation shown | Weekly task reminders and photo check-in reminders |
| `CAMERA` | When user taps "Take a photo" in Progress tab, with plain-English rationale shown first | Lawn progress photos |
| `LOCATION` | **Never** | ZIP is entered manually — no GPS |
| `MEDIA_LIBRARY` | **Never** | Photos go directly to Supabase Storage — not saved to device gallery |
| `CONTACTS` | **Never** | No social features |
| `MICROPHONE` | **Never** | No audio features |

**Deep link validation** (MASWE-0058): All deep link paths must be defined in the Expo Router linking config. Unregistered paths silently do nothing.

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

**Deep links are not a secure channel — never embed sensitive data in them** (MASWE-0058):

Custom URL schemes (`kura://`) have no centralized registry. Any app installed on the device can register `kura://` and silently intercept every deep link sent to it. On iOS the OS picks one app automatically with no user warning; on Android the user sees a disambiguation dialog but may still choose the wrong app. Because of this:

```ts
// ❌ WRONG — an intercepting app receives the long-lived API key in the URL
router.push('kura://settings?apiKey=sk_live_abc123');

// ❌ WRONG — embedding a session token in a notification deep link
// The notification payload is stored on the device; the URL is logged by the OS
router.push(`kura://auth?token=${sessionToken}`);

// ✅ CORRECT — the auth callback uses short-lived Supabase tokens that are
//              exchanged immediately in app/auth/callback.tsx and never stored
// The tokens are valid for seconds, not hours, and are single-use
Linking.openURL(`kura://auth/callback#access_token=${shortLivedToken}`);
```

The magic link callback (`app/auth/callback.tsx`) is the only place in Kura where tokens travel through a deep link URL. This is acceptable because:
1. The `access_token` and `refresh_token` are generated by Supabase and are short-lived
2. `createSessionFromUrl()` exchanges them immediately — the raw URL is never logged or persisted
3. On failure the screen redirects to `/sign-in?error=link-expired` — no sensitive data in the error URL

For any future OAuth2 flows (Google Sign-In, Apple Sign-In), use **Universal Links** (`https://app.kura.com/auth/callback`) on iOS and **Android App Links** (`https://app.kura.com/auth/callback`) on Android instead of custom schemes. These are verified against a server-hosted file (`/.well-known/apple-app-site-association` / `/.well-known/assetlinks.json`) and cannot be registered by a third-party app.

```json
// /.well-known/apple-app-site-association  (served from app.kura.com)
{
  "applinks": {
    "apps": [],
    "details": [{ "appID": "TEAM_ID.com.kura.app", "paths": ["/auth/callback"] }]
  }
}
```

**Notifications must not expose PII** (MASWE-0054, MASTG-BEST-0027):
```ts
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

---

## MASVS-CODE-1 through CODE-4 — Code quality and input safety (MASWE-0076, 0079, 0086, 0087)

**All external input validated with Zod:**
```ts
// shared/utils/validation.ts
export const zipCodeSchema = z.string().regex(/^\d{5}$/, 'Must be a 5-digit US ZIP code');
export const grassTypeSchema = z.enum(['cool-season', 'warm-season', 'unknown']);
export const taskIdSchema = z.string().uuid();
export const taskCompletionSchema = z.object({
  taskId:      z.string().uuid(),
  completedAt: z.string().datetime(),
});
export const lawnPhotoSchema = z.object({
  weekNumber: z.number().int().min(0).max(52),
});
export const storagePathSchema = z
  .string()
  .regex(/^[0-9a-f-]{36}\/\d+-week-\d+\.jpg$/, 'Invalid storage path format');
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

---

## MASVS-RESILIENCE-1 through RESILIENCE-4 — Tamper resistance

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

---

## MASVS-PRIVACY-1 through PRIVACY-4 — Privacy by design (MASWE-0109, 0110, 0111, 0112, 0113, 0115)

Data minimization: collect only what is required for each feature.

| Data | Purpose | Retention | User control |
|---|---|---|---|
| ZIP code | Season detection | Until account deleted | Editable in Settings |
| Grass type | Task filtering | Until account deleted | Editable in Settings |
| Task completion timestamps | Progress tracking | Until account deleted | Deletable |
| Lawn progress photos | Visual progress timeline | Until account deleted | Deletable individually; all deleted on account deletion |
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

- **Account deletion** triggers a Supabase Edge Function that: (1) cascade-deletes all rows via `ON DELETE CASCADE` FK; (2) calls `storage.remove()` on `{user_id}/` in the `lawn-photos` bucket — Storage objects are not covered by FK cascades. (MASWE-0113)
- **Privacy policy** linked in Settings screen and App Store listing (MASWE-0111)
- **App Store privacy nutrition label** must accurately declare data collection (MASWE-0112)

---

## Orchestration Layer — Never Call Third-Party APIs Directly from the App

If Kura ever needs to call a third-party API that requires a secret key (weather data, SMS, payment processor, etc.), that call must go through a **Supabase Edge Function**, not from the app bundle directly. Any secret embedded in the app binary can be extracted by anyone who downloads the `.ipa` or `.apk`.

```ts
// ❌ WRONG — secret key is bundled in the app and extractable
const weatherData = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?zip=${zip}&appid=SECRET_KEY_HERE`
);

// ✅ CORRECT — app calls your own Edge Function with the user's JWT;
//              the Edge Function holds the third-party secret server-side
const weatherData = await supabase.functions.invoke('get-weather', {
  body: { zip },
  // Supabase automatically attaches the user's JWT in the Authorization header
});
```

```ts
// supabase/functions/get-weather/index.ts  (runs server-side, secret never leaves server)
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  // Verify the caller is authenticated before touching the third-party API
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const { zip } = await req.json();
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?zip=${zip}&appid=${Deno.env.get('WEATHER_API_KEY')}`,
  );
  return new Response(await response.text(), { headers: { 'Content-Type': 'application/json' } });
});
```

Rule: if you need to set an environment variable for a secret that is NOT `EXPO_PUBLIC_*`, it belongs in an Edge Function, not the app. `EXPO_PUBLIC_*` values are intentionally public (the Supabase anon key is rate-limited and RLS-protected by design). Private keys with billing or admin access must never leave the server.

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
- [ ] `kura://progress/capture` registered in linking config and navigates to `PhotoCapture` (MASWE-0058)
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
