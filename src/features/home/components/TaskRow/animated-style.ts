// AnimatedViewStyle — the shape a Reanimated `useAnimatedStyle` returns, named
// once so the row's sub-components can accept an animated style as a prop
// without each repeating Reanimated's verbose generics. It is the same thing
// Animated.View's `style` prop accepts.

import type { StyleProp, ViewStyle } from 'react-native';

export type AnimatedViewStyle = StyleProp<ViewStyle>;
