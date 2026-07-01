// ─────────────────────────────────────────────────────────────────────────────
// Kura theme — two themes, one shape.
//
// The app ships a `lightTheme` and a `darkTheme`. `app/_layout.tsx` picks one
// from the device colour scheme and hands it to styled-components, so every
// `theme.colors.*` lookup resolves to whichever theme is active.
//
//   • DARK  = the app's original look: white text and dark translucent glass
//             floating over a dark green photo wash. Every screen looks like
//             this today.
//   • LIGHT = the "Clear Sky" look: dark slate text and pale frosted glass over
//             a bright blue-white photo wash. The Today/Home screen renders
//             this in light mode now; the rest of the app follows (see below).
//
// ── How the token groups are organised ──────────────────────────────────────
//  1. brand          — fixed identity colours; identical in both themes.
//  2. sharedChrome    — opaque form/input chrome that never varies.
//  3. darkPanelChrome — the near-black settings/auth panels (constant for now).
//  4. legacyOnPhoto   — the ORIGINAL always-dark on-photo + clear-glass tokens.
//                       Same value in both themes, so any screen still using
//                       them looks dark in light mode too. These are being
//                       retired screen by screen — see THEME_MIGRATION.md.
//  5. *Chrome         — app background/text that already differs per theme.
//  6. *Onboarding     — the onboarding gradient + frosted panel (already
//                       differs per theme).
//  7. *Semantic       — the NEW canonical, theme-aware tokens. This is the set
//                       every screen should move onto. The Today screen uses it.
//
// When you migrate a screen, swap its `legacyOnPhoto` tokens for the matching
// `*Semantic` ones and it starts responding to light/dark automatically.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark';

// ── 1. Brand — fixed identity, theme-independent ─────────────────────────────
const brand = {
  primary: '#2D6A2D',
  primaryMid: '#5A9E3A',
  primaryDeep: '#0c3520',
  lime: 'rgba(184,229,106,0.92)',
  // limeSolid — the fully-opaque lime used as a fill (Done pill, DONE stamp,
  // active tab, confetti). `lime` above is the same hue at 92% for text/accents.
  limeSolid: '#b8e56a',
  white: '#FFFFFF',
  googleBrand: '#4285F4',
  appleBrand: '#000000',
  // errorOnDark / errorOnLight — soft reds tuned for dark glass vs light panels.
  errorOnDark: 'rgba(255,120,100,0.92)',
  errorOnLight: 'rgba(177, 24, 0, 0.92)',
} as const;

// ── 2. Shared chrome — opaque inputs/success, same in both themes ────────────
const sharedChrome = {
  inputBorder: '#d0e8d0',
  inputBackground: '#f5fbf5',
  success: '#C8E6C0',
} as const;

// ── 3. Dark-panel chrome — the near-black settings/auth surfaces ─────────────
// Constant for now; they live on the dark settings/OTP panels regardless of
// theme. Migrate alongside those screens when their turn comes.
const darkPanelChrome = {
  screenDark: '#1a1a1a',
  panelDark: '#242424',
  inputBorderDark: 'rgba(255,255,255,0.10)',
  inputBackgroundDark: 'rgba(255,255,255,0.05)',
  borderOnDark: 'rgba(255,255,255,0.10)',
  buttonSurfaceDark: '#2a2a2a',
} as const;

