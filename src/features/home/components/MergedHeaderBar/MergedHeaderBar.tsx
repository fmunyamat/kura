// MergedHeaderBar — the compact glass strip that takes over the top of the
// Today screen once the task list starts scrolling. At rest it is completely
// invisible (every layer at opacity 0) and it never takes touches, so before
// any scroll the screen looks and behaves exactly like the default layout.
//
// As the list scrolls, the big header scrolls away naturally with the content
// while this bar cross-fades in over it: a band that looks transparent — its
// backdrop is a clipped, pixel-aligned copy of the homescreen background, so
// rows scrolling beneath it hide behind "the background itself" — holding the
// small greeting, the streak and weather values (which fly up from the
// departing context card into the band), and a compact copy of the progress
// track, finished with a hairline bottom edge.
//
// Why it's smooth: the bar animates opacity and transforms ONLY — no heights,
// no font sizes, no margins — so nothing here ever triggers a layout pass or
// changes the scroll view's geometry. Every value is derived from the scroll
// offset on the UI thread, so the bar tracks the finger frame-for-frame and
// can't fight the scroll the way a layout-driven header can.

import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import styled from 'styled-components/native';

import {
  HOME_BACKGROUND,
  HOME_BACKGROUND_BLUR_RADIUS,
} from '../../constants/backdrop';
import type { WeatherInfo } from '../../types';
import { CompletionTrack } from '../CompletionTrack';

// How many pixels of scroll it takes to fully swap the big header for this
// bar. HomeScreen imports this so its fade-outs run on the same schedule.
export const HEADER_COLLAPSE_PX = 100;

interface MergedHeaderBarProps {
  // scrollY — the task list's live scroll offset, shared from HomeScreen.
  // Reading it inside useAnimatedStyle keeps every update on the UI thread.
  scrollY: SharedValue<number>;
  greeting: string;
  streakDays: number;
  weather: WeatherInfo;
  completionLabel: string;
  completionProgress: number;
}

// clamp01 — keeps a number inside the 0..1 range. Marked as a worklet so the
// animated styles below can call it on the UI thread.
const clamp01 = (n: number) => {
  'worklet';
  return Math.min(Math.max(n, 0), 1);
};

// bandReveal — how visible the band chrome (glass, greeting, track) is at
// scroll offset y. It starts appearing a quarter of the way through the
// collapse and is fully in by three quarters, so it overlaps the big header's
// fade-out for a cross-dissolve rather than a gap.
const bandReveal = (y: number) => {
  'worklet';
  const p = clamp01(y / HEADER_COLLAPSE_PX);
  return clamp01((p - 0.25) / 0.5);
};

// flight — where a flying stat is at scroll offset y. The stat's real layout
// position is its landing spot in the band's top row, so at the start of the
// flight we push it down and left (roughly where the context card's value
// sits) and slightly enlarged; by the end the transform is zero and the stat
// rests in the band at full crispness. startDy staggers the two take-offs so
// the pair reads as a relay, not a single rigid block.
const flight = (y: number, startDy: number) => {
  'worklet';
  const p = clamp01(y / HEADER_COLLAPSE_PX);
  const fp = clamp01((p - 0.05) / 0.7);
  return {
    opacity: Math.min(fp * 2.2, 1),
    transform: [
      { translateX: (1 - fp) * -16 },
      { translateY: (1 - fp) * startDy },
      { scale: 1.35 - 0.45 * fp },
    ],
  };
};

// Root — pins the bar to the top of the screen area. pointerEvents="none" is
// set at the call site so every touch falls through to the list beneath.
const Root = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
`;

// BackdropClip — a window onto the homescreen background, exactly the bar's
// size. It holds a full-screen copy of the same photo and wash the screen
// draws, clipped to the bar's bounds. When it fades in, the bar still looks
// completely transparent (it is showing the background itself), but the task
// rows scrolling beneath the bar disappear behind it instead of showing
// through the text.
const BackdropClip = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
`;

// BackdropWindow — positions the full-screen background copy inside the clip
// so it lines up pixel-for-pixel with the real background behind the bar.
// The bar starts below the status bar (safe-area inset) while the screen's
// photo starts at the very top of the screen, so we shift the copy up by the
// inset and give it the full window height — same crop, same pixels.
const BackdropWindow = styled.View<{ $topOffset: number; $height: number }>`
  position: absolute;
  top: ${({ $topOffset }) => $topOffset}px;
  left: 0;
  right: 0;
  height: ${({ $height }) => $height}px;
`;

