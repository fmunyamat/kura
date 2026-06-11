import { ReactNode } from 'react';
import styled from 'styled-components/native';
import { useIsTablet } from '~/shared/hooks/use-is-tablet';

// The welcome and onboarding screens all open with the same big white heading
// over a dark photo or gradient, with a faint supporting line underneath.
// These two components are that pair, extracted so every screen renders the
// exact same typography instead of each file keeping its own copy.

// size — which headline scale to use:
//   'display' — the largest scale, used by the welcome flow (50px phone / 76px tablet)
//   'title'   — one step smaller, used by the onboarding screens (42px phone / 64px tablet)
type HeadlineSize = 'display' | 'title';

interface ScreenHeadlineProps {
  size?: HeadlineSize;
  children: ReactNode;
}

// tone — how bright the subtext reads:
//   'faint' — white at 48%, used over the welcome flow's photo background
//   'muted' — white at 60% (the textMutedOnDark token), used by the option
//             screens whose busier glass cards need slightly stronger copy
type SubtextTone = 'faint' | 'muted';

interface ScreenSubtextProps {
  tone?: SubtextTone;
  children: ReactNode;
}

// HEADLINE_SCALE — font-size and line-height for each size, phone vs tablet.
// Kept in one table so the two scales can be compared at a glance.
const HEADLINE_SCALE = {
  display: { phone: { size: 50, line: 60 }, tablet: { size: 76, line: 90 } },
  title: { phone: { size: 42, line: 50 }, tablet: { size: 64, line: 76 } },
} as const;

// HeadlineText — the styled heading itself. White, heavy header font, centered,
// tight letter spacing. Receives the already-resolved size numbers so the
// styled-component stays a plain lookup with no branching of its own.
const HeadlineText = styled.Text<{ $size: number; $line: number }>`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: ${({ $size }) => $size}px;
  color: ${({ theme }) => theme.colors.white};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ $line }) => $line}px;
`;

// SubtextText — the faint supporting copy. Body-medium font in a low-opacity
// white so it sits quietly under the headline; margin-top gives it a fixed
// breathing gap from the heading above.
const SubtextText = styled.Text<{ $isTablet: boolean; $tone: SubtextTone }>`
  font-family: ${({ theme }) => theme.typography.fontBodyMedium};
  font-size: ${({ $isTablet }) => ($isTablet ? 17 : 11)}px;
  color: ${({ theme, $tone }) =>
    $tone === 'muted' ? theme.colors.textMutedOnDark : theme.colors.subtextOnPhoto};
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 28 : 18)}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  margin-top: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px;
`;

// ScreenHeadline — one line of a screen's main heading. Looks up the device
// type itself so callers never thread $isTablet through. Screens that stack
// multiple heading lines (like WelcomeStep1) just render one per line.
export const ScreenHeadline = ({ size = 'display', children }: ScreenHeadlineProps) => {
  const isTablet = useIsTablet();
  const scale = HEADLINE_SCALE[size][isTablet ? 'tablet' : 'phone'];
  return (
    <HeadlineText $size={scale.size} $line={scale.line}>
      {children}
    </HeadlineText>
  );
};

// ScreenSubtext — the supporting sentence under a ScreenHeadline.
export const ScreenSubtext = ({ tone = 'faint', children }: ScreenSubtextProps) => {
  const isTablet = useIsTablet();
  return (
    <SubtextText $isTablet={isTablet} $tone={tone}>
      {children}
    </SubtextText>
  );
};