// ── 4. Legacy on-photo + clear-glass — ALWAYS DARK (same in both themes) ─────
// The original sign-in / onboarding / details-modal palette: white text and
// clear glass built to sit over a dark photo. Screens still on these tokens
// stay dark even in light mode. Retire per screen via THEME_MIGRATION.md by
// swapping to the *Semantic equivalents noted in brackets.
const legacyOnPhoto = {
  photoTint: 'rgba(5,12,5,0.58)', //            [→ photoWash*]
  onboardingPhotoTint: 'rgba(10,28,10,0.60)', // [→ photoWash*]
  textOnDark: 'rgba(255,255,255,0.85)', //       [→ textPhotoBody]
  textMutedOnDark: 'rgba(255,255,255,0.60)', //  [→ textPhotoMuted]
  subtextOnPhoto: 'rgba(255,255,255,0.48)', //   [→ textPhotoSubtle]
  textFaintOnDark: 'rgba(255,255,255,0.28)', //  [→ textPhotoFaint]
  textOnPrimary: '#D6EFD8', //                   (on the solid primary CTA pill)
  glassClearPanel: 'rgba(255,255,255,0.10)', //  [→ glassFill]
  glassClearEdge: 'rgba(255,255,255,0.32)', //   [→ glassEdge]
  glassClearEdgeBottom: 'rgba(255,255,255,0.10)', // [→ glassEdgeSoft]
  glassClearInput: 'rgba(255,255,255,0.13)', //  [→ glassInput]
  glassClearInputFocused: 'rgba(255,255,255,0.22)',
  glassClearInputBorder: 'rgba(255,255,255,0.14)',
  glassClearDivider: 'rgba(255,255,255,0.22)', // [→ glassDivider]
  glassFrostPanel: 'rgba(255,255,255,0.44)', //  (GlassCard 'frost' variant)
  // deckCardExpanded / scrimDark — the task Details bottom-sheet (dark sheet
  // over a dim). It reads fine in light mode, so it stays on these for now.
  deckCardExpanded: 'rgba(22,42,22,0.55)',
  scrimDark: 'rgba(3,9,3,0.62)',
} as const;

// ── 5. App chrome — opaque screen background/text (already per-theme) ─────────
const lightChrome = {
  background: '#FFFFFF',
  surface: '#EAF4E5',
  text: '#1A1A1A',
  textMuted: '#888888',
  border: '#e0e0e0',
} as const;

const darkChrome = {
  background: '#0F1F0F',
  surface: '#1A2E1A',
  text: '#F0F0F0',
  textMuted: '#AAAAAA',
  border: '#2E4A2E',
} as const;

// ── 6. Onboarding — gradient background + frosted panel (already per-theme) ───
// Light: heavy white frost over a rich forest-green gradient, dark green text.
const lightOnboarding = {
  gradientDark: '#0c3520',
  gradientMid: '#135633',
  gradientMidLight: '#1e6b3c',
  gradientLight: '#3d7d35',
  glassOnboardingPanel: 'rgba(255,255,255,0.46)',
  glassOnboardingInput: 'rgba(255,255,255,0.55)',
  glassOnboardingInputFocused: 'rgba(255,255,255,0.72)',
  glassOnboardingHint: 'rgba(19,86,51,0.08)',
  glassOnboardingOption: 'rgba(19,86,51,0.08)',
  glassOnboardingOptionSelected: 'rgba(19,86,51,0.18)',
  textOnGlass: 'rgba(14,42,14,0.85)',
  textMutedOnGlass: 'rgba(14,42,14,0.52)',
  placeholderOnGlass: 'rgba(14,42,14,0.32)',
  textAccentOnGlass: '#135633',
  borderOnGlass: 'rgba(14,42,14,0.12)',
} as const;

// Dark: deep green-black frost over a near-black gradient, white/lime text.
const darkOnboarding = {
  gradientDark: '#060f07',
  gradientMid: '#0a1a0b',
  gradientMidLight: '#0e2510',
  gradientLight: '#152e15',
  glassOnboardingPanel: 'rgba(22,48,24,0.82)',
  glassOnboardingInput: 'rgba(255,255,255,0.06)',
  glassOnboardingInputFocused: 'rgba(255,255,255,0.10)',
  glassOnboardingHint: 'rgba(255,255,255,0.04)',
  glassOnboardingOption: 'rgba(255,255,255,0.06)',
  glassOnboardingOptionSelected: 'rgba(255,255,255,0.14)',
  textOnGlass: 'rgba(255,255,255,0.88)',
  textMutedOnGlass: 'rgba(184,229,106,0.52)',
  placeholderOnGlass: 'rgba(255,255,255,0.30)',
  textAccentOnGlass: 'rgba(184,229,106,0.82)',
  borderOnGlass: 'rgba(255,255,255,0.12)',
} as const;

