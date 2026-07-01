// FloatingTabBar — the app's bottom navigation: a frosted glass pill that
// floats just above the bottom edge of the screen, over the blurred lawn photo.
// Each registered tab shows a line icon above a short mono label. The active tab
// turns lime and sits on a soft lime glow pad behind its icon; inactive tabs are
// a faint white. It renders whatever routes the Tabs navigator registers, so new
// tabs (Tasks, Learn, …) slot in automatically as their screens are added.

import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import type { ComponentProps } from 'react';
import { Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';

// FLOATING_TAB_BAR_CLEARANCE — how much empty space a scrolling screen should
// leave at the bottom of its content so the last item clears the floating pill.
// Screens add this as bottom padding/spacer; it covers the pill height plus the
// gap beneath it (the device's own safe-area inset is on top of this).
export const FLOATING_TAB_BAR_CLEARANCE = 96;

// ICONS — maps each tab route name to its Ionicons line icon. Outline icons are
// used throughout so the active state reads as a colour change, not a shape
// change. Unknown routes fall back to a neutral dot.
type IoniconName = ComponentProps<typeof Ionicons>['name'];
const ICONS: Record<string, IoniconName> = {
  index: 'sunny-outline', // Today
  settings: 'settings-outline',
  tasks: 'checkbox-outline',
  learn: 'book-outline',
  profile: 'person-outline',
};

// How far the pill floats above the device's safe-area inset, and the size of
// the glow pad behind an active icon.
const PILL_GAP = 14;
const GLOW_SIZE = 44;
const ICON_SIZE = 22;

// Wrapper — spans the full width at the bottom but lets touches pass through the
// empty space on either side of the pill (box-none) so it never blocks content.
const Wrapper = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  padding: 0 ${({ theme }) => theme.spacing.md}px;
`;

// Pill — the frosted glass capsule. overflow:hidden clips the BlurView to the
// rounded corners; the 1px rim brightens along the top like the app's other
// glass surfaces.
const Pill = styled(BlurView)`
  flex-direction: row;
  align-self: stretch;
  border-radius: 26px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassClearEdgeBottom};
  border-top-color: ${({ theme }) => theme.colors.glassClearEdge};
  padding: 4px 6px;
`;

// Tint — the dark-green wash over the blur that keeps the pill readable against
// a bright photo behind it.
const Tint = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.navPillSurface};
`;

// Tab — one tappable column: icon over label, evenly sharing the pill width.
const Tab = styled(Pressable)`
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 0;
`;

// IconWrap — centres the icon and hosts the glow pad behind it when active.
const IconWrap = styled.View`
  width: ${GLOW_SIZE}px;
  height: ${GLOW_SIZE}px;
  align-items: center;
  justify-content: center;
`;

// Glow — the soft lime pad shown behind the active tab's icon. A translucent
// lime circle approximates the glow; it only mounts for the focused tab.
const Glow = styled.View`
  position: absolute;
  width: ${GLOW_SIZE}px;
  height: ${GLOW_SIZE}px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  background-color: ${({ theme }) => theme.colors.limeGlow};
`;

// Label — the small uppercase mono tab label. Lime when active, faint otherwise.
const Label = styled.Text<{ $focused: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 8px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${({ theme, $focused }) =>
    $focused ? theme.colors.lime : theme.colors.textFaintOnDark};
`;

export const FloatingTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  // Ionicons takes a plain colour string, so we read the active/inactive
  // colours off the theme here rather than through a styled-component.
  const { colors } = useTheme();

  return (
    // pointerEvents box-none lets taps fall through everywhere except the pill.
    <Wrapper
      pointerEvents="box-none"
      // Runtime value: lift the pill above the device's home-indicator inset.
      style={{ bottom: insets.bottom + PILL_GAP }}
    >
      <Pill
        intensity={60}
        tint="dark"
        experimentalBlurMethod={
          Platform.OS === 'android' ? 'dimezisBlurView' : undefined
        }
      >
        <Tint />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          // Prefer the screen's title; fall back to the route name.
          const label =
            typeof options.title === 'string' ? options.title : route.name;
          const iconName = ICONS[route.name] ?? 'ellipse-outline';

          // Standard react-navigation tab-press handling: emit the event so any
          // listeners can cancel it, and only navigate if it wasn't prevented
          // and the tab isn't already active.
          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Tab
              key={route.key}
              onPress={handlePress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              <IconWrap>
                {focused && <Glow />}
                <Ionicons
                  name={iconName}
                  size={ICON_SIZE}
                  color={focused ? colors.lime : colors.textFaintOnDark}
                />
              </IconWrap>
              <Label $focused={focused}>{label}</Label>
            </Tab>
          );
        })}
      </Pill>
    </Wrapper>
  );
};
