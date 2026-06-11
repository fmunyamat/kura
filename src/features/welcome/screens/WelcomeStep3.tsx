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

interface WelcomeStep3Props {
  onNext: () => void;
}

// NavPills — the stack of four tab-description cards.
const NavPills = styled.View`gap: ${({ theme }) => theme.spacing.sm + 2}px;`;

// NavPill — one small frosted card describing a single tab. Uses the same
// glassFrostPanel token as the shared GlassCard but stays a local component:
// its border-radius is deliberately 2px tighter than GlassCard's because four
// stacked pills read better with slightly sharper corners than one big card.
const NavPill = styled.View`
  background-color: ${({ theme }) => theme.colors.glassFrostPanel};
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

// WelcomeStep3 — introduces the four navigation tabs.
// Pairs a description pill for each tab with a live-looking tab bar preview
// at the bottom so the user recognises it immediately when they enter the app.
// Layout, headline, subtext, and the CTA all come from the shared screen
// components; the pills gap uses the smaller 'pills' GapSpacer because four
// pills take more vertical space than one card.
const WelcomeStep3 = ({ onNext }: WelcomeStep3Props) => {
  return (
    <ContentArea>
      <TopSpacer />
      <ContentGroup>
        <ScreenHeadline>Four tabs,{'\n'}four tools.</ScreenHeadline>
        <ScreenSubtext>
          Each tab handles a different part of your lawn care routine.
        </ScreenSubtext>
        <GapSpacer size="pills" />
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
        label="Next →"
        onPress={onNext}
        accessibilityLabel="Next, move to final step"
        withBottomGap
      />
    </ContentArea>
  );
};

export default WelcomeStep3;
