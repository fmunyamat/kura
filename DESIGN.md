# Kura — Design & Styling

---

## Design System

### Styling rules

All styles live in styled-components co-located with the component. No `StyleSheet.create()`, no inline `style={}` except runtime-computed values (e.g. `Animated.Value` transforms, `onLayout` widths).

### Theme tokens

`src/config/theme.ts` is the single source of truth. Never hardcode a colour or spacing value — always use a token.

```ts
// Brand (never changes between themes)
primary: '#2D6A2D'   primaryMid: '#5A9E3A'   primaryDeep: '#0c3520'
lime: 'rgba(184,229,106,0.92)'   errorOnDark: 'rgba(255,120,100,0.92)'

// App chrome (light/dark variants)
background · surface · text · textMuted · border · inputBorder · success

// Dark-photo screens (sign-in, welcome, onboarding, today) — constant across themes
photoTint:           'rgba(5,12,5,0.58)'
onboardingPhotoTint: 'rgba(10,28,10,0.60)'
textOnDark:          'rgba(255,255,255,0.85)'
textMutedOnDark:     'rgba(255,255,255,0.60)'
subtextOnPhoto:      'rgba(255,255,255,0.48)'
textOnPrimary:       '#D6EFD8'

// Clear-glass card
glassClearPanel:        'rgba(255,255,255,0.10)'
glassClearEdge:         'rgba(255,255,255,0.32)'   // bright top edge
glassClearEdgeBottom:   'rgba(255,255,255,0.10)'   // fading bottom edge
glassClearInput:        'rgba(255,255,255,0.13)'   // input wells
glassClearInputFocused: 'rgba(255,255,255,0.22)'   // focus state
glassClearDivider:      'rgba(255,255,255,0.22)'   // 1px rules inside cards

// Frost glass + onboarding gradient (legacy frost panels)
glassFrostPanel: 'rgba(255,255,255,0.44)' · glassOnboardingPanel · gradientDark…gradientLight
textOnGlass · textMutedOnGlass · textAccentOnGlass · borderOnGlass

// Scale tokens
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
radii:   { sm: 4, md: 8, lg: 16, full: 9999 }
```

### Typography

```ts
fontBody / fontBodyMedium / fontBodyBold / fontBodyBlack   // JetBrains Mono
fontHeader / fontHeaderBold / fontHeaderHeavy              // Zalando Sans
```

- **JetBrains Mono** — all body copy, labels, button text, and micro-text.
- **Zalando Sans** — headings and card titles only. Big screen headlines use `fontHeaderHeavy`.
- Never reference a font family by string — always through typography tokens.

### Tablet scaling

Tablets are detected by hardware, not window size. `useIsTablet()` (`shared/hooks/use-is-tablet.ts`) wraps `react-native-device-info`'s `getDeviceType()` — synchronous, never changes mid-session, no state or effect needed. Exports `TabletProps` so styled-components don't each redeclare it.

```tsx
import { useIsTablet, type TabletProps } from '~/shared/hooks/use-is-tablet';

const Title = styled.Text<TabletProps>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.size2xl : theme.typography.sizeXl}px;
`;
```

**Dev build required:** `react-native-device-info` is a native module — use `npx expo start --dev-client`, not Expo Go.

### Styled-components usage

```tsx
const Container = styled(Pressable)`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius:    ${({ theme }) => theme.radii.md}px;
  padding:          ${({ theme }) => theme.spacing.md}px;
`;

// Transient props for variants — $ prefix prevents forwarding to native element
const TaskRow = styled.View<{ $completed: boolean }>`
  opacity: ${({ $completed }) => ($completed ? 0.5 : 1)};
`;
```

Note: `flex: 0` in React Native sets `flexBasis: 0`, collapsing a view to zero height. To let a view size to its own content without expanding, omit `flex` entirely — React Native defaults to `flexBasis: auto`.

### TypeScript augmentation

```ts
// types/styled.d.ts
import type { lightTheme } from '@/config/theme';
type AppTheme = typeof lightTheme;
declare module 'styled-components/native' {
  export interface DefaultTheme extends AppTheme {}
}
```

---

## Shared Glass Components

### GlassCard — the one card component

`shared/components/GlassCard` renders every glass surface. Two variants:

- **`frost`** (default) — solid 44% white tint (`glassFrostPanel`).
- **`clear`** — near-invisible pane: 10% white fill, 1px border bright along the top (`glassClearEdge`) fading at the bottom (`glassClearEdgeBottom`), mimicking light catching real glass. Used on all sign-in / welcome / onboarding / today screens.

**Platform blur strategy:**

- **iOS** — real backdrop blur via `expo-blur`'s `BlurView` (`iosBlurIntensity`, default 15).
- **Android** — real backdrop blur is unusable (snapshot-based blur creates a glowing halo ghost of controls drawn on top of the card). The card fakes it: caller passes the same photo the screen draws behind the card (`clearBackdropSource`) plus the screen tint (`clearBackdropTint`), and the card renders a blurred copy of that photo internally (`androidBlurRadius`, default 20). At that blur radius the fake is indistinguishable from the real thing.

```tsx
<GlassCard
  variant="clear"
  clearBackdropSource={SPRINKLER_BG}
  clearBackdropTint={theme.colors.onboardingPhotoTint}
