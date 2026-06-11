import styled from 'styled-components/native';
import { CtaButton } from '~/shared/components/CtaButton';
import { ErrorMessage } from '~/shared/components/ErrorMessage';
import { BottomSpacer, ContentArea, TopSpacer } from '~/shared/components/ScreenLayout';
import { ScreenHeadline, ScreenSubtext } from '~/shared/components/ScreenTypography';
import { useIsTablet, type TabletProps } from '~/shared/hooks/use-is-tablet';

interface WelcomeStep4Props {
  // onFinish — async handler that writes has_seen_welcome and routes to tabs.
  // WelcomeFlow owns the try/catch; WelcomeStep4 just reports isSubmitting state.
  onFinish: () => Promise<void>;
  isSubmitting: boolean;
  errorMessage: string | null;
}

// CenteredContentGroup — unlike the other steps' plain ContentGroup, this one
// centres the icon, headline, and subtext as one unit, and spans the full
// width so the centring works inside the centered ContentArea.
const CenteredContentGroup = styled.View`
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

// WelcomeStep4 — the closing screen of the welcome flow.
// The only CTA here is "Start Growing", which commits the welcome-seen flag
// to the database. If the write fails the user stays on this screen and sees
// an error so they can try again — we never silently drop them into the tabs.
// Layout, headline, subtext, and the CTA all come from the shared screen
// components; the CTA shows its loading spinner while the write is in flight.
const WelcomeStep4 = ({ onFinish, isSubmitting, errorMessage }: WelcomeStep4Props) => {
  const isTablet = useIsTablet();

  return (
    <ContentArea centered>
      <TopSpacer />
      <CenteredContentGroup>
        <CheckCircle $isTablet={isTablet}>
          <CheckIcon $isTablet={isTablet}>✅</CheckIcon>
        </CheckCircle>
        <ScreenHeadline>You're all set.</ScreenHeadline>
        <ScreenSubtext>
          Your first task is already waiting. Let's see what your lawn needs today.
        </ScreenSubtext>
      </CenteredContentGroup>
      <BottomSpacer />
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      <CtaButton
        label="Start Growing →"
        onPress={onFinish}
        isLoading={isSubmitting}
        accessibilityLabel="Start Growing"
        fullWidth
        withBottomGap
      />
    </ContentArea>
  );
};

export default WelcomeStep4;
