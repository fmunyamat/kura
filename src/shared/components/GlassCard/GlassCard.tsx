import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { ComponentProps, ReactNode } from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';

// 'frost' — the original heavy white frost (welcome + onboarding cards).
// 'clear' — a near-invisible pane of blurred glass used on the sign-in
// screen, where the mowing photo behind the card stays the visual hero.
type GlassCardVariant = 'frost' | 'clear';

// The shape expo-image accepts for its source prop (require() result or URI).
type CardImageSource = ComponentProps<typeof Image>['source'];

interface GlassCardProps {
  children: ReactNode;
  variant?: GlassCardVariant;
  // clearBackdropSource / clearBackdropTint — Android only, for the 'clear'
  // variant. Android cannot blur the screen behind interactive content: its
  // snapshot-based blur re-captures every control drawn on top of the blur
  // area and paints a blurred ghost of it back behind itself (a glowing halo
  // on each element). So on Android we fake the glass instead — the caller
  // passes the same photo the screen draws behind the card plus the screen's
  // tint colour, and the card renders a blurred copy of that photo inside
  // itself. Through this much blur the fake is indistinguishable from real
  // backdrop blur, and nothing is snapshotted, so nothing glows.
  clearBackdropSource?: CardImageSource;
  clearBackdropTint?: string;
}

// Clip — rounded container clipped to its border-radius. overflow: hidden
// ensures children with backgrounds (inputs, rows) don't bleed past the
// rounded corners, and crops the blur/photo layers used by the clear variant.
// The clear variant has no background of its own (the layers underneath
// provide the surface) and draws a 1px white border that is brighter along
// the top edge than the bottom — mimicking light catching the top of a real
// pane of glass.
const Clip = styled.View<{ $variant: GlassCardVariant }>`
  background-color: ${({ $variant }) =>
    $variant === 'clear' ? 'transparent' : 'rgba(255, 255, 255, 0.44)'};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 0px;
  border-color: ${({ theme }) => theme.colors.glassClearEdge};
  border-bottom-color: ${({ theme }) => theme.colors.glassClearEdgeBottom};
`;

// BlurPane — iOS only. Real backdrop blur: the system samples whatever is
// rendered behind the card (the sign-in photo) and blurs it live. Content
// renders as children on top of the blur.
const BlurPane = styled(BlurView)``;

// FrostedPhoto — Android's stand-in for backdrop blur. A heavily blurred
// copy of the screen's own background photo, cover-fitted to the card. It is
// not pixel-aligned with the photo behind the card, but at this blur radius
// the image is an abstract wash of colour, so the eye reads it as the photo
// showing through frosted glass.
const FrostedPhoto = styled(Image)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// BackdropScrim — Android only. Re-applies the screen's dark photo tint on
// top of the blurred photo copy, so the faked backdrop has the same darkness
// as the real (tinted) photo visible around the card.
const BackdropScrim = styled.View<{ $color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ $color }) => $color};
`;

// TintFill — a whisper of white (10%) layered between the blur and the
// content so the pane reads as bright glass instead of a blurry hole punched
// in the photo.
const TintFill = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.glassClearPanel};
`;

// Content — inner padding and gap that gives breathing room between
// the card's child elements (form, divider, social buttons).
const Content = styled.View`
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

// GlassCard — frosted card used on the sign-in, welcome, and onboarding
// screens. The default 'frost' variant is a solid 44% white tint matching the
// onboarding FormCard / OptionsCard. The 'clear' variant is a transparent
// pane with a luminous top edge: real backdrop blur on iOS, and a blurred
// copy of the screen's photo on Android (see clearBackdropSource above for
// why Android cannot use real blur here).
export const GlassCard = ({
  children,
  variant = 'frost',
  clearBackdropSource,
  clearBackdropTint,
}: GlassCardProps) => {
  if (variant !== 'clear') {
    return (
      <Clip $variant="frost">
        <Content>{children}</Content>
      </Clip>
    );
  }

  if (Platform.OS === 'android') {
    return (
      <Clip $variant="clear">
        {clearBackdropSource !== undefined && (
          <FrostedPhoto source={clearBackdropSource} blurRadius={2} contentFit="cover" />
        )}
        {clearBackdropTint !== undefined && <BackdropScrim $color={clearBackdropTint} />}
        <TintFill />
        <Content>{children}</Content>
      </Clip>
    );
  }

  return (
    <Clip $variant="clear">
      <BlurPane intensity={15} tint="default">
        <TintFill />
        <Content>{children}</Content>
      </BlurPane>
    </Clip>
  );
};

export default GlassCard;
