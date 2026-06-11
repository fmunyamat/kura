import { Pressable, useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';

interface WelcomeStep3Props {
  onNext: () => void;
}

// $isTablet — passed to every styled-component that needs to scale up on tablets.
// Threshold matches the app-wide convention: min(width, height) >= 600.
interface TabletProps {
  $isTablet: boolean;
}

// ContentArea — flex column that fills the space below the shared nav bar.
// On tablets, horizontal padding increases so content doesn't stretch edge-to-edge.
const ContentArea = styled.View<TabletProps>`
  flex: 1;
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px;
`;

// TopSpacer — pushes the content group down slightly from the NavBar.
// flex: 0.2 matches Steps 1 and 2 so the headline sits at the same vertical position.
const TopSpacer = styled.View`flex: 0.2;`;

// BottomSpacer — absorbs remaining space below the content group, sitting
// between the pills and the tab bar preview so they don't crowd each other.
const BottomSpacer = styled.View`flex: 1;`;

// ContentGroup — wraps headline through nav pills as one unit so the whole
// block moves together in the vertical layout.
const ContentGroup = styled.View``;

// SpacerPills — gap between the subtext and the pill stack. Smaller than the
// SpacerCard used in Steps 1–2 because four pills take more vertical space than
// one card, so we give back some room here to avoid crowding.
const SpacerPills = styled.View<TabletProps>`
  height: ${({ $isTablet }) => ($isTablet ? 48 : 24)}px;
`;

// Headline — the step's main heading. Uses fontHeaderHeavy and tablet-aware
// sizing to match Steps 1 and 2's typographic scale exactly.
const Headline = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: ${({ $isTablet }) => ($isTablet ? 76 : 50)}px;
  color: #ffffff;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 90 : 60)}px;
`;

// Subtext — supporting copy below the headline in body-medium weight, muted white.
// Matches Steps 1 and 2 Subtext styling exactly.
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

// NavPills — the stack of four tab-description cards.
const NavPills = styled.View`gap: ${({ theme }) => theme.spacing.sm + 2}px;`;

// NavPill — one glass card describing a single tab. Padding, gap, and
// border-radius match the GlassCard (Step 1) and TaskCard (Step 2).
const NavPill = styled.View`
  background-color: rgba(255, 255, 255, 0.44);
  border-radius: ${({ theme }) => theme.radii.lg - 2}px;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

// NavPillIcon — emoji on the left of each pill. Matches CardIcon/TaskIcon size.
const NavPillIcon = styled.Text`font-size: 32px;`;

const NavPillBody = styled.View`flex: 1;`;

// NavPillName — tab label inside each pill. Uses fontHeaderBold and white text
// to match CardTitle (Step 1) and TaskName (Step 2).
const NavPillName = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 14px;
  color: #ffffff;
`;

// NavPillDesc — supporting description below the tab name. Uses fontBody and
// muted white to match CardDesc (Step 1) and TaskMeta (Step 2).
const NavPillDesc = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 2px;
  line-height: 17px;
`;

// TabBarWrapper — sits between BottomSpacer and the CTA. Bottom padding
// adds a little breathing room above the CTA button.
const TabBarWrapper = styled.View`
  padding: 0 0 14px;
`;

// TabBar — pill-shaped mock tab bar. Shows the user what the nav they're
// about to use actually looks like — not a functional navigator, just a preview.
const TabBar = styled.View`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding: 6px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.full}px;
`;

// TabItem — one tab button in the mock bar.
const TabItem = styled.View`
  align-items: center;
  gap: 1px;
`;

// TabIconWrapper — tinted backing pill shown only for the active (Today) tab.
const TabIconWrapper = styled.View<{ $active: boolean }>`
  padding: 4px 13px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  ${({ $active }) => ($active ? 'background-color: rgba(214, 239, 216, 0.18);' : '')}
`;

const TabIcon = styled.Text`font-size: 15px;`;

// TabLabel — small text below each tab icon. Active tab is white; inactive is muted.
const TabLabel = styled.Text<{ $active: boolean }>`
  font-size: 7.5px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: ${({ $active }) => ($active ? '#D6EFD8' : 'rgba(255,255,255,0.28)')};
`;

// The four tabs shown in the preview bar.
const TABS = [
  { icon: '🏠', label: 'Today',   active: true  },
  { icon: '✅', label: 'Tasks',   active: false },
  { icon: '📚', label: 'Learn',   active: false },
  { icon: '⚙️', label: 'Profile', active: false },
];

// CtaButton — dark full-width pill, scales on tablet to match Steps 1 and 2.
const CtaButton = styled(Pressable)<TabletProps>`
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet }) => ($isTablet ? '22px 18px' : '14px 12px')};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

// CtaLabel — button text, scales from 14px to 22px on tablets.
const CtaLabel = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ $isTablet }) => ($isTablet ? 22 : 14)}px;
  color: #D6EFD8;
  text-align: center;
`;

// WelcomeStep3 — introduces the four navigation tabs.
// Pairs a description pill for each tab with a live-looking tab bar preview
// at the bottom so the user recognises it immediately when they enter the app.
// Layout and typography match Steps 1 and 2 exactly.
const WelcomeStep3 = ({ onNext }: WelcomeStep3Props) => {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  return (
    <ContentArea $isTablet={isTablet}>
      <TopSpacer />
      <ContentGroup>
        <Headline $isTablet={isTablet}>Four tabs,{'\n'}four tools.</Headline>
        <Subtext $isTablet={isTablet}>
          Each tab handles a different part of your lawn care routine.
        </Subtext>
        <SpacerPills $isTablet={isTablet} />
        <NavPills>
          <NavPill>
            <NavPillIcon>🌅</NavPillIcon>
            <NavPillBody>
              <NavPillName>Today</NavPillName>
              <NavPillDesc>Your daily task and streak</NavPillDesc>
            </NavPillBody>
          </NavPill>
          <NavPill>
            <NavPillIcon>📋</NavPillIcon>
            <NavPillBody>
              <NavPillName>Tasks</NavPillName>
              <NavPillDesc>See what's coming up this month</NavPillDesc>
            </NavPillBody>
          </NavPill>
          <NavPill>
            <NavPillIcon>📖</NavPillIcon>
            <NavPillBody>
              <NavPillName>Learn</NavPillName>
              <NavPillDesc>Beginner-friendly lawn guides</NavPillDesc>
            </NavPillBody>
          </NavPill>
          <NavPill>
            <NavPillIcon>👤</NavPillIcon>
            <NavPillBody>
              <NavPillName>Profile</NavPillName>
              <NavPillDesc>Your lawn info and settings</NavPillDesc>
            </NavPillBody>
          </NavPill>
        </NavPills>
      </ContentGroup>
      <BottomSpacer />
      <TabBarWrapper>
        <TabBar>
          {TABS.map(({ icon, label, active }) => (
            <TabItem key={label}>
              <TabIconWrapper $active={active}>
                <TabIcon>{icon}</TabIcon>
              </TabIconWrapper>
              <TabLabel $active={active}>{label}</TabLabel>
            </TabItem>
          ))}
        </TabBar>
      </TabBarWrapper>
      <CtaButton
        $isTablet={isTablet}
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Next, move to final step"
      >
        <CtaLabel $isTablet={isTablet}>Next →</CtaLabel>
      </CtaButton>
    </ContentArea>
  );
};

export default WelcomeStep3;
