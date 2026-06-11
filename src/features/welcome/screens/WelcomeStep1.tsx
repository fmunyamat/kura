import styled from 'styled-components/native';
import { CtaButton } from '~/shared/components/CtaButton';
import {
  BottomSpacer,
  ContentArea,
  ContentGroup,
  GapSpacer,
  TopSpacer,
} from '~/shared/components/ScreenLayout';
import { ScreenHeadline, ScreenSubtext } from '~/shared/components/ScreenTypography';
import { useIsTablet, type TabletProps } from '~/shared/hooks/use-is-tablet';

interface WelcomeStep1Props {
  // userName — the user's first name from their profile, used in the greeting.
  userName: string;
  onNext: () => void;
}

// HeadlineGroup — column that holds the three headline lines.
// gap scales up on tablets to maintain visual breathing between the larger lines.
const HeadlineGroup = styled.View<TabletProps>`
  gap: ${({ $isTablet }) => ($isTablet ? 12 : 6)}px;
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

// WelcomeStep1 — the opening welcome screen.
// Greets the user by first name, sets the tone ("no experience needed"),
// and shows a glass card summarising what Kura will do for them each morning.
// Layout, headline, subtext, and the CTA all come from the shared screen
// components so every step renders the identical skeleton.
const WelcomeStep1 = ({ userName, onNext }: WelcomeStep1Props) => {
  const isTablet = useIsTablet();

  return (
    <ContentArea>
      <TopSpacer />
      <ContentGroup>
        <HeadlineGroup $isTablet={isTablet}>
          <ScreenHeadline>Welcome</ScreenHeadline>
          <ScreenHeadline>to Kura,</ScreenHeadline>
          <ScreenHeadline>{userName}.</ScreenHeadline>
        </HeadlineGroup>
        <ScreenSubtext>
          We'll help you grow a healthier lawn — one simple task at a time. No experience needed.
        </ScreenSubtext>
        <GapSpacer />
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
        label="Let's go →"
        onPress={onNext}
        accessibilityLabel="Let's go, move to next step"
        withBottomGap
      />
    </ContentArea>
  );
};

export default WelcomeStep1;
