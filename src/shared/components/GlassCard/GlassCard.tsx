import { BackdropBlur, Canvas, Fill } from '@shopify/react-native-skia';
import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, StyleSheet } from 'react-native';
import styled from 'styled-components/native';

interface GlassCardProps {
  children: ReactNode;
  // blur is the Gaussian sigma passed directly to Skia's BackdropBlur.
  // 10 gives a soft frosted-glass look; increase for heavier blur.
  blur?: number;
}

// Clip — a rounded View that clips the Skia canvas and children to the card
// boundary. overflow: hidden is what makes the border-radius actually cut off
// the blur canvas's corners, so we don't need to round the clip inside Skia.
const Clip = styled.View`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.borderOnDark};
`;

// Content — sits above the Skia blur canvas and provides inner padding and
// spacing between top-level child sections.
const Content = styled.View`
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

// GlassCard — a frosted-glass card container for the sign-in screen.
// Uses React Native Skia's BackdropBlur to sample and blur whatever is rendered
// behind the card in the native layer (the full-bleed background photo), then
// adds a faint white tint via Fill to lift the card off the background.
//
// The Canvas must be sized explicitly in pixels, so we measure the card via
// onLayout and delay rendering the Canvas until we have real dimensions.
// The Canvas is absolutely positioned behind Content so layout is driven by
// Content, not the Canvas.
const GlassCard = ({ children, blur = 10 }: GlassCardProps) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setSize({ width: nativeEvent.layout.width, height: nativeEvent.layout.height });
  };

  return (
    <Clip onLayout={handleLayout}>
      {/* Skia canvas — absolutely fills the card, renders behind Content.
          BackdropBlur blurs what's behind this entire view in the compositing
          tree. The clip rect covers the full canvas; Clip's overflow:hidden
          handles the rounded-corner cutoff so we pass a plain rect here. */}
      {size.width > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          <BackdropBlur
            blur={blur}
            clip={{ x: 0, y: 0, width: size.width, height: size.height }}
          >
            {/* Faint white tint so the card reads as a distinct glass surface
                over the blurred photo backdrop. */}
            <Fill color="rgba(255, 255, 255, 0.06)" />
          </BackdropBlur>
        </Canvas>
      )}
      <Content>{children}</Content>
    </Clip>
  );
};

export default GlassCard;