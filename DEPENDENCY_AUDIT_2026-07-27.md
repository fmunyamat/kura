# Kura — Weekly Dependency Audit
**Date:** 2026-07-27  
**Summary:** 11 issues found — 2 CRITICAL CVEs (both npm-fixable), 7 HIGH CVEs (6 npm-fixable, 1 requires major Expo upgrade), 3 copyleft licence flags, Expo SDK 57 available as major upgrade target.

---

## 1. Security Vulnerabilities

Total: **28 vulnerabilities** (1 low · 18 moderate · 7 high · 2 critical)  
All flagged packages are **transitive dependencies** — none are direct imports.

---

### 🔴 CRITICAL

#### `shell-quote` ≤1.8.3 → fix: 1.8.5+
- **GHSA-w7jw-789q-3m8p** — `quote()` does not escape newlines in `.op` object values, enabling shell injection. CVSS 8.1.
- **GHSA-395f-4hp3-45gv** — Quadratic-complexity DoS in `parse()`. CVSS 7.5.
- **Dependency chain:** `react-native` → `react-devtools-core` → `shell-quote`
- **Fix:** `npm audit fix` (no breaking changes)
- **MASVS note:** Shell injection in build-time tooling; does not run on-device, but exploitable in CI pipelines or local dev environments.

#### `tar` ≤7.5.13 → fix: 7.5.21+
- **GHSA-vmf3-w455-68vh** — PAX size override causes file smuggling (file write to arbitrary path during extraction).
- **GHSA-w8wr-v893-vjvp** — PAX numeric path type confusion → process crash.
- **GHSA-23hp-3jrh-7fpw** — Decompression/parse DoS via unlimited input.
- **GHSA-8x88-c5mf-7j5w** — Negative tar entry size → infinite loop.
- **GHSA-gvwx-54wh-qm9j** — NUL byte in PAX path causes uncaught exception.
- **GHSA-r292-9mhp-454m** — Stack-overflow DoS via crafted long-path archive.
- **Dependency chain:** `expo` → `@expo/cli` → `tar`
- **Fix:** `npm audit fix` (no breaking changes)

---

### 🟠 HIGH

#### `postcss` ≤8.5.17 → fix requires Expo SDK 57
- **GHSA-qx2v-qp2m-jg93** — XSS via unescaped `</style>` in CSS Stringify output.
- **GHSA-6g55-p6wh-862q** — Arbitrary file read via attacker-controlled `sourceMappingURL` in CSS.
- **GHSA-r28c-9q8g-f849** — Path traversal via previous source map auto-loading.
- **Dependency chain:** `expo` → `@expo/metro-config` → `postcss`
- **Fix:** Requires upgrading `expo` to 57.0.8 (semver-major). Cannot be patched in-place within SDK 54.
- **MASVS note:** Build-time only, not shipped in app bundle. Risk is to developer machines and CI, not end users.

#### `undici` ≤6.26.0 → fix: 6.27.0+
- **GHSA-p88m-4jfj-68fv** — HTTP header injection via Set-Cookie percent-decoding (CVSS 5.9).
- **GHSA-vxpw-j846-p89q** — WebSocket DoS via fragment count bypass (CVSS 7.5).
- **GHSA-35p6-xmwp-9g52** — HTTP response queue poisoning via keep-alive socket reuse.
- **Dependency chain:** transitive build tool
- **Fix:** `npm audit fix`

#### `ws` — multiple versions affected
- **GHSA-58qx-3vcg-4xpx** — Uninitialized memory disclosure (CVSS 4.4).
- **GHSA-96hv-2xvq-fx4p** — Memory exhaustion DoS via tiny fragments (CVSS 7.5).
- **Fix:** `npm audit fix`

#### `brace-expansion` ≤5.0.7
- **GHSA-jxxr-4gwj-5jf2** — Large numeric range defeats `max` DoS protection (CVSS 6.5).
- **GHSA-3jxr-9vmj-r5cp** — Exponential-time expansion → DoS (CVSS 5.3).
- **GHSA-mh99-v99m-4gvg** — Out-of-memory crash via unbounded expansion.
- **Fix:** `npm audit fix`

#### `js-yaml` ≤3.14.2 and 4.0.0–4.2.0
- **GHSA-h67p-54hq-rp68** — Quadratic-complexity DoS in merge-key handling (CVSS 6.5).
- **GHSA-52cp-r559-cp3m** — YAML merge-key chains force quadratic CPU consumption.
- **Fix:** `npm audit fix`

#### `form-data` 4.0.0–4.0.5
- **GHSA-hmw2-7cc7-3qxx** — CRLF injection via unescaped multipart field names and filenames.
- **Fix:** `npm audit fix`