// ── 7. Semantic — the canonical, theme-aware token set ───────────────────────
// This is what screens should use. Light = Clear Sky, Dark = the original look.
// The two objects below are kept in identical key order so a token's light and
// dark values sit at the same line for easy comparison.
const lightSemantic = {
  // Photo wash — the tint over the full-screen blurred lawn photo. Two stops so
  // HomeScreen can run it as a soft top-to-bottom gradient.
  photoWashTop: 'rgba(226,241,251,0.42)',
  photoWashBottom: 'rgba(234,245,250,0.78)',

  // Glass — frosted panels (context card, task rows, tab bar). Pale fill with a
  // bright top highlight edge fading to a softer base.
  glassFill: 'rgba(248,252,255,0.55)',
  glassEdge: 'rgba(255,255,255,0.85)',
  glassEdgeSoft: 'rgba(255,255,255,0.45)',
  glassDivider: 'rgba(22,48,58,0.14)',
  glassInput: 'rgba(255,255,255,0.55)',

  // Text over the photo, five tiers from headline down to faint labels.
  textPhotoHeading: '#16303a',
  textPhotoBody: 'rgba(22,48,58,0.80)',
  textPhotoMuted: 'rgba(22,48,58,0.62)',
  textPhotoSubtle: 'rgba(22,48,58,0.46)',
  textPhotoFaint: 'rgba(22,48,58,0.34)',

  // Accents. Clear Sky splits them: a green action fill, a sky-blue text accent.
  accentPrimary: '#3E9A5E', //        action fill (Done pill, done check)
  accentPrimaryInk: '#FFFFFF', //     text/icon on the action fill
  accentPrimaryPressed: '#2D6A2D', // the hold-to-complete curtain wipe
  accentText: '#2478A6', //           count labels, active tab, links
  trackFrom: '#3E9A5E', //            completion bar gradient start
  trackTo: '#7ED0BE', //              completion bar gradient end

  // Today-screen surfaces.
  deckRowSurface: 'rgba(248,252,255,0.55)', //  collapsed task row
  deckRowSurfaceDone: 'rgba(248,252,255,0.30)', // completed row (dimmer)
  deckRowBorder: 'rgba(255,255,255,0.55)', //   collapsed row rim
  rowExpandedTint: 'rgba(244,250,255,0.30)', // wash over an open row's blur
  deckCardSurface: 'rgba(248,252,255,0.60)', // cleared-celebration panel
  emojiBadgeSurface: 'rgba(255,255,255,0.62)', // rounded square behind an emoji
  emojiBadgeEdge: 'rgba(255,255,255,0.75)',
  navPillSurface: 'rgba(244,250,255,0.55)', //  floating tab bar fill
  limeGlow: 'rgba(36,120,166,0.18)', //         active-tab glow pad
  scrimFadeTop: 'rgba(234,245,250,0)', //       bottom scrim, clear top
  scrimFadeBottom: 'rgba(234,245,250,1)', //    bottom scrim, opaque base
  photoHeaderFadeTop: 'rgba(10,28,10,0.02)', // fade over a task's photo strip
  photoHeaderFadeBottom: 'rgba(10,28,10,0.42)',
} as const;

