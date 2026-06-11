import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import { useIsTablet, type TabletProps } from '~/shared/hooks/use-is-tablet';

interface WelcomeStep1Props {
  // userName — the user's first name from their profile, used in the greeting.
  userName: string;
  onNext: () => void;
}

// ContentArea — flex column that fills the space below the shared dots row.
// On tablets, horizontal padding increases so content doesn't stretch edge-to-edge.
const ContentArea = styled.View<TabletProps>`
  flex: 1;
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px;
`;

// Spacer32 — gap between subtext and glass card; taller on tablets.
const Spacer32 = styled.View<TabletProps>`
  height: ${({ $isTablet }) => ($isTablet ? 100 : 60)}px;
`;

// TopSpacer — controls how far down from the step label the content group starts.
// Lower flex = content sits higher on screen.
const TopSpacer = styled.View`flex: 0.2;`;
// BottomSpacer — absorbs the remaining space below the content group, pushing
// the CTA down to the bottom of the screen.
const BottomSpacer = styled.View`flex: 1;`;

// ContentGroup — wraps everything from the headline block to the glass card so
// the whole unit moves as one in the vertical layout.
const ContentGroup = styled.View``;

// HeadlineGroup — column that holds the three headline lines.
// gap scales up on tablets to maintain visual breathing between the larger lines.
const HeadlineGroup = styled.View<TabletProps>`
  gap: ${({ $isTablet }) => ($isTablet ? 12 : 6)}px;
`;

// Headline — one line of the three-part welcome heading.
// font-size and line-height both scale so the heading fills the wider tablet canvas.
const Headline = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: ${({ $isTablet }) => ($isTablet ? 76 : 50)}px;
  color: #ffffff;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 90 : 60)}px;
`;

// Subtext — supporting copy below the headline in body-medium weight, muted white.
// Scales from 11px (phone) to 17px (tablet) so it stays readable against the headline.
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

// GlassCard — white-frosted panel that holds the "Your journey starts today"
// content. Padding and internal gap scale up so the card doesn't feel cramped
// when rendered at tablet size.
const GlassCard = styled.View<TabletProps>`
  background-color: rgba(255, 255, 255, 0.44);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  padding: ${({ $isTablet }) => ($isTablet ? 26 : 16)}px;
  flex-direction: row;
  align-items: center;
  gap: ${({ $isTablet }) => ($isTablet ? 22 : 12)}px;
`;

// CardIcon — large emoji on the left of the glass card; scales with the card.
const CardIcon = styled.Text<TabletProps>`
  font-size: ${({ $isTablet }) => ($isTablet ? 48 : 32)}px;
`;

// CardBody — the text column inside the glass card.
const CardBody = styled.View`flex: 1;`;

// CardTitle — small header inside the glass card using the header font.
// Scales from 17px to 26px on tablets so it reads clearly at the larger card size.
const CardTitle = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: ${({ $isTablet }) => ($isTablet ? 22 : 14)}px;
  color: #ffffff;
`;

// CardDesc — supporting body copy inside the glass card.
// Scales from 14px to 21px on tablets; line-height grows proportionally.
const CardDesc = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: ${({ $isTablet }) => ($isTablet ? 17 : 11)}px;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 2px;
  line-height: ${({ $isTablet }) => ($isTablet ? 27 : 17)}px;
`;

// CtaButton — dark pill at the bottom of the screen, the only tap target
// that advances the flow. Padding grows on tablets so the touch target stays
// large relative to the screen height.
const CtaButton = styled(Pressable)<TabletProps>`
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet }) => ($isTablet ? '22px 18px' : '14px 12px')};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

// CtaLabel — text inside the CTA button; scales from 14px to 22px on tablets.
const CtaLabel = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ $isTablet }) => ($isTablet ? 22 : 14)}px;
  color: #D6EFD8;
  text-align: center;
`;

// WelcomeStep1 — the opening welcome screen.
// Greets the user by first name, sets the tone ("no experience needed"),
// and shows a glass card summarising what Kura will do for them each morning.
// isTablet comes from the shared device-type hook and is threaded through
// every element so scaling is consistent — nothing picks its own breakpoint.
const WelcomeStep1 = ({ userName, onNext }: WelcomeStep1Props) => {
  const isTablet = useIsTablet();

  return (
    <ContentArea $isTablet={isTablet}>
      <TopSpacer />
      <ContentGroup>
        <HeadlineGroup $isTablet={isTablet}>
          <Headline $isTablet={isTablet}>Welcome</Headline>
          <Headline $isTablet={isTablet}>to Kura,</Headline>
          <Headline $isTablet={isTablet}>{userName}.</Headline>
        </HeadlineGroup>
        <Subtext $isTablet={isTablet}>
          We'll help you grow a healthier lawn — one simple task at a time. No experience needed.
        </Subtext>
        <Spacer32 $isTablet={isTablet} />
        <GlassCard $isTablet={isTablet}>
          <CardIcon $isTablet={isTablet}>🌱</CardIcon>
          <CardBody>
            <CardTitle $isTablet={isTablet}>Your journey starts today</CardTitle>
            <CardDesc $isTablet={isTablet}>
              We'll check in with you each morning with one thing to do.
            </CardDesc>
          </CardBody>
        </GlassCard>
      </ContentGroup>
      <BottomSpacer />
      <CtaButton
        $isTablet={isTablet}
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Let's go, move to next step"
      >
        <CtaLabel $isTablet={isTablet}>Let's go →</CtaLabel>
      </CtaButton>
    </ContentArea>
  );
};

export default WelcomeStep1;