>
  …content…
</GlassCard>
```

`contentPadding="none"` skips the internal padded wrapper so rows can run edge-to-edge (task lists, camera wells).

### Shared screen primitives

Screens compose these — never redefine them locally:

| Component | Role |
|---|---|
| `ScreenLayout` → `ContentArea`, `ContentGroup`, `CtaArea`, `TopSpacer`, `BottomSpacer`, `GapSpacer` | Vertical skeleton: side padding, flexible gaps that pin the CTA to the bottom. `column` prop = centered 80% column on tablets so forms align with the sign-in card. |
| `ScreenTypography` → `ScreenHeadline`, `ScreenSubtext` | Big white heading + faint supporting line. Headline sizes: `display` (50/76px phone/tablet) and `title` (42/64px). Subtext tones: `faint` (48% white) and `muted` (60%). Both resolve tablet scale internally. |
| `CtaButton` | Dark green pill. States: normal, `enabled={false}` (dimmed 0.4), `isLoading` (dimmed 0.6, spinner, press disabled). `color="primaryMid"` only on Location. |
| `OptionCard` | Selectable row (emoji, name, description, check circle). Selected state brightens to `glassClearInputFocused`. Used on GrassType, EffortLevel, Settings. |
| `GlassDivider` | 1px `glassClearDivider` rule. `flex` prop for inline rows; default block form between stacked rows. |
| `ErrorMessage` | Centered `errorOnDark` text. `size` (`xs`/`sm`) and `spacing` (`below`/`above`). Never renders raw error strings. |
| `StepProgressDots` | Top-of-screen progress row; active step stretches into an 18×5 pill. |
| `StepPillLabel` | "QUICK TOUR · 2 OF 4" capsule in the nav bar. |

`OnboardingScreenShell` (feature-local) wraps onboarding screens with the sprinkler photo, tint, dots, step pill, and back arrow. Its NavBar dimensions mirror `WelcomeFlow`'s so the step pill never shifts position between the two flows.

---

## Screens

### Sign-in

**Layer stack:** mowing photo → `photoTint` → content.

**Glass card** holds the email form. Inputs are `glassClearInput` wells that brighten on focus (no border change). `GlassDivider flex` wraps "or continue with". Social buttons sit below.

---

### Welcome (steps 1–4)

**Layer stack:** blurred `lawn.png` → `onboardingPhotoTint` → `WelcomeFlow` pager.

Steps 1–3 each show one clear `GlassCard`: info row / sample task list / nav-pill list with `GlassDivider` separators. Step 4 is a centered completion state with `ErrorMessage` above the CTA.

---

### Onboarding (Location → GrassType → EffortLevel → PhotoCapture)

**Layer stack:** blurred `sprinkler.png` → `onboardingPhotoTint` → `OnboardingScreenShell`.

Clear `GlassCard` holds form fields and `OptionCard` lists. `ContentArea column` / `CtaArea column` keep tablet width aligned with sign-in. PhotoCapture's camera well uses `contentPadding="none"`.

---

### Today — Focus Deck

The main daily screen. One task at a time, surfaced as a physical deck of cards.

#### Layer stack

```
1. Full-bleed photo (sprinkler.png) — blurred, scaled 1.06×
2. Dark green tint — onboardingPhotoTint (rgba(10,28,10,0.60))
3. Screen content column
```

#### Screen anatomy (top → bottom)

**Eyebrow row** — "On Deck · [Day]" — `subtextOnPhoto`, 9.5px, 2.5px letter-spacing, uppercase. No chip or badge in this row.

**Greeting** — "Morning, [first name]" — Zalando Sans Heavy, 24px, no emoji. Clean and direct.

**Split context card** — a single clear glass card split into two equal columns by a 1px `glassClearDivider` hairline:

| Column | Content |
|---|---|
| Left — Streak | "STREAK" eyebrow · 🔥 icon + number (24px bold) · "days in a row" |
| Right — Weather | "WEATHER" eyebrow · temperature (24px bold) + ☀️ icon · condition text |

Grid layout: `1fr 1px 1fr` — the divider is its own column. Each half pads `11px 14px`. Both values update in JS: the streak number ticks up when the deck is cleared; weather is injected at render time.

**Completion track** — "Task X of Y" label left-aligned + gradient progress bar (`primaryMid → lime`). Fills as today's cards are stamped. Tomorrow's locked card is excluded from the count.

**Card deck** — stacked absolutely-positioned cards, each animating via CSS transitions:

| Class | Position | Scale | Opacity |
|---|---|---|---|
| `pos-front` | top: 0 | 1.0 | 1.0 |
| `pos-b1` | top: −13px | 0.93 | 0.55 |
| `pos-b2` | top: −25px | 0.86 | 0.30 |
| `pos-hidden` | top: −25px | 0.80 | 0 |

Each card anatomy:
- **Photo header** (84px tall) with a bottom-fade gradient overlay
- **Emoji badge** — 42×42px rounded square (border-radius 13px), anchored bottom-left of photo, dark green background, 1px glass border
- **Task count label** — "Task X of Y · Today" in `lime`; "Tomorrow · [Day]" in `subtextOnPhoto` for locked cards
- **Task title** — Zalando Sans Heavy, 25px, line-height 1.1
- **Detail drawer** (collapsed by default) — slides open on tap (`max-height: 0 → 300px`, spring easing). Contains: description text + numbered steps list
- **Tap hint** — "tap for details ⌄" / "tap to close ⌃" — 8.5px uppercase, centered
- **CTA pill** — "Done ✓" (`lime` background, `primaryDeep` text) for active cards; "🔒 Unlocks tomorrow 6:00am" (muted glass) for the locked card

**Peek navigation** — ‹ · [Card X of Y / "Tomorrow · locked"] · › — round glass buttons (38×38px). The label in the centre reflects the card currently in front.

**Tab bar** — floating glass pill: Today · Tasks · Learn · Profile. Active tab label is `lime`; active icon gets a `rgba(184,229,106,0.22)` tint.

#### Interactions

**Tap front card (expand)** — FLIP zoom: card's bounding box is measured before and after the layout change, then animated from old position/size to new. Card rises to `top: −120px`, grows to `min-height: 580px`, z-index 45. A scrim (`rgba(3,9,3,0.62)` + 4px blur) dims and blurs everything behind it. Card body switches to a flex column so the CTA pins to the bottom (`min-height: 496px` for the body).

**Tap scrim or "tap to close ⌃"** — FLIP zoom collapses the card back to its deck position. Scrim fades out.

**Peek (‹ / ›)** — front card slides aside (`translateX(−86%) rotate(−7deg) scale(0.95)`, 35% opacity). The card behind comes into view. Peeking never completes a card. Any open modal closes first.

**Done ✓** — Only fires when the front card is showing (not peeking). Sequence:
1. "DONE" stamp slams onto the card (`rotate(−14deg)`, spring animation)
2. After 600ms: card flies off upper-right (`translate(125%, −26%) rotate(16deg)`)
3. After 1150ms: card removed from DOM, remaining cards slide into new positions

**Deck cleared** — when both today's cards are stamped:
- Confetti (`lime`, white, `primaryMid`, `textOnPrimary`) rains across the phone
- Streak number in the context card ticks up (e.g. 6 → 7)
- A celebration card ("Deck cleared. 🎉") takes the front slot
- Tomorrow's locked card remains visible behind it as `pos-b1`
- Peek nav is disabled ("See you tomorrow")

---

### Home tab (legacy)

> The focus deck above is the target design for the Today tab. The components below describe the current implementation — being replaced by the deck pattern.

**Background:** four-stop green gradient `#0c3520 → #135633 → #1e6b3c → #3d7d35`, angle 168°. Same gradient as `OnboardingLayout` for visual continuity from sign-in through to the main app.

**Glass panel tokens:** `glassOnboardingPanel` (`rgba(255,255,255,0.46)`) + `BackdropBlur`. Task row default: `glassOnboardingOption`; selected: `glassOnboardingOptionSelected`.

#### Hero-collapse / panel-expand pattern

```
ContentArea (flex: 1, flexDirection: 'column')
  ├── Hero       — overview: flex 1  |  focused: omit flex (sizes to content)
  └── GlassPanel — overview: flex 3  |  focused: flex 1
```

Wrap the state change in `LayoutAnimation.configureNext` so the flex change animates:

```tsx
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const handleFocus = (id: string) => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setFocusedId(id);
};
```

**Do not use with `KeyboardAvoidingView`** — the two animation systems conflict and leave a black gap when the keyboard dismisses. `HomeScreen` has no keyboard input so this is safe there.
