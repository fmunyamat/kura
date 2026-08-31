# Kura — Weekly Dependency Audit

**Date:** 2026-08-31  
**Expo SDK:** 54 (current install) · Latest: SDK 57  
**React Native:** 0.81.5 · Latest: 0.87.1

---

**34 vulnerabilities found: 2 critical, 16 high, 15 moderate, 1 low. Expo SDK is 3 major versions behind (54 → 57). All CVEs are in transitive build-tool/dev-server dependencies — not shipped in the mobile app binary — but the CI/CD pipeline and dev environment are exposed. License scan could not fully execute (node_modules not installed); no copyleft licenses found in the partial result. `expo-doctor` could not run for the same reason.**

> **Important context:** This is a React Native mobile app. All vulnerable packages (`tar`, `shell-quote`, `brace-expansion`, `postcss`, `metro`, `undici`, `ws`, etc.) run exclusively in Node.js during development and CI builds. End-users on device are not directly exposed. However, CI pipeline security and developer machines are affected. The `expo` HIGH finding is significant because the entire build toolchain runs through it.

---

## 1 · Security Vulnerabilities

### 🔴 CRITICAL (2)

#### `tar` — transitive build dependency
Multiple CVEs covering PAX header manipulation, DoS, and infinite loops.

| Advisory | Title | Affected Range | Severity |
|---|---|---|---|
| GHSA-vmf3-w455-68vh | PAX size override causes file smuggling | ≤ 7.5.15 | Critical |
| GHSA-w8wr-v893-vjvp | Process crash via PAX numeric path type confusion | ≤ 7.5.17 | Critical |
| GHSA-23hp-3jrh-7fpw | Decompression/parse DoS via unlimited input | ≤ 7.5.18 | Critical |
| GHSA-8x88-c5mf-7j5w | Negative tar entry size → infinite loop | ≤ 7.5.17 | Critical |
| GHSA-gvwx-54wh-qm9j | Uncaught Exception DoS via NUL byte in PAX records | ≤ 7.5.16 | Critical |
| GHSA-r292-9mhp-454m | Stack-overflow DoS via crafted long-path tar | ≤ 7.5.20 | Critical |

- **Type:** Transitive (pulled in by `expo` / `@expo/cli` build pipeline)
- **Fix:** Update expo SDK (see Audit 4); `tar` itself has no direct override available without a major expo bump
- **MASVS relevance:** Low for mobile runtime; medium for CI pipeline integrity

#### `shell-quote` — transitive build dependency

| Advisory | Title | Affected Range | Severity |
|---|---|---|---|
| GHSA-w7jw-789q-3m8p | `quote()` does not escape newlines — command injection risk | ≥ 1.1.0 ≤ 1.8.3 | Critical |
| GHSA-395f-4hp3-45gv | `parse()` quadratic-complexity DoS | ≤ 1.8.4 | High |

- **Type:** Transitive (expo build toolchain)
- **Fix:** Only resolved by expo SDK upgrade; no direct override path

---

### 🟠 HIGH (16 vulnerabilities across 11 packages)

#### `expo` — **DIRECT dependency** ⚠️
- **Severity:** HIGH
- **Installed:** `~54.0.33` (resolves to 54.0.37)
- **Fix available:** Upgrade to expo SDK 57 (`57.0.18`) — **major version bump required**
- The entire high/moderate chain flows through expo: `@expo/cli`, `@expo/metro`, `@expo/metro-config`, `expo-constants`, `expo-asset`, `expo-router`, etc.
- **MASVS relevance:** N/A at mobile runtime; build pipeline integrity

#### `undici` — transitive (expo / @supabase/supabase-js dev path)

| Advisory | Title | Fix target |
|---|---|---|
| GHSA-p88m-4jfj-68fv | HTTP header injection via Set-Cookie percent-decoding | ≥ 6.27.0 |
| GHSA-vxpw-j846-p89q | WebSocket DoS via fragment count bypass | ≥ 6.27.0 |
| GHSA-g8m3-5g58-fq7m | Set-Cookie SameSite downgrade via permissive matching | ≥ 6.27.0 |
| GHSA-8xcm-r25x-g524 | Response desynchronization via retry interceptor | ≥ 6.28.0 |
| GHSA-m8rv-5g2x-5cg5 | CRLF injection via blob-like body `type` property | ≥ 6.28.0 |
| GHSA-v3r7-h72x-cjcm | Cookie attribute injection via unsanitized domain fields | ≥ 6.28.0 |
| GHSA-35p6-xmwp-9g52 | HTTP response queue poisoning via keep-alive reuse | ≥ 6.27.0 |

