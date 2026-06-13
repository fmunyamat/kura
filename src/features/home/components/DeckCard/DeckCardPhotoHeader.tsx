// DeckCardPhotoHeader — the photo strip at the top of a deck card with the
// task's emoji badge hanging off the bottom-left corner. A dark gradient is
// laid over the photo so the badge and the title just below stay readable on
// any image.

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ImageSourcePropType } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

interface DeckCardPhotoHeaderProps {
  image: ImageSourcePropType;
  emoji: string;
}

// Header — fixed-height band. The emoji badge is allowed to hang below it into
// the card body (the card clips the corners, not this strip).
const Header = styled.View`
  height: 84px;
`;

const Photo = styled(Image)`
  width: 100%;
  height: 100%;
`;

// Fade — the top-to-bottom darkening over the photo.
const Fade = styled(LinearGradient)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// Badge — the rounded dark square the emoji sits in, overlapping the photo's
// bottom edge so it reads as pinned to the card.
const Badge = styled.View`
  position: absolute;
  left: 16px;
  bottom: -15px;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background-color: ${({ theme }) => theme.colors.emojiBadgeSurface};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.emojiBadgeEdge};
  align-items: center;
  justify-content: center;
`;

const BadgeEmoji = styled.Text`
  font-size: 20px;
`;

export const DeckCardPhotoHeader = ({ image, emoji }: DeckCardPhotoHeaderProps) => {
  // The gradient needs its stops as a plain array, so we read them off the theme
  // directly rather than through a styled-component.
  const { colors } = useTheme();
  return (
    <Header>
      <Photo source={image} contentFit="cover" />
      <Fade colors={[colors.photoHeaderFadeTop, colors.photoHeaderFadeBottom]} />
      <Badge>
        <BadgeEmoji>{emoji}</BadgeEmoji>
      </Badge>
    </Header>
  );
};