// BackdropPhoto — the blurred lawn photo copy filling the window.
const BackdropPhoto = styled(ImageBackground)`
  flex: 1;
`;

// BackdropWash — the same tint gradient HomeScreen lays over its photo, so
// the clipped slice matches the visible background exactly in both themes.
const BackdropWash = styled(LinearGradient).attrs(({ theme }) => ({
  colors: [theme.colors.photoWashTop, theme.colors.photoWashBottom] as const,
}))`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// EdgeLayer — fills the bar area absolutely so it can carry future chrome
// without affecting layout. No border: the bar reads as fully borderless.
const EdgeLayer = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// Inner — the band's content padding. Sized so the band stays a slim strip.
const Inner = styled.View`
  padding: 10px 20px 12px;
`;

// TopRow — small greeting on the left, the two landed stats on the right.
const TopRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

// SmallGreeting — the compact version of "Morning, John". Same heavy header
// face as the big greeting so the cross-fade reads as the same text shrinking.
const SmallGreeting = styled(Animated.Text)`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
`;

// Stat — one flying value ("🔥6" or "24°☀️"). Laid out as a normal flex child
// at its landing spot; the flight transform carries it there from the card.
const Stat = styled(Animated.Text)`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
`;

// TrackWrap — fades the compact progress track in with the rest of the band.
const TrackWrap = styled(Animated.View)``;

export const MergedHeaderBar = ({
  scrollY,
  greeting,
  streakDays,
  weather,
  completionLabel,
  completionProgress,
}: MergedHeaderBarProps) => {
  // Needed to line the backdrop's background copy up with the real one: the
  // bar sits below the status bar, the screen photo starts at the very top.
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // Band chrome (backdrop, edge, greeting, track) shares one reveal curve.
  // The backdrop and edge fade in place; the greeting and track also rise 8px
  // into position so the band feels like it settles rather than appearing.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: bandReveal(scrollY.value),
  }));
  const edgeStyle = useAnimatedStyle(() => ({
    opacity: bandReveal(scrollY.value),
  }));
  const greetingStyle = useAnimatedStyle(() => {
    const c = bandReveal(scrollY.value);
    return { opacity: c, transform: [{ translateY: (1 - c) * 8 }] };
  });
  const trackStyle = useAnimatedStyle(() => {
    const c = bandReveal(scrollY.value);
    return { opacity: c, transform: [{ translateY: (1 - c) * 8 }] };
  });

  // The two stats take off on separate schedules (88px vs 98px below their
  // landing spots) so the streak arrives a beat before the weather.
  const streakStyle = useAnimatedStyle(() => flight(scrollY.value, 88));
  const weatherStyle = useAnimatedStyle(() => flight(scrollY.value, 98));

  return (
    <Root pointerEvents="none">
      {/* The masking backdrop: rows scrolling under the bar hide behind this
          clipped copy of the homescreen background as it fades in. */}
      <BackdropClip style={backdropStyle}>
        <BackdropWindow $topOffset={-insets.top} $height={windowHeight}>
          <BackdropPhoto
            source={HOME_BACKGROUND}
            resizeMode="cover"
            blurRadius={HOME_BACKGROUND_BLUR_RADIUS}
          />
          <BackdropWash />
        </BackdropWindow>
      </BackdropClip>

      <EdgeLayer style={edgeStyle} />

      <Inner>
        <TopRow>
          <SmallGreeting style={greetingStyle}>{greeting}</SmallGreeting>
          <Stat style={streakStyle}>{`🔥${streakDays}`}</Stat>
          <Stat style={weatherStyle}>
            {`${weather.temperature}${weather.icon}`}
          </Stat>
        </TopRow>

        {/* A second CompletionTrack instance — it's prop-driven, so it stays
            in step with the big one automatically as tasks complete. */}
        <TrackWrap style={trackStyle}>
          <CompletionTrack
            label={completionLabel}
            progress={completionProgress}
          />
        </TrackWrap>
      </Inner>
    </Root>
  );
};
