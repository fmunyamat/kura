// ConfettiBurst — the celebration shower that rains down once the deck is
// cleared. It builds 30 pieces with randomised colour, position, speed, and
// delay on first render (frozen in useMemo so they don't reshuffle each frame),
// then lets each piece animate itself. The whole layer ignores touches.

import { useMemo } from 'react';
import styled, { useTheme } from 'styled-components/native';

import { ConfettiPiece } from './ConfettiPiece';

const PIECE_COUNT = 30;

// Layer — fills the screen above everything so pieces fall over the cards.
const Layer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
`;

export const ConfettiBurst = () => {
  const { colors } = useTheme();

  // Freeze the random parameters once so the burst is stable across renders.
  const pieces = useMemo(() => {
    const palette = [colors.accentPrimary, colors.accentText, colors.trackTo, colors.textPhotoHeading];
    return Array.from({ length: PIECE_COUNT }, (_, index) => ({
      id: index,
      color: palette[Math.floor(Math.random() * palette.length)],
      leftPercent: 6 + Math.random() * 88,
      duration: 1400 + Math.random() * 1300,
      delay: Math.random() * 500,
    }));
  }, [colors]);

  return (
    <Layer pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          color={piece.color}
          leftPercent={piece.leftPercent}
          duration={piece.duration}
          delay={piece.delay}
        />
      ))}
    </Layer>
  );
};