#### `fast-uri` 3.0.0–3.1.3
- **GHSA-v2hh-gcrm-f6hx** — Host confusion via literal backslash authority delimiter.
- **GHSA-4c8g-83qw-93j6** — Host confusion via failed IDN canonicalization.
- **Fix:** `npm audit fix`

---

### Action for CVE section

Run once to fix all patchable vulns (shell-quote, tar, undici, ws, brace-expansion, js-yaml, form-data, fast-uri):
```sh
npm audit fix
```
The `postcss` HIGH CVEs require Expo SDK 57 and cannot be fixed with `npm audit fix` alone.

---

## 2. Outdated Packages

### Patch Updates — safe, apply now
| Package | Current | Wanted |
|---|---|---|
| `expo` | 54.0.34 | 54.0.36 |
| `expo-font` | 14.0.11 | 14.0.12 |
| `expo-linear-gradient` | 55.0.13 | 55.0.16 |
| `expo-router` | 6.0.23 | 6.0.24 |
| `eslint` | 9.39.4 | 9.39.5 |
| `styled-components` | 6.4.1 | 6.4.4 |
| `zustand` | 5.0.13 | 5.0.14 |
| `react-test-renderer` | 19.1.0 | 19.2.8 |
| `jest-expo` | 55.0.17 | 55.0.20 |

Apply with: `npm update`

### Minor Updates — review changelog, apply this sprint
| Package | Current | Latest | Notes |
|---|---|---|---|
| `@react-navigation/bottom-tabs` | 7.15.10 | 7.18.14 | — |
| `@react-navigation/elements` | 2.9.15 | 2.9.36 | — |
| `@react-navigation/native` | 7.2.2 | 7.3.14 | — |
| `@sentry/react-native` | 8.11.1 | 8.20.0 | **Security-relevant** — source map upload compatibility; review release notes before applying |
| `@supabase/supabase-js` | 2.105.4 | 2.110.8 | **Security-relevant** — check for RLS or auth behaviour changes in changelog |
| `react-native-reanimated` | 4.1.7 | 4.5.3 | New Architecture — low risk |
| `react-native-safe-area-context` | 5.6.2 | 5.8.0 | — |
| `react-native-screens` | 4.16.0 | 4.26.2 | — |
| `react-native-web` | 0.21.0 | 0.21.2 | — |

### Major Updates — create dedicated tasks, needs migration planning
| Package | Current | Latest | Risk |
|---|---|---|---|
| `expo` (SDK upgrade) | 54.0.x | 57.0.8 | **High** — full SDK migration, all `expo-*` packages must be updated together; run `npx expo install --fix` after upgrading |
| All `expo-*` packages | SDK 54 | SDK 57 | Must move together with `expo` SDK upgrade |
| `react-native` | 0.81.5 | 0.86.0 | High — RN 0.86 may include API changes |
| `react-native-gesture-handler` | 2.28.0 | 3.1.0 | High — v3 has breaking API changes to gesture composition |
| `react-native-worklets` | 0.5.1 | 0.11.3 | Medium — peer dep with reanimated; upgrade together |
| `typescript` | 5.9.3 | 7.0.2 | Medium — TypeScript 7 removes some TS 5 APIs |
| `jest` / `babel-jest` | 29.7.0 | 30.4.x | Medium — Jest 30 has config and API changes |
| `eslint` (major) | 9.39.4 | 10.8.0 | Low — dev tooling only |
| `@testing-library/react-native` | 13.3.3 | 14.0.1 | Medium — v14 has breaking changes to `render` and `userEvent` API |
| `eslint-config-expo` | 10.0.0 | 57.0.0 | Must follow expo SDK upgrade |

---

## 3. Licence Check

### 🔴 Copyleft Blockers

| Package | Licence | Dependency chain | Notes |
|---|---|---|---|
| `lightningcss@1.32.0` | **MPL-2.0** | `expo` → `@expo/metro-config` → `lightningcss` | Mozilla Public Licence is weak copyleft. Used at Metro bundle time only — not shipped in the app binary. Verify this is build-tool-only before releasing. |
| `lightningcss-linux-x64-gnu@1.32.0` | **MPL-2.0** | Same chain (native binary for Linux) | Platform-specific native binding of lightningcss. Same caveat applies. |
| `lightningcss-linux-x64-musl@1.32.0` | **MPL-2.0** | Same chain | — |
| `node-forge@1.4.0` | **BSD-3-Clause OR GPL-2.0** | `expo` → `@expo/cli` → `node-forge` | The OR licence lets downstream consumers choose. As a consumer, select BSD-3-Clause. Flag to legal for sign-off. |

