import { ActivityIndicator, Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useIsTablet } from '~/shared/hooks/use-is-tablet';

// CtaButton — the dark green pill at the bottom of every welcome and onboarding
// screen, the single tap target that moves the user forward. Extracted here so
// all screens share one definition instead of each keeping a near-identical copy.
//
// The button has three visual states:
//   - normal     — full opacity, label visible
//   - not enabled — dimmed to 0.4 and the press target disabled, the "pick
//                   something first" state used while a selection or form is
//                   incomplete.
//   - loading    — dimmed to 0.6 with a spinner replacing the label, and the
//                   press target actually disabled so a double-tap can't fire
//                   a second async write while the first is in flight.

type CtaColor = 'primary' | 'primaryMid';

interface CtaButtonProps {
  // label — the button text, e.g. "Continue →".
  label: string;
  onPress: () => void;
  // accessibilityLabel — what screen readers announce, more descriptive than
  // the visual label (e.g. "Continue to next step").
  accessibilityLabel: string;
  // enabled — false dims the button to 0.4 (the "pick something first" state).
  enabled?: boolean;
  // isLoading — true dims to 0.6 and swaps the label for a spinner.
  isLoading?: boolean;
  // color — fill color token; Location uses the lighter primaryMid, everything
  // else uses primary.
  color?: CtaColor;
  // fullWidth — stretches the pill to its container's width (WelcomeStep4's
  // centered layout needs this; flex-column layouts stretch automatically).
  fullWidth?: boolean;
  // withBottomGap — adds the standard md gap below the button. The welcome
  // steps use this because their button sits directly in the screen column;
  // onboarding screens get their spacing from CtaArea instead.
  withBottomGap?: boolean;
}

// ButtonShell — the pressable pill itself. Padding scales up on tablets so the
// touch target stays large relative to the screen. Opacity is resolved by the
// component below so the styles stay a simple lookup.
const ButtonShell = styled(Pressable)<{
  $isTablet: boolean;
  $color: CtaColor;
  $opacity: number;
  $fullWidth: boolean;
  $withBottomGap: boolean;
}>`
  background-color: ${({ theme, $color }) => theme.colors[$color]};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet }) => ($isTablet ? '22px 18px' : '14px 12px')};
  opacity: ${({ $opacity }) => $opacity};
  ${({ $fullWidth }) => ($fullWidth ? 'width: 100%;' : '')}
  ${({ theme, $withBottomGap }) =>
    $withBottomGap ? `margin-bottom: ${theme.spacing.md}px;` : ''}
`;

// ButtonLabel — the pale mint text inside the pill; scales 14px → 22px on tablets.
const ButtonLabel = styled.Text<{ $isTablet: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ $isTablet }) => ($isTablet ? 22 : 14)}px;
  color: ${({ theme }) => theme.colors.textOnPrimary};
  text-align: center;
`;

export const CtaButton = ({
  label,
  onPress,
  accessibilityLabel,
  enabled = true,
  isLoading = false,
  color = 'primary',
  fullWidth = false,
  withBottomGap = false,
}: CtaButtonProps) => {
  const theme = useTheme();
  const isTablet = useIsTablet();

  // Loading wins over not-enabled: a dimmed in-flight button shows 0.6 even if
  // the screen also reports enabled=false while submitting.
  const opacity = isLoading ? 0.6 : enabled ? 1 : 0.4;

  return (
    <ButtonShell
      $isTablet={isTablet}
      $color={color}
      $opacity={opacity}
      $fullWidth={fullWidth}
      $withBottomGap={withBottomGap}
      onPress={onPress}
      disabled={!enabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !enabled, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.textOnPrimary} />
      ) : (
        <ButtonLabel $isTablet={isTablet}>{label}</ButtonLabel>
      )}
    </ButtonShell>
  );
};