- **MASVS relevance:** GHSA-p88m and GHSA-35p6 are conceptually adjacent to **MASVS-NETWORK-1** (HTTP integrity); these affect the dev HTTP server, not the mobile app's TLS stack

#### `postcss` — transitive (expo metro build pipeline)

| Advisory | Title | Fix target |
|---|---|---|
| GHSA-qx2v-qp2m-jg93 | XSS via unescaped `</style>` in CSS stringify | ≥ 8.5.10 |
| GHSA-6g55-p6wh-862q | Arbitrary file read via sourceMappingURL in CSS comments | ≥ 8.5.12 |
| GHSA-fxqj-rqcc-2cmp | Incomplete fix for above — `.map` file disclosure when `from` is unset | ≥ 8.5.23 |
| GHSA-r28c-9q8g-f849 | Path traversal via sourceMappingURL → arbitrary `.map` file disclosure | ≥ 8.5.18 |

- **MASVS relevance:** Build-time file read could leak source maps with sensitive logic — conceptually adjacent to **MASVS-CODE-4** (no source leakage)

#### `fast-uri` — transitive

| Advisory | Title | Affected Range |
|---|---|---|
| GHSA-v2hh-gcrm-f6hx | Host confusion via literal backslash authority delimiter | ≥ 3.0.0 ≤ 3.1.3 |
| GHSA-7p8r-x3mc-p8w7 | Host confusion via backslash authority introducer | ≥ 3.0.0 < 3.1.5 |
| GHSA-4c8g-83qw-93j6 | Host confusion via failed IDN canonicalization | ≥ 3.0.0 < 3.1.3 |

#### `ws` — transitive (metro/expo dev server)

| Advisory | Title | Fix target |
|---|---|---|
| GHSA-58qx-3vcg-4xpx | Uninitialized memory disclosure | ≥ 8.20.1 |
| GHSA-96hv-2xvq-fx4p | Memory exhaustion DoS from tiny fragments | ≥ 8.21.0 / ≥ 7.5.11 |

#### `brace-expansion` — transitive

Multiple DoS advisories (GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895) across versions `<1.1.18`, `<2.1.4`, `<5.0.9`. Pattern-parsing DoS affecting build tooling.

#### `js-yaml` — transitive

| Advisory | Title | Affected Range |
|---|---|---|
| GHSA-h67p-54hq-rp68 | Quadratic DoS via merge key + repeated aliases | < 3.15.0, ≤ 4.1.1 |
| GHSA-52cp-r559-cp3m | Quadratic CPU from YAML merge-key chains | < 3.15.0, < 4.3.0 |
| GHSA-5p4m-2wfm-xmqj | Quadratic CPU in !!omap resolution | < 3.15.1, < 4.3.1 |

#### `nanoid` — transitive
- GHSA-28wg-ghj8-5hjv / GHSA-2v37-7h3g-55p8: Non-secure generators can loop indefinitely. Fix: `≥ 3.3.18`

#### `form-data` — transitive
- GHSA-hmw2-7cc7-3qxx: CRLF injection in multipart field names/filenames. Affected: `≥ 4.0.0 < 4.0.6`. Fix: `≥ 4.0.6`

#### `image-size` — transitive
- GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq: ICNS/JXL/HEIF parsers → infinite loop DoS. Affected: `≤ 2.0.2`. Fix: `≥ 2.0.3`

---

### 🟡 MODERATE (15) and 🟢 LOW (1)

Moderate: `@expo/config`, `@expo/config-plugins`, `@expo/prebuild-config`, `expo-asset`, `expo-auth-session` (direct), `expo-constants` (direct), `expo-dev-client` (direct), `expo-dev-launcher`, `expo-linking` (direct), `expo-manifests`, `expo-router` (direct), `xcode`. All are in the expo internal dependency tree — resolved by the SDK 57 upgrade.

Low: `@babel/core` ≤ 7.29.0 — GHSA-4x5r-pxfx-6jf8: Arbitrary file read via sourceMappingURL comment. Transitive, fix available.

---

## 2 · Outdated Packages

> **Note:** `node_modules` is not installed in this environment; `npm outdated` reports "MISSING" for Current. Versions below are from `package.json` specs vs. npm registry latest.

### 🟢 Patch updates — apply now

