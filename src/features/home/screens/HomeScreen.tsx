// HomeScreen — the Today tab. A blurred lawn photo under a dark green tint sets
// the scene; on top sits the greeting, the streak/weather context card, the
// progress track, and the task accordion. All deck state and behaviour live in
// useFocusDeck; this screen is pure composition. Confetti rains over everything
// once every task is done.
//
// Fly-Up Merge: the whole header block (eyebrow, greeting, context card,
// progress track) lives INSIDE the scroll view, so when the user scrolls it
// slides away with real scroll physics — no animation drives its movement at
// all. Over the same first 100px of scroll, the header pieces fade out and the
// MergedHeaderBar (a compact glass strip with the small greeting, the flying
// streak/weather stats, and a compact track) cross-fades in pinned at the top.
// Scrolling back to the top reverses everything and restores the full header.
//
// Why this structure: the scroll view's viewport and content sizes never
// change while the collapse runs — only opacity and transforms animate — so
// there is no layout feedback between the header and the scroll position,
// which is what caused the jitter in the earlier sibling-header approach.

import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import styled from 'styled-components/native';

import {
  HOME_BACKGROUND,
  HOME_BACKGROUND_BLUR_RADIUS,
} from '../constants/backdrop';
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
import {
  HEADER_COLLAPSE_PX,
  MergedHeaderBar,
} from '../components/MergedHeaderBar';
import { SplitContextCard } from '../components/SplitContextCard';
import { TaskAccordion } from '../components/TaskAccordion';
import { BottomScrim } from '~/shared/components/BottomScrim';
import { FLOATING_TAB_BAR_CLEARANCE } from '~/shared/components/FloatingTabBar';

// Extra scrollable room past the last task row. The header collapse consumes
// the first 100px of scroll before the list itself starts moving up in earnest,
// and the collapsed bar hides the top of the viewport — without this slack the
// scroll range runs out before the bottom cards can rise into the clear zone
// between the bar and the tab-bar scrim.
const SCROLL_BOTTOM_SLACK = 160;

// The scroll content keeps the padding the old fixed Content column had, so at
// scroll offset 0 every element sits exactly where it did before the collapse
// animation existed. Defined once at module level (not inline) so the scroll
// view isn't handed a fresh object every render.
const SCROLL_CONTENT_STYLE = {
  paddingTop: 24,
  paddingHorizontal: 20,
} as const;

// clamp01 — keeps a number inside the 0..1 range, on the UI thread.
const clamp01 = (n: number) => {
  'worklet';
  return Math.min(Math.max(n, 0), 1);
};

// Screen — the full-height container everything on the Today screen sits in.
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

// PhotoWash — the tint over the photo that keeps text readable. It runs as a
// soft top-to-bottom gradient between two theme stops: a bright blue-white wash
// in light mode (Clear Sky), a flat dark green wash in dark mode.
const PhotoWash = styled(LinearGradient).attrs(({ theme }) => ({
  colors: [theme.colors.photoWashTop, theme.colors.photoWashBottom] as const,
}))`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// Safe — keeps the Today content clear of the notch and home indicator.
const Safe = styled(SafeAreaView)`
  flex: 1;
`;

// Content — the positioning context for the scroll view and the pinned bar.
// The old horizontal padding moved into SCROLL_CONTENT_STYLE so the bar's
// glass can run edge to edge while list content stays inset.
const Content = styled.View`
  flex: 1;
`;

// Scroll — now carries the header block AND the task accordion, so the header
// departs with real scroll motion. The animated scroll handler feeds scrollY
// on the UI thread with no JS round-trip per frame.
const Scroll = styled(Animated.ScrollView)`
  flex: 1;
`;

// BottomSpacer — keeps the last row clear of the floating tab bar, plus the
// collapse slack that lets the bottom cards scroll up past the tab-bar scrim
// once the header has collapsed.
const BottomSpacer = styled.View`
  height: ${FLOATING_TAB_BAR_CLEARANCE + SCROLL_BOTTOM_SLACK}px;
`;

export const HomeScreen = () => {
  const deck = useFocusDeck();

  // scrollY — the task list's live scroll offset. Every collapse animation
  // (here and inside MergedHeaderBar) reads this one value so they all stay
  // in perfect sync.
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Fade-out curves for the departing header pieces. All opacity-only, and all
  // return exactly 1 at scroll offset 0, so the resting screen is untouched.
  // The card fades first (its values are "leaving" for the bar), the greeting
  // block and track follow slightly later so the cross-dissolve overlaps the
  // bar's fade-in instead of leaving a blank moment.
  const headFadeStyle = useAnimatedStyle(() => {
    const p = clamp01(scrollY.value / HEADER_COLLAPSE_PX);
    return { opacity: 1 - clamp01((p - 0.15) / 0.45) };
  });
  const cardFadeStyle = useAnimatedStyle(() => {
    const p = clamp01(scrollY.value / HEADER_COLLAPSE_PX);
    return { opacity: 1 - clamp01(p * 1.5) };
  });
  const trackFadeStyle = useAnimatedStyle(() => {
    const p = clamp01(scrollY.value / HEADER_COLLAPSE_PX);
    return { opacity: 1 - clamp01((p - 0.2) / 0.5) };
  });

  return (
    <Screen>
      <PhotoBackground
        source={HOME_BACKGROUND}
        resizeMode="cover"
        blurRadius={HOME_BACKGROUND_BLUR_RADIUS}
      />
      <PhotoWash />
      <Safe edges={['top']}>
        <Content>
          <Scroll
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={SCROLL_CONTENT_STYLE}
          >
            {/* The full header scrolls away with the list. Each piece fades on
                its own curve as the compact bar takes over. */}
            <Animated.View style={headFadeStyle}>
              <HomeHeader
                eyebrow={`On Deck · ${TODAY_LABEL}`}
                greeting={`Morning, ${USER_FIRST_NAME}`}
              />
            </Animated.View>
            <Animated.View style={cardFadeStyle}>
              <SplitContextCard
                streakDays={deck.streakDays}
                weather={WEATHER}
              />
            </Animated.View>
            <Animated.View style={trackFadeStyle}>
              <CompletionTrack
                label={deck.completionLabel}
                progress={deck.completionProgress}
              />
            </Animated.View>

            <TaskAccordion deck={deck} recordLabel={RECORD_STREAK_LABEL} />
            <BottomSpacer />
          </Scroll>

          {/* The compact bar pinned over the list — invisible until scrolling
              begins, then the fly-up merge lands the stats inside it. */}
          <MergedHeaderBar
            scrollY={scrollY}
            greeting={`Morning, ${USER_FIRST_NAME}`}
            streakDays={deck.streakDays}
            weather={WEATHER}
            completionLabel={deck.completionLabel}
            completionProgress={deck.completionProgress}
          />
        </Content>
      </Safe>
      {/* Fades the scrolling accordion into the background before it reaches the
          floating tab bar. Sits above the content but below the confetti. */}
      <BottomScrim />
      {deck.isCleared && <ConfettiBurst />}
    </Screen>
  );
};

export default HomeScreen;
