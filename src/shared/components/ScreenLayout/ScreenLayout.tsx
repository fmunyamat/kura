import { ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useIsTablet } from '~/shared/hooks/use-is-tablet';

// ScreenLayout — the vertical skeleton every welcome and onboarding screen is
// built from. Each screen used to keep its own copies of these pieces; they are
// extracted here so the spacing rhythm is defined exactly once.
//
// The skeleton, top to bottom:
//   <ContentArea>           — fills the screen, sets the side padding
//     <TopSpacer />         — small flexible gap pushing content below the nav
//     <ContentGroup>        — headline + subtext + card move as one unit
//       ...
//       <GapSpacer />       — fixed gap between the text block and the card
//       ...
//     </ContentGroup>
//     <BottomSpacer />      — absorbs the rest, pinning the CTA to the bottom
//     (CTA button)
//   </ContentArea>

interface ContentAreaProps {
  // column — switches the side padding style. false (default) uses spacing
  // tokens (xxl on tablet, md on phone). true makes the content a centered
  // 80% column on tablets by using 10% of the window width per side — this is
  // how the form/option screens line up with the sign-in card's width.
  column?: boolean;
  // centered — centers children horizontally (WelcomeStep4's icon layout).
  centered?: boolean;
  children: ReactNode;
}

interface CtaAreaProps {
  // column — same side-padding switch as ContentArea, so the pinned CTA lines
  // up with the content above it.
  column?: boolean;
  children: ReactNode;
}

interface GapSpacerProps {
  // size — which fixed gap to render:
  //   'card'  — the tall gap between subtext and the glass card (60px / 100px)
  //   'pills' — the short gap above WelcomeStep3's nav pills (24px / 48px)
  size?: 'card' | 'pills';
}

// ContentAreaView — receives the side padding already resolved to a number so
// the styled-component itself has no branching.
const ContentAreaView = styled.View<{ $sidePadding: number; $centered: boolean }>`
  flex: 1;
  padding: 0 ${({ $sidePadding }) => $sidePadding}px;
  ${({ $centered }) => ($centered ? 'align-items: center;' : '')}
`;

// CtaAreaView — side padding matching ContentArea plus a fixed md bottom pad,
// used by screens that pin the CTA outside a scrolling content area.
const CtaAreaView = styled.View<{ $sidePadding: number }>`
  padding: 0 ${({ $sidePadding }) => $sidePadding}px
    ${({ theme }) => theme.spacing.md}px;
`;

const GapSpacerView = styled.View<{ $height: number }>`
  height: ${({ $height }) => $height}px;
`;

// resolveSidePadding — one place that decides how far content sits from the
// screen edges: phones always use the md token; tablets use either the xxl
// token or, in column mode, 10% of the window width per side.
const useSidePadding = (column: boolean): number => {
  const theme = useTheme();
  const isTablet = useIsTablet();
  const { width } = useWindowDimensions();
  if (!isTablet) return theme.spacing.md;
  return column ? width * 0.1 : theme.spacing.xxl;
};

// ContentArea — the screen-filling column that everything else sits inside.
export const ContentArea = ({ column = false, centered = false, children }: ContentAreaProps) => {
  const sidePadding = useSidePadding(column);
  return (
    <ContentAreaView $sidePadding={sidePadding} $centered={centered}>
      {children}
    </ContentAreaView>
  );
};

// CtaArea — wrapper for a CTA pinned below scrolling content.
export const CtaArea = ({ column = false, children }: CtaAreaProps) => {
  const sidePadding = useSidePadding(column);
  return <CtaAreaView $sidePadding={sidePadding}>{children}</CtaAreaView>;
};

// GapSpacer — a fixed-height gap that grows on tablets.
export const GapSpacer = ({ size = 'card' }: GapSpacerProps) => {
  const isTablet = useIsTablet();
  const height = size === 'card' ? (isTablet ? 100 : 60) : isTablet ? 48 : 24;
  return <GapSpacerView $height={height} />;
};

// TopSpacer — small flexible gap above the content group. Low flex keeps the
// headline sitting high on the screen.
export const TopSpacer = styled.View`
  flex: 0.2;
`;

// BottomSpacer — absorbs all remaining space below the content group so the
// CTA lands at the bottom of the screen.
export const BottomSpacer = styled.View`
  flex: 1;
`;

// ContentGroup — groups the headline block and card so they move as one unit
// between the two spacers.
export const ContentGroup = styled.View``;