**Recommended action:** Confirm with legal (or the app store review team) that `lightningcss` is never bundled into the shipped IPA/APK — only used during Metro compilation. If that holds, the MPL-2.0 copyleft obligation does not attach to the app binary. The `node-forge` BSD-3-Clause option should be fine; document the selection.

### ✅ Everything else
All other production dependencies carry MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, 0BSD, or CC0-1.0 licences. No issues.

---

## 4. Expo SDK Compatibility

**Installed SDK:** 54.0.0 (`expo@54.0.34`)  
**New Architecture:** Enabled (`newArchEnabled: true` in app.json) ✅  
**Latest available SDK:** 57.0.8

### Package sync check

All `expo-*` packages resolve to their correct SDK 54 versions (wanted === current for all). One minor anomaly:

| Package | Installed | Expected for SDK 54 | Status |
|---|---|---|---|
| `expo-linear-gradient` | 55.0.13 | ~14.x (SDK 54 canonical) | ⚠️ One SDK version ahead — may still work, but worth verifying with `npx expo install expo-linear-gradient` |

### expo-doctor
`expo-doctor` could not complete — it failed during `expo config --json --full` (the `--full` flag triggers plugin evaluation, which may require native build toolchain in this environment). Manual inspection of `app.json` confirms:
- `newArchEnabled: true` ✅
- `NSAllowsArbitraryLoads: false` (iOS ATS on) ✅ — MASVS-NETWORK-1
- `usesCleartextTraffic: false` (Android cleartext off) ✅ — MASVS-NETWORK-1
- `allowBackup: false` ✅

### New Architecture (Fabric/JSI) compatibility

| Package | Version | New Arch status |
|---|---|---|
| `react-native-reanimated` | 4.1.7 | ✅ Fabric native |
| `react-native-gesture-handler` | 2.28.0 | ✅ Fabric native |
| `react-native-screens` | 4.16.0 | ✅ Fabric native |
| `react-native-safe-area-context` | 5.6.2 | ✅ Fabric native |
| `react-native-worklets` | 0.5.1 | ✅ JSI worklets |
| `react-native-device-info` | 15.0.2 | ✅ New Arch supported |
| `styled-components/native` | 6.4.1 | ✅ JS-only, no bridge |
| `zustand` | 5.0.13 | ✅ JS-only |
| `@supabase/supabase-js` | 2.105.4 | ✅ JS-only |

**No New Architecture blockers found.**

---

## 5. Prioritised Action Plan

### 🔴 Fix now

1. **Run `npm audit fix`** — patches shell-quote (CRITICAL), tar (CRITICAL), undici, ws, brace-expansion, js-yaml, form-data, fast-uri in one command. No breaking changes expected.

2. **Legal sign-off on lightningcss (MPL-2.0)** — confirm it is Metro build-tool only and not shipped in the app binary. If it is bundled, escalate immediately as a licence blocker.

3. **Verify `node-forge` licence choice** — document that the project elects BSD-3-Clause (not GPL-2.0) in a `LICENSES.md` or legal register.

### 🟡 This sprint

4. **Update `@sentry/react-native` to 8.20.0** — 9 minor versions behind; source map upload compatibility at risk.

5. **Update `@supabase/supabase-js` to 2.110.8** — 5 minor versions behind; may contain auth/RLS bug fixes relevant to MASVS-AUTH-2.

6. **Update `@react-navigation/*`** to latest 7.x — patch the bottom-tabs, elements, and native packages together.

7. **Patch `expo` within SDK 54** (`54.0.34` → `54.0.36`) and any other in-range patches from the table above.

8. **Investigate `expo-linear-gradient@55.x`** with `npx expo install expo-linear-gradient` to confirm SDK 54 compatibility or correct the version.

9. **Re-run `npx expo-doctor`** in a full dev environment (or on a local machine with Xcode/Android Studio) to get a clean compatibility report.

### 🟢 Backlog

10. **Expo SDK 54 → 57 migration** — plan as a dedicated sprint. Use `npx expo install --fix` to align all `expo-*` packages after bumping `expo`. This also resolves the postcss HIGH CVEs currently unfixable in SDK 54.

11. **`react-native` 0.81.5 → 0.86.0** — do together with Expo SDK upgrade; coordinate with RN release notes.

12. **`react-native-gesture-handler` 2.x → 3.x** — breaking API changes in gesture composition; audit all gesture handlers before upgrading.

13. **TypeScript 5 → 7** — review breaking changes; likely straightforward but test CI.

14. **Jest 29 → 30 + `@testing-library/react-native` 13 → 14** — update together; both have API surface changes.

---

*Report generated automatically by scheduled dependency audit — 2026-07-27.*
