// ─── Brand & structural tokens shared across both themes ─────────────────────
// These never change between light and dark — they are fixed brand identity
// values (primary palette, spacing, radii, typography scale).
const brandColors = {
  primary:     '#2D6A2D',
  primaryMid:  '#5A9E3A',
  primaryDeep: '#0c3520',
  lime:        'rgba(184,229,106,0.92)',
  white:       '#FFFFFF',
  googleBrand: '#4285F4',
  appleBrand:  '#000000',
};

// ─── Light theme ─────────────────────────────────────────────────────────────
// Onboarding glass panel: heavy white frost floating over a rich forest-green
// gradient. Text is dark green; the CTA reads off the lime gradient.
export const lightTheme = {
  colors: {
    ...brandColors,

    // App chrome (home screen, settings, etc.)
    background:      '#FFFFFF',
    surface:         '#EAF4E5',
    text:            '#1A1A1A',
    textMuted:       '#888888',
    border:          '#e0e0e0',
    inputBorder:     '#d0e8d0',
    inputBackground: '#f5fbf5',
    success:         '#C8E6C0',

    // Sign-in screen (dark photo background)
    screenDark:          '#1a1a1a',
    panelDark:           '#242424',
    inputBorderDark:     'rgba(255,255,255,0.10)',
    inputBackgroundDark: 'rgba(255,255,255,0.05)',
    textOnDark:          'rgba(255,255,255,0.85)',
    textMutedOnDark:     'rgba(255,255,255,0.60)',
    borderOnDark:        'rgba(255,255,255,0.10)',
    buttonSurfaceDark:   '#2a2a2a',

    // Onboarding background gradient — rich forest green, four stops.
    gradientDark:     '#0c3520',
    gradientMid:      '#135633',
    gradientMidLight: '#1e6b3c',
    gradientLight:    '#3d7d35',

    // Onboarding glass panel — white frost at 46% sits cleanly over the gradient.
    glassOnboardingPanel:          'rgba(255,255,255,0.46)',
    // Inputs sit slightly brighter than the panel surface to read as interactive.
    glassOnboardingInput:          'rgba(255,255,255,0.55)',
    glassOnboardingInputFocused:   'rgba(255,255,255,0.72)',
    // Hint and option rows use a faint green tint to match the gradient behind.
    glassOnboardingHint:           'rgba(19,86,51,0.08)',
    glassOnboardingOption:         'rgba(19,86,51,0.08)',
    glassOnboardingOptionSelected: 'rgba(19,86,51,0.18)',

    // Text on the light glass panel — dark forest green, not pure black, so it
    // reads as part of the green design language.
    textOnGlass:      'rgba(14,42,14,0.85)',
    textMutedOnGlass: 'rgba(14,42,14,0.52)',
    // Placeholder is more muted than body text so unfilled fields look inviting.
    placeholderOnGlass:  'rgba(14,42,14,0.32)',
    // Links and accents inside the panel use a medium forest green.
    textAccentOnGlass:   '#135633',

    // Progress bar segments — white on green reads the same on both themes.
    onboardingProgressDone:   'rgba(255,255,255,0.75)',
    onboardingProgressActive: 'rgba(255,255,255,0.75)',
    onboardingProgressEmpty:  'rgba(255,255,255,0.15)',
  },
  spacing:   { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  // iconSizes — fixed dimensions for inline brand/action icons alongside text.
  // sm (18px) matches the Google and Apple logos in SocialAuthButtons.
  iconSizes: { sm: 18 },
  radii:   { sm: 4, md: 8, lg: 16, full: 9999 },
  typography: {
    sizeXs:  12,
    sizeSm:  14,
    sizeMd:  16,
    sizeLg:  20,
    sizeXl:  24,
    size2xl: 32,
    weightRegular: '400' as const,
    weightMedium:  '500' as const,
    weightBold:    '700' as const,
    weightBlack:   '900' as const,
    lineHeightSm:        18,
    letterSpacingTight:  -0.3,
    letterSpacingBrand:  -1,
    letterSpacingWide:    2,
  },
};

export type AppTheme = typeof lightTheme;

// ─── Dark theme ───────────────────────────────────────────────────────────────
// Onboarding glass panel: deep tinted green-black frost floating over a near-black
// gradient. Text is white; lime accents replace dark-green accents; the lime
// gradient CTA pops against the dark surface.
export const darkTheme: AppTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,

    // App chrome
    background: '#0F1F0F',
    surface:    '#1A2E1A',
    text:       '#F0F0F0',
    textMuted:  '#AAAAAA',
    border:     '#2E4A2E',

    // Onboarding background gradient — much darker than light, near-black green.
    gradientDark:     '#060f07',
    gradientMid:      '#0a1a0b',
    gradientMidLight: '#0e2510',
    gradientLight:    '#152e15',

    // Onboarding glass panel — deep green-black tint at 82% absorbs the dark
    // gradient behind it, making the panel read as a distinct elevated surface.
    glassOnboardingPanel:          'rgba(22,48,24,0.82)',
    // Inputs are barely-there white surfaces — text appears to float on dark.
    glassOnboardingInput:          'rgba(255,255,255,0.06)',
    glassOnboardingInputFocused:   'rgba(255,255,255,0.10)',
    // Hint and option rows are even subtler than inputs to maintain hierarchy.
    glassOnboardingHint:           'rgba(255,255,255,0.04)',
    glassOnboardingOption:         'rgba(255,255,255,0.06)',
    glassOnboardingOptionSelected: 'rgba(255,255,255,0.14)',

    // Text on the dark glass panel — white primary, lime-tinted muted copy.
    textOnGlass:      'rgba(255,255,255,0.88)',
    textMutedOnGlass: 'rgba(184,229,106,0.52)',
    // Placeholder is lighter than light-theme equivalent — dark inputs need more
    // contrast with the near-invisible background surface.
    placeholderOnGlass:  'rgba(255,255,255,0.30)',
    // Links and accents switch to lime so they pop on the dark panel.
    textAccentOnGlass:   'rgba(184,229,106,0.82)',
  },
};