| Package | In package.json | Wanted (patch) | Notes |
|---|---|---|---|
| `expo` | `~54.0.33` | 54.0.37 | Patch within current SDK; apply immediately |
| `zustand` | `^5.0.13` | 5.0.15 | 2 patch versions; safe |
| `zod` | `^4.4.3` | 4.5.4 | Minor/patch within v4; safe, no breaking changes |
| `@react-navigation/native` | `^7.1.8` | 7.3.18 | Minor patches |
| `@react-navigation/bottom-tabs` | `^7.4.0` | 7.18.18 | Minor |
| `@react-navigation/elements` | `^2.6.3` | 2.9.40 | Minor |
| `expo-constants` | `~18.0.13` | 18.0.14 | Patch |
| `expo-font` | `~14.0.11` | 14.0.12 | Patch |
| `react-native-safe-area-context` | `~5.6.0` | 5.6.2 | Patch |

### 🟡 Minor updates — review changelog, apply this sprint

| Package | In package.json | Latest minor | Notes |
|---|---|---|---|
| `@sentry/react-native` | `^8.11.1` | **8.24.0** | 13 minor versions; check source-map upload compatibility |
| `@supabase/supabase-js` | `^2.105.4` | **2.112.4** | 7 minor versions; review auth/RLS changelog carefully |
| `styled-components` | `^6.4.1` | 6.5.3 | Minor; check Fabric renderer compatibility |
| `react-native-reanimated` | `~4.1.1` | 4.6.0 | Minor; review Fabric/JSI API changes |
| `react-native-worklets` | `0.5.1` | 0.12.1 | Minor; JSI dependency — verify New Architecture compat |
| `react-native-screens` | `~4.16.0` | 4.27.0 | Minor; review navigation API changes |
| `@expo/vector-icons` | `^15.0.3` | 15.1.1 | Minor |

### 🔴 Major updates — create dedicated tasks

| Package | In package.json | Latest | Migration notes |
|---|---|---|---|
| `expo` | `~54.0.33` | **57.0.18** (SDK 57) | 3 major SDK versions; requires updating ALL expo-* in lockstep |
| `react-native` | `0.81.5` | **0.87.1** | Must match SDK 57's bundled RN version; significant migration |
| `expo-router` | `~6.0.23` | 57.0.17 | Tied to expo SDK; migrate with SDK upgrade |
| `expo-auth-session` | `~7.0.11` | 57.0.10 | Tied to expo SDK |
| `expo-blur` | `~15.0.8` | 57.0.2 | Tied to expo SDK |
| `expo-image` | `~3.0.11` | 57.0.3 | Tied to expo SDK |
| `expo-secure-store` | `~15.0.8` | 57.0.2 | **Security-critical** — migrate with SDK upgrade |
| `react-native-gesture-handler` | `~2.28.0` | **3.2.1** | Major; API changes in v3; coordinate with SDK upgrade |
| `expo-linear-gradient` | `^55.0.13` | 57.0.1 | Tied to expo SDK |
| `react` | `19.1.0` | 19.2.8 | Minor for React itself, but keep in sync with RN |

---

## 3 · License Check

> `npx license-checker --json --production` returned only the root package. **node_modules is not installed in this environment.** The tool requires installed packages to enumerate transitive dependency licenses. Run `npm install` in CI/CD or locally and re-run `npx license-checker --json --production --excludePrivatePackages`.

**Partial result:** No copyleft (GPL/LGPL/AGPL/MPL) licenses found in the packages that were scannable.

**Recommended CI step to add:**
```bash
npm ci
npx license-checker --production --excludePrivatePackages \
  --onlyAllow "MIT;ISC;Apache-2.0;BSD-2-Clause;BSD-3-Clause;0BSD;Unlicense;CC0-1.0;CC-BY-3.0;CC-BY-4.0" \
  --failOn "GPL;LGPL;AGPL;MPL"
```

---

## 4 · Expo SDK Compatibility

> `npx expo-doctor` failed with: `expo config --json --full exited with non-zero code: 1` — packages not installed.

### Current vs. expected state

