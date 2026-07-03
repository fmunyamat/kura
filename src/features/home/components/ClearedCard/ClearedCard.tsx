// ClearedCard — the celebration panel that takes the front slot once every
// task is done. A party emoji pops in, a short message explains tomorrow's card
// is already waiting, and the new streak chip springs in a beat later.

import Animated, { ZoomIn } from 'react-native-reanimated';
import styled from 'styled-components/native';

interface ClearedCardProps {
  // streakLabel — the record chip text, e.g. "🔥 7 days — new record".
  streakLabel: string;
}

// Card — the celebration panel at the top of the cleared list. Same glass
// surface as a real card; it sits in normal flow above the locked preview row.
const Card = styled.View`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassEdgeSoft};
  border-top-color: ${({ theme }) => theme.colors.glassEdge};
  background-color: ${({ theme }) => theme.colors.deckCardSurface};
  align-items: center;
  padding: 34px 20px 26px;
`;

const Emoji = styled.Text`
  font-size: 46px;
`;

const Heading = styled.Text`
  margin-top: 14px;
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 22px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
`;

const Copy = styled.Text`
  margin-top: 8px;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textPhotoMuted};
`;

// Chip — the record badge, in the theme's action accent.
const Chip = styled.View`
  margin-top: 16px;
  background-color: ${({ theme }) => theme.colors.accentPrimary};
  border-radius: ${({ theme }) => theme.radii.full}px;
  padding: 5px 12px;
`;

const ChipText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: 9.5px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accentPrimaryInk};
`;

export const ClearedCard = ({ streakLabel }: ClearedCardProps) => (
  <Card>
    <Animated.View entering={ZoomIn.duration(550)}>
      <Emoji>🎉</Emoji>
    </Animated.View>
    <Heading>Deck cleared.</Heading>
    <Copy>
      Every task for today is done. Tomorrow&apos;s mow is already shuffled in
      behind — it flips over at 6am.
    </Copy>
    <Animated.View entering={ZoomIn.delay(300).springify()}>
      <Chip>
        <ChipText>{streakLabel}</ChipText>
      </Chip>
    </Animated.View>
  </Card>
);
