// HomeScreen — the Today tab. A blurred lawn photo under a dark green tint sets
// the scene; on top sits the greeting, the streak/weather context card, the
// progress track, and the task accordion. All deck state and behaviour live in
// useFocusDeck; this screen is pure composition. Confetti rains over everything
// once every task is done.

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
import { HomeHeader } from '../components/HomeHeader';
import { SplitContextCard } from '../components/SplitContextCard';
import { TaskAccordion } from '../components/TaskAccordion';

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

// Content — the padded column holding the fixed header block (greeting, context
// card, progress) above the scrolling task list.
const Content = styled.View`
  flex: 1;
  padding: 24px 20px 0;
`;

// Scroll — the task accordion scrolls so the open card's button is always
// reachable even when an expanded row would otherwise run off the bottom of the
// screen. It simply doesn't scroll when everything already fits.
const Scroll = styled.ScrollView`
  flex: 1;
`;

// BottomSpacer — keeps the last row clear of the tab bar at the bottom of the
// scroll, standing in for the padding the scroll view can't take directly.
const BottomSpacer = styled.View`
  height: ${({ theme }) => theme.spacing.xl}px;
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
          <Scroll showsVerticalScrollIndicator={false}>
            <TaskAccordion deck={deck} recordLabel={RECORD_STREAK_LABEL} />
            <BottomSpacer />
          </Scroll>
        </Content>
      </Safe>
      {deck.isCleared && <ConfettiBurst />}
    </Screen>
  );
};

export default HomeScreen;
