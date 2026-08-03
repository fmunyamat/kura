# Kura — Weekly Dependency Audit
**Date:** 2026-08-03  
**Auditor:** Automated (Claude Code)  
**Summary:** 28 vulnerabilities found (2 critical, 7 high, 18 moderate, 1 low). Major Expo SDK upgrade lag (54 → 57). One in-ecosystem version mismatch flagged. No copyleft licenses detected in known packages. License scan blocked by missing node_modules (needs `npm install` before next audit).

---

## 1. Security Vulnerabilities

Total: **2 critical · 7 high · 18 moderate · 1 low** across 1,212 packages.

> **Context for all findings:** Every critical and high-severity CVE below lives in **build-toolchain transitive dependencies** (Expo's Metro bundler, Babel, `@expo/cli`, etc.). None of these ship in the mobile app binary. However, they affect the **CI/CD build pipeline and local dev server**, and several are exploitable if an attacker can influence build input files.

### 🔴 CRITICAL

| Package | CVE / Advisory | Severity | Description | Fix |
|---|---|---|---|---|
| `shell-quote` ≤1.8.4 | GHSA-w7jw-789q-3m8p | Critical (8.1) | `quote()` does not escape newlines in object `.op` values → **command injection** | Transitive dep; `npm audit fix --force` or upgrade to ≥1.8.5 |
| `shell-quote` ≤1.8.4 | GHSA-395f-4hp3-45gv | High (7.5) | Quadratic-complexity DoS in `parse()` | Same fix as above |
| `tar` ≤7.5.20 | GHSA-23hp-3jrh-7fpw | Critical (7.5) | Decompression DoS via unlimited input — **out-of-memory crash** | Transitive dep; upgrade tar to ≥7.5.19 |
| `tar` ≤7.5.17 | GHSA-8x88-c5mf-7j5w | High (7.5) | Negative tar entry size → **infinite loop** in archive replace | Same fix |

`tar` and `shell-quote` are used by npm scripts and `@expo/cli` during build. They're not in the app runtime. Fix available via direct `npm audit fix`.

---

### 🟠 HIGH

| Package | Advisory | Score | Description | MASVS Impact | Direct? | Fix |
|---|---|---|---|---|---|---|
| `postcss` ≤8.5.17 | GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849 | 7.5 | **Arbitrary file read + path traversal** via attacker-controlled `sourceMappingURL` in CSS comments | MASVS-CODE-4 (information disclosure during build) | No — via `@expo/metro-config` | Requires `expo@57.0.9` (major bump) |
| `fast-uri` 3.0.0–3.1.3 | GHSA-v2hh-gcrm-f6hx, GHSA-4c8g-83qw-93j6 | 7.5 | **Host confusion** via literal backslash and failed IDN canonicalization | MASVS-NETWORK-1 (URL parsing) — low mobile runtime risk, used in schema validation tooling | No | Upgrade `fast-uri` to ≥3.1.4 |
| `ws` (multiple ranges) | GHSA-96hv-2xvq-fx4p | 7.5 | **Memory exhaustion DoS** from tiny WS fragments | None (dev server WebSocket) | No — via `@expo/cli`, `react-native`, `jsdom` | Fix available |
| `undici` ≤6.26.0 | GHSA-p88m-4jfj-68fv, GHSA-vxpw-j846-p89q | 7.5 / 5.9 | **HTTP header injection** (Set-Cookie) + **DoS via fragment count bypass** | MASVS-NETWORK-1 adjacent — dev server only | No | Upgrade `undici` to ≥6.27.0 |
| `form-data` 4.0.0–4.0.5 | GHSA-hmw2-7cc7-3qxx | 7.5 | **CRLF injection** via unescaped multipart field names | Low mobile risk — build tools only | No | Upgrade `form-data` to ≥4.0.6 |
| `js-yaml` ≤3.14.2 / 4.0.0–4.2.0 | GHSA-52cp-r559-cp3m | 7.5 | **Quadratic DoS** via YAML merge-key chains | Build tooling only | No | Upgrade `js-yaml` to ≥3.15.0 (v3) or ≥4.3.0 (v4) |
| `brace-expansion` (multiple) | GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg | 7.5 | **DoS** via exponential expansion + OOM crash | Build tooling only | No | Fix available per range |

---

### Moderate (18 findings)
All 18 moderate findings are in `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/metro-config`, `expo-constants`, `expo-linking`, `expo-router`, `expo-splash-screen`, `expo-dev-client`, `jest-expo`, `postcss` (XSS variant), `uuid`, `xcode`. The root fix for this cluster is **Expo SDK 57** (`expo@57.0.9`). Plan as a major migration task.

---

## 2. Outdated Packages

### 🟢 Patch Updates — Safe, apply now

These are within the pinned semver range in `package.json`; `npm update` will apply them.

| Package | Installed | Wanted | Notes |
|---|---|---|---|
| `expo` | 54.0.33 | 54.0.36 | Patch within SDK 54 tilde range |
| `expo-font` | 14.0.11 | 14.0.12 | Minor patch |
| `expo-linking` | 8.0.11 | 8.0.12 | Minor patch |
| `expo-router` | 6.0.23 | 6.0.24 | Minor patch |
| `react-native-safe-area-context` | 5.6.0 | 5.6.2 | Minor patch |
| `react-native-web` | 0.21.0 | 0.21.2 | Minor patch |

---

### 🟡 Minor Updates — Review changelog, apply this sprint

| Package | Installed | Available | Priority Notes |
|---|---|---|---|
| `@sentry/react-native` | 8.11.1 | 8.21.0 | **Security-relevant** — source map and capture improvements; 10 minor versions behind |
| `@supabase/supabase-js` | 2.105.4 | 2.112.0 | **Security-relevant** — auth/RLS behavior; review changelog for session handling changes |
| `@react-navigation/bottom-tabs` | 7.4.0 | 7.18.14 | Large minor delta; review for breaking behaviour changes |
| `@react-navigation/elements` | 2.6.3 | 2.9.36 | Same — part of React Navigation suite |
| `@react-navigation/native` | 7.1.8 | 7.3.14 | Same |
| `react-native-reanimated` | 4.1.1 | 4.1.7 (SDK 54) | Stay within SDK 54 compatible range (4.5.3 is SDK 57 territory) |
| `@expo/vector-icons` | 15.0.3 | 15.1.1 | Low risk minor update |

---

### 🔴 Major Updates — Create a dedicated task, needs migration planning

> **The single most important action:** Expo SDK 54 → 57 requires upgrading the entire `expo-*` package graph together. This is not a one-liner — use `npx expo install --fix` after bumping `expo` to `~57.0.0`.

| Package | Installed | Latest | Notes |
|---|---|---|---|
| **`expo` (SDK)** | `~54.0.33` | `57.0.9` | **Blocker for most CVE fixes.** Major migration — run expo upgrade guide; all expo-* must move together |
| All `expo-*` packages | 54-era versions | 57.x | Follow SDK upgrade; do not upgrade individually |
| `react-native` | 0.81.5 | 0.86.2 | Major RN release; review New Architecture changes, check react-native-screens/gesture-handler compat |
| `react-native-gesture-handler` | 2.28.0 | 3.1.0 | Breaking API changes in v3; requires gesture detector migration |
| `react-native-worklets` | 0.5.1 | 0.11.3 | Large minor jump; verify Reanimated compatibility before upgrading |

**⚠️ Version mismatch detected:** `expo-linear-gradient` is pinned at `^55.0.13` (resolves to 55.0.16) but `expo` is `~54.0.33` (resolves to 54.0.36). These are in different SDK eras. Run `npx expo install expo-linear-gradient` after installing `node_modules` to let Expo's resolver pick the correct SDK 54-compatible version.

---

## 3. License Check

**⚠️ Scan blocked — `node_modules` is not installed.**  
`npx license-checker` requires installed packages to enumerate licenses. Run `npm install` then re-run `npx license-checker --json --production` before shipping.

**Manual review of `package.json` direct dependencies:**

| Package | Known License | Status |
|---|---|---|
| `@supabase/supabase-js` | Apache-2.0 | ✅ |
| `@sentry/react-native` | MIT | ✅ |
| `react-native` | MIT | ✅ |
| `expo` (and expo-* packages) | MIT | ✅ |
| `styled-components` | MIT | ✅ |
| `zustand` | MIT | ✅ |
| `zod` | MIT | ✅ |
| `@tanstack/react-query` (not yet installed) | MIT | ✅ |
| `@react-navigation/*` | MIT | ✅ |

No copyleft licenses (GPL/LGPL/AGPL/MPL) detected in direct dependencies. **Transitive licenses are unverified until `node_modules` exists.**

---

## 4. Expo SDK Compatibility

**`expo-doctor` could not run** — `node_modules` is not installed. Run `npm install` then `npx expo-doctor` for automated compatibility checks.

**Manual assessment against SDK 54 / New Architecture (Fabric + JSI + Hermes):**

| Check | Status | Notes |
|---|---|---|
| `newArchEnabled: true` in `app.json` | ✅ | New Architecture correctly enabled |
| `NSAllowsArbitraryLoads: false` | ✅ | No cleartext traffic (MASVS-NETWORK-1) |
| `usesCleartextTraffic: false` | ✅ | Android cleartext blocked |
| `allowBackup: false` | ✅ | Prevents backup to untrusted storage (MASVS-STORAGE-1) |
| `react-native-reanimated ~4.1.1` | ✅ | Reanimated 4.x is JSI-native, no bridge required |
| `react-native-gesture-handler ~2.28.0` | ✅ | v2 supports Fabric |
| `react-native-screens ~4.16.0` | ✅ | Fabric-compatible |
| `expo-linear-gradient ^55.0.13` | ⚠️ | Pinned to 55.x but expo is 54.x — version mismatch; run `npx expo install expo-linear-gradient` to correct |
| `@react-navigation/bottom-tabs ^7.4.0` | ✅ | React Navigation 7 supports New Architecture |
| `react-native-worklets 0.5.1` | ⚠️ | Used by Reanimated internals; 0.11.3 is latest. Verify compatibility before upgrading separately — let Reanimated pull the correct version |
| `expo-image-picker` | ❌ Not installed | Listed in CLAUDE.md stack but absent from `package.json` — add when implementing photo features |
| `expo-screen-capture` | ❌ Not installed | Listed in CLAUDE.md stack but absent from `package.json` — add for screenshot prevention feature |
| `@tanstack/react-query` | ❌ Not installed | Required per MEMORY.md Phase 8 — add before implementing server state hooks |

---

## 5. Action Plan

### 🔴 Fix Now

1. **`shell-quote` command injection (CRITICAL, GHSA-w7jw-789q-3m8p)** — Run `npm audit fix` to update transitive dep. Verify after `npm install`.
2. **`tar` decompression DoS + infinite loop (CRITICAL, GHSA-23hp-3jrh-7fpw, GHSA-8x88-c5mf-7j5w)** — Run `npm audit fix` to update. Affects build pipeline/CI.
3. **Install `node_modules` (`npm install`)** — Required before any of the above, before license scan, and before `npx expo-doctor` can run.
4. **Fix `expo-linear-gradient` version mismatch** — After `npm install`, run `npx expo install expo-linear-gradient` to pin the SDK 54-compatible version.

### 🟡 This Sprint

5. **`@sentry/react-native` 8.11.1 → 8.21.0** — 10 minor versions behind. Sentry source map uploads to EAS are affected. Run `npx expo install @sentry/react-native`.
6. **`@supabase/supabase-js` 2.105.4 → 2.112.0** — Auth and RLS behavior changes. Review changelog before applying. `npm install @supabase/supabase-js@^2.112.0`.
7. **`postcss` HIGH CVEs (GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849)** — These are only fixed by upgrading to expo@57. Track as part of the SDK upgrade task below; note risk in CI environments that process external CSS.
8. **Apply patch updates** — `npm update` to pull in expo 54.0.36, expo-font 14.0.12, expo-router 6.0.24, etc.
9. **Run full license scan** — After `npm install`, run `npx license-checker --json --production --excludePrivatePackages` and verify no copyleft transitive dependencies.
10. **Install missing stack packages** — Per MEMORY.md: `expo-screen-capture`, `@tanstack/react-query`, `@tanstack/react-query-devtools` (Phase 8).

### 🟢 Backlog

11. **Expo SDK 54 → 57 migration** — Major task. Use [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk/). Upgrade in sequence: bump `expo`, run `npx expo install --fix` to realign all `expo-*` packages, then update `react-native`. This resolves 18 of the 28 CVEs automatically.
12. **`react-native` 0.81.5 → 0.86.2** — Do this as part of or immediately after the SDK 57 upgrade.
13. **`react-native-gesture-handler` 2.x → 3.x** — Breaking API migration. Requires updating all gesture code from `PanGestureHandler` → `Gesture.Pan()` pattern. Schedule as a sub-task of the RN upgrade.
14. **React Navigation minor updates** — After SDK upgrade, run `npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/elements`.
15. **`react-native-reanimated` 4.1.7 → 4.5.3** — Only after SDK 57 upgrade.