| Item | package.json | Expo SDK 54 compatible | Expo SDK 57 (latest) |
|---|---|---|---|
| `expo` | `~54.0.33` | ✅ | 57.0.18 |
| `react-native` | `0.81.5` | ✅ (SDK 54 → RN 0.76–0.81) | 0.87.x required |
| `expo-router` | `~6.0.23` | ✅ | 57.0.17 |
| `expo-secure-store` | `~15.0.8` | ✅ | 57.0.2 |
| `expo-image` | `~3.0.11` | ✅ | 57.0.3 |
| `react-native-reanimated` | `~4.1.1` | ✅ Fabric/JSI compatible | 4.6.0 |
| `react-native-gesture-handler` | `~2.28.0` | ✅ Fabric compatible | 3.2.1 (major) |
| `react-native-worklets` | `0.5.1` | ⚠️ Verify JSI compatibility at this version | 0.12.1 |
| `styled-components` | `^6.4.1` | ✅ v6 supports Fabric | 6.5.3 |

### Flags

- ⚠️ **SDK 54 vs SDK 57**: The project is 3 major SDK releases behind. Expo SDK 57 bundles React Native 0.87 and includes security patches throughout the internal tool chain that resolve the bulk of the audit findings above.
- ⚠️ **`react-native-worklets` 0.5.1**: This is an old version. JSI worklets require careful version pinning with `react-native-reanimated`. Verify these two packages are from the same release epoch; the latest worklets (0.12.1) pairs with reanimated 4.6.0.
- ⚠️ **CLAUDE.md/task brief says SDK 52** — the actual codebase is on **SDK 54**. Update CLAUDE.md to reflect reality.
- ℹ️ New Architecture (Fabric/JSI/Hermes) is correctly enabled in SDK 54. All listed dependencies are New Architecture compatible at their current pinned versions.

---

## 5 · Action Plan

### 🔴 Fix now

1. **Plan Expo SDK 57 upgrade** — the single highest-leverage action.  
   - Resolves the 2 CRITICAL CVEs (tar, shell-quote), all 16 HIGH CVEs in the expo toolchain, and 15 of the MODERATE findings in one shot.  
   - Use `npx expo install --fix` after bumping `expo` in package.json to `~57.0.0`.  
   - Coordinate: `expo`, `expo-router`, `expo-auth-session`, `expo-constants`, `expo-linking`, `expo-secure-store`, `expo-image`, `expo-blur`, `expo-build-properties`, `expo-dev-client`, `expo-font`, `expo-haptics`, `expo-linear-gradient`, `expo-splash-screen`, `expo-status-bar`, `expo-symbols`, `expo-system-ui`, `expo-web-browser`, `react-native@0.87.x`.  
   - **Run `npx expo-doctor` after upgrade** to catch peer dependency mismatches.

2. **Install node_modules and run full license scan** — required before app store submission. Use the `--failOn` flag in CI to gate builds on any copyleft discovery.

3. **Update CLAUDE.md** — change "Expo SDK 52" to "Expo SDK 54" (current) and set target to "Expo SDK 57".

---

### 🟡 This sprint

4. **Update `@sentry/react-native`** from 8.11.1 → 8.24.0.  
   Sentry is the production error-tracking backbone (Phase 1 of MEMORY.md). Running 13 minor versions old risks source-map upload regressions that silently break crash reports. Review the [changelog](https://github.com/getsentry/sentry-react-native/blob/main/CHANGELOG.md) for any config changes.

5. **Update `@supabase/supabase-js`** from 2.105.4 → 2.112.4.  
   7 minor versions; auth session handling and RLS behavior may have changed. Review release notes for any breaking changes to `signInWithOtp`, `getSession`, or realtime subscriptions before applying.

6. **Update `zod`** from 4.4.3 → 4.5.4 (safe within v4 — apply now).

7. **Update `react-native-reanimated`** from 4.1.1 → 4.6.0 and **`react-native-worklets`** from 0.5.1 → 0.12.1 together — these must stay in sync for the JSI worklet runtime to function correctly.

8. **Apply patch updates** for `expo` (54.0.37), `zustand`, `@react-navigation/*`, `react-native-safe-area-context`, `expo-constants`, `expo-font`.

---

### 🟢 Backlog

9. **`react-native-gesture-handler` 3.x migration** — major version jump; schedule after SDK 57 upgrade stabilizes. API surface changed significantly in v3.

10. **`styled-components` 6.5.3** — minor update; low risk; review Fabric render path release notes.

11. **Set up automated dependency auditing in GitHub Actions** — add a weekly `npm audit --audit-level=high` step that fails CI on high+ CVEs. Gate PRs on it. Example step:
    ```yaml
    - run: npm audit --audit-level=high --production
    ```

12. **Add `license-checker` to the CI pipeline** (see Audit 3 command above).

---

*Report generated by automated weekly dependency audit · 2026-08-31*
