import styled, { useTheme } from 'styled-components/native';
import { CtaButton } from '~/shared/components/CtaButton';
import { GlassCard } from '~/shared/components/GlassCard';
import { GlassDivider } from '~/shared/components/GlassDivider';
import {
  BottomSpacer,
  ContentArea,
  ContentGroup,
  GapSpacer,
  TopSpacer,
} from '~/shared/components/ScreenLayout';
import { ScreenHeadline, ScreenSubtext } from '~/shared/components/ScreenTypography';

const LAWN_BG = require('../../../../assets/images/lawn-android.jpg') as number;

interface WelcomeStep3Props {
  onNext: () => void;
}

// OptionsGroup — cancels out GlassCard's 16px Content padding so each
// NavPill's background can extend edge-to-edge inside the card.
const OptionsGroup = styled.View`
  margin: -${({ theme }) => theme.spacing.md}px;
`;

// NavPill — one row describing a single tab, rendered inside the shared
// GlassCard. No individual background or border-radius — the card surface
// and GlassDividers between rows provide the visual structure.
const NavPill = styled.View`
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
  const theme = useTheme();

  return (
    <ContentArea>
      <TopSpacer />
      <ContentGroup>
        <ScreenHeadline>Four tabs,{'\n'}four tools.</ScreenHeadline>
        <ScreenSubtext>
          Each tab handles a different part of your lawn care routine.
        </ScreenSubtext>
        <GapSpacer size="pills" />
        <GlassCard
          variant="clear"
          clearBackdropSource={LAWN_BG}
          clearBackdropTint={theme.colors.onboardingPhotoTint}
        >
          <OptionsGroup>
            <NavPill>
              <NavPillIcon>🌅</NavPillIcon>
              <NavPillBody>
                <NavPillName>Today</NavPillName>
                <NavPillDesc>Your daily task and streak</NavPillDesc>
              </NavPillBody>
            </NavPill>
            <GlassDivider />
            <NavPill>
              <NavPillIcon>📋</NavPillIcon>
              <NavPillBody>
                <NavPillName>Tasks</NavPillName>
                <NavPillDesc>See what's coming up this month</NavPillDesc>
              </NavPillBody>
            </NavPill>
            <GlassDivider />
            <NavPill>
              <NavPillIcon>📖</NavPillIcon>
              <NavPillBody>
                <NavPillName>Learn</NavPillName>
                <NavPillDesc>Beginner-friendly lawn guides</NavPillDesc>
              </NavPillBody>
            </NavPill>
            <GlassDivider />
            <NavPill>
              <NavPillIcon>👤</NavPillIcon>
              <NavPillBody>
                <NavPillName>Profile</NavPillName>
                <NavPillDesc>Your lawn info and settings</NavPillDesc>
              </NavPillBody>
            </NavPill>
          </OptionsGroup>
        </GlassCard>
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
