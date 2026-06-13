// HomeScreen — the Today tab. A blurred lawn photo under a dark green tint sets
// the scene; on top sits the greeting, the streak/weather context card, the
// progress track, the card deck itself, and the peek nav. All deck state and
// behaviour live in useFocusDeck; this screen is pure composition. Confetti
// rains over everything once the deck is cleared.

import { ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import {
  RECORD_STREAK_LABEL,
  TODAY_LABEL,
  USER_FIRST_NAME,
  WEATHER,
} from '../constants/deck-cards';
import { useFocusDeck } from '../hooks/useFocusDeck';
import { CompletionTrack } from '../components/CompletionTrack';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { Deck } from '../components/Deck';
import { HomeHeader } from '../components/HomeHeader';
import { PeekNav } from '../components/PeekNav';
import { SplitContextCard } from '../components/SplitContextCard';

const SCREEN_BG = require('../../../../assets/images/sprinkler.png');

const Screen = styled.View`
  flex: 1;
`;

// PhotoBackground — the full-bleed blurred photo, same recipe as onboarding.
const PhotoBackground = styled(ImageBackground)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// DarkOverlay — the dark green wash that keeps white text readable.
const DarkOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.onboardingPhotoTint};
`;

const Safe = styled(SafeAreaView)`
  flex: 1;
`;

// Content — the padded column. The generous bottom padding keeps the peek nav
// clear of the tab bar below.
const Content = styled.View`
  flex: 1;
  padding: 24px 20px 28px;
`;

export const HomeScreen = () => {
  const deck = useFocusDeck();

  return (
    <Screen>
      <PhotoBackground source={SCREEN_BG} resizeMode="cover" blurRadius={7} />
      <DarkOverlay />
      <Safe edges={['top']}>
        <Content>
          <HomeHeader
            eyebrow={`On Deck · ${TODAY_LABEL}`}
            greeting={`Morning, ${USER_FIRST_NAME}`}
          />
          <SplitContextCard streakDays={deck.streakDays} weather={WEATHER} />
          <CompletionTrack
            label={deck.completionLabel}
            progress={deck.completionProgress}
          />
          <Deck deck={deck} recordLabel={RECORD_STREAK_LABEL} />
          <PeekNav
            label={deck.peekLabel}
            canPeekBack={deck.canPeekBack}
            canPeekForward={deck.canPeekForward}
            onPeekBack={() => deck.handlePeek(-1)}
            onPeekForward={() => deck.handlePeek(1)}
          />
        </Content>
      </Safe>
      {deck.isCleared && <ConfettiBurst />}
    </Screen>
  );
};

export default HomeScreen;
