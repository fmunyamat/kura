// The Today screen's background photo and its blur strength, shared between
// HomeScreen (which draws it full-screen) and MergedHeaderBar (which draws a
// clipped copy of it behind the collapsed bar to hide the rows scrolling
// underneath). Living in one place guarantees both copies use the exact same
// image and blur, so the bar's slice lines up pixel-for-pixel with the real
// background and the bar still reads as fully transparent.

import type { ImageSourcePropType } from 'react-native';

export const HOME_BACKGROUND: ImageSourcePropType = require('../../../../assets/images/sprinkler.png');

export const HOME_BACKGROUND_BLUR_RADIUS = 7;