const darkSemantic = {
  // Photo wash — the original dark green overlay (flat: both stops equal).
  photoWashTop: 'rgba(10,28,10,0.60)',
  photoWashBottom: 'rgba(10,28,10,0.60)',

  // Glass — the original clear-glass values.
  glassFill: 'rgba(255,255,255,0.10)',
  glassEdge: 'rgba(255,255,255,0.32)',
  glassEdgeSoft: 'rgba(255,255,255,0.10)',
  glassDivider: 'rgba(255,255,255,0.22)',
  glassInput: 'rgba(255,255,255,0.13)',

  // White text tiers over the dark photo.
  textPhotoHeading: '#FFFFFF',
  textPhotoBody: 'rgba(255,255,255,0.85)',
  textPhotoMuted: 'rgba(255,255,255,0.60)',
  textPhotoSubtle: 'rgba(255,255,255,0.48)',
  textPhotoFaint: 'rgba(255,255,255,0.28)',

  // Accents — the original lime family.
  accentPrimary: '#b8e56a',
  accentPrimaryInk: '#0c3520',
  accentPrimaryPressed: '#5A9E3A',
  accentText: 'rgba(184,229,106,0.92)',
  trackFrom: '#5A9E3A',
  trackTo: '#b8e56a',

  // Today-screen surfaces — the original dark deck values.
  deckRowSurface: 'rgba(8,22,10,0.72)',
  deckRowSurfaceDone: 'rgba(8,22,10,0.42)',
  deckRowBorder: 'rgba(255,255,255,0.08)',
  rowExpandedTint: 'rgba(22,42,22,0.55)',
  deckCardSurface: 'rgba(255,255,255,0.13)',
  emojiBadgeSurface: 'rgba(10,28,10,0.88)',
  emojiBadgeEdge: 'rgba(255,255,255,0.28)',
  navPillSurface: 'rgba(10,26,12,0.62)',
  limeGlow: 'rgba(184,229,106,0.22)',
  scrimFadeTop: 'rgba(10,28,10,0)',
  scrimFadeBottom: 'rgba(10,28,10,1.0)',
  photoHeaderFadeTop: 'rgba(10,28,10,0.04)',
  photoHeaderFadeBottom: 'rgba(10,28,10,0.58)',
} as const;

// ── Structural scales — spacing, radii, type. Shared across both themes ──────
const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
// iconSizes — inline brand/action icons alongside text (sm matches the social logos).
const iconSizes = { sm: 18 } as const;
const radii = { sm: 4, md: 8, lg: 16, full: 9999 } as const;
const typography = {
  sizeXs: 12,
  sizeSm: 14,
  sizeMd: 16,
  sizeLg: 20,
  sizeXl: 24,
  size2xl: 32,
  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightBold: '700' as const,
  weightBlack: '900' as const,
  lineHeightSm: 18,
  letterSpacingTight: -0.3,
  letterSpacingBrand: -1,
  letterSpacingWide: 2,
  // fontBody — JetBrains Mono for body/labels/UI. fontHeader — Zalando Sans for headings.
  fontBody: 'JetBrainsMono-Regular',
  fontBodyMedium: 'JetBrainsMono-Medium',
  fontBodyBold: 'JetBrainsMono-Bold',
  fontBodyBlack: 'JetBrainsMono-ExtraBold',
  fontHeader: 'ZalandoSans-Regular',
  fontHeaderBold: 'ZalandoSans-Bold',
  fontHeaderHeavy: 'ZalandoSans-Black',
} as const;

// ── Compose the two themes ───────────────────────────────────────────────────
// Every theme is: brand + the constant groups + its own chrome/onboarding/
// semantic groups. `mode` lets components branch on non-colour concerns (e.g.
// a BlurView needs tint="light" vs "dark", which isn't a colour token).
export const lightTheme = {
  mode: 'light' as ThemeMode,
  colors: {
    ...brand,
    ...sharedChrome,
    ...darkPanelChrome,
    ...legacyOnPhoto,
    ...lightChrome,
    ...lightOnboarding,
    ...lightSemantic,
  },
  spacing,
  iconSizes,
  radii,
  typography,
};

// AppTheme — the shape both themes share. The colour values are widened to
// `string` (the `as const` groups above would otherwise pin light's literals,
// which dark's different values could never satisfy) while the exact key set is
// preserved, so `theme.colors.typo` is still caught at compile time.
export type AppTheme = Omit<typeof lightTheme, 'colors'> & {
  colors: { [K in keyof typeof lightTheme.colors]: string };
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    ...brand,
    ...sharedChrome,
    ...darkPanelChrome,
    ...legacyOnPhoto,
    ...darkChrome,
    ...darkOnboarding,
    ...darkSemantic,
  },
  spacing,
  iconSizes,
  radii,
  typography,
};
