import { ActivityIndicator, Pressable } from 'react-native';
import styled from 'styled-components/native';
import { useIsTablet, type TabletProps } from '~/shared/hooks/use-is-tablet';

interface WelcomeStep4Props {
  // onFinish — async handler that writes has_seen_welcome and routes to tabs.
  // WelcomeFlow owns the try/catch; WelcomeStep4 just reports isSubmitting state.
  onFinish: () => Promise<void>;
  isSubmitting: boolean;
  errorMessage: string | null;
}

// ContentArea — flex column that fills the space below the shared nav bar.
// align-items: center keeps the icon and text horizontally centred.
// On tablets, horizontal padding increases so content doesn't stretch edge-to-edge.
const ContentArea = styled.View<TabletProps>`
  flex: 1;
  align-items: center;
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px;
`;

// TopSpacer — pushes the content group down from the NavBar.
// flex: 0.2 matches Steps 1–3 so the headline sits at the same vertical position.
const TopSpacer = styled.View`flex: 0.2;`;

// BottomSpacer — absorbs remaining space below the content group, pinning
// the CTA to the bottom of the screen.
const BottomSpacer = styled.View`flex: 1;`;

// ContentGroup — wraps icon, headline, and subtext as one centred unit so
// the whole block moves together in the vertical layout.
const ContentGroup = styled.View`
  align-items: center;
  width: 100%;
`;

// CheckCircle — frosted green ring that frames the completion icon.
// Scales up on tablets so the icon stays proportional to the larger headline.
const CheckCircle = styled.View<TabletProps>`
  width: ${({ $isTablet }) => ($isTablet ? 100 : 72)}px;
  height: ${({ $isTablet }) => ($isTablet ? 100 : 72)}px;
  border-radius: ${({ $isTablet }) => ($isTablet ? 50 : 36)}px;
  background-color: rgba(128, 175, 129, 0.22);
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const CheckIcon = styled.Text<TabletProps>`
  font-size: ${({ $isTablet }) => ($isTablet ? 44 : 32)}px;
`;

// Headline — the step's main heading. Uses fontHeaderHeavy and tablet-aware
// sizing to match Steps 1–3's typographic scale exactly.
const Headline = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: ${({ $isTablet }) => ($isTablet ? 76 : 50)}px;
  color: #ffffff;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 90 : 60)}px;
`;

// Subtext — supporting copy below the headline. Matches Steps 1–3 styling exactly.
const Subtext = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyMedium};
  font-size: ${({ $isTablet }) => ($isTablet ? 17 : 11)}px;
  color: rgba(255, 255, 255, 0.48);
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 28 : 18)}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  margin-top: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px;
`;

// CtaButton — the only exit from the welcome flow. Disabled while submitting
// to prevent double-taps from firing two Supabase writes. Scales on tablet
// to match Steps 1–3.
const CtaButton = styled(Pressable)<TabletProps & { $disabled: boolean }>`
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet }) => ($isTablet ? '22px 18px' : '14px 12px')};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  opacity: ${({ $disabled }) => ($disabled ? 0.60 : 1)};
`;

// CtaLabel — button text, scales from 14px to 22px on tablets.
const CtaLabel = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ $isTablet }) => ($isTablet ? 22 : 14)}px;
  color: #D6EFD8;
  text-align: center;
`;

// ErrorText — shown inline above the CTA when the Supabase write fails.
// Never exposes the internal error message — a generic string only (MASVS-CODE-4).
const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.errorOnDark};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

// WelcomeStep4 — the closing screen of the welcome flow.
// The only CTA here is "Start Growing", which commits the welcome-seen flag
// to the database. If the write fails the user stays on this screen and sees
// an error so they can try again — we never silently drop them into the tabs.
const WelcomeStep4 = ({ onFinish, isSubmitting, errorMessage }: WelcomeStep4Props) => {
  const isTablet = useIsTablet();

  return (
    <ContentArea $isTablet={isTablet}>
      <TopSpacer />
      <ContentGroup>
        <CheckCircle $isTablet={isTablet}>
          <CheckIcon $isTablet={isTablet}>✅</CheckIcon>
        </CheckCircle>
        <Headline $isTablet={isTablet}>You're all set.</Headline>
        <Subtext $isTablet={isTablet}>
          Your first task is already waiting. Let's see what your lawn needs today.
        </Subtext>
      </ContentGroup>
      <BottomSpacer />
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      <CtaButton
        $isTablet={isTablet}
        onPress={onFinish}
        $disabled={isSubmitting}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Start Growing"
        accessibilityState={{ busy: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#D6EFD8" />
        ) : (
          <CtaLabel $isTablet={isTablet}>Start Growing →</CtaLabel>
        )}
      </CtaButton>
    </ContentArea>
  );
};

export default WelcomeStep4;
