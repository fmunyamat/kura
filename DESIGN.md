# Kura — Design & Styling

## Styling (styled-components/native)

All styles live in styled-components co-located with the component. No `StyleSheet.create()`, no inline `style={}` except runtime-computed values (e.g. `Animated.Value` transforms, `onLayout` widths).

### Theme tokens — always use the theme, never hardcode

```ts
// config/theme.ts
export const lightTheme = {
  colors: {
    primary:    '#2D6A2D',
    primaryMid: '#5A9E3A',
    background: '#FFFFFF',
    surface:    '#EAF4E5',
    text:       '#1A1A1A',
    textMuted:  '#888888',
    border:     '#CCCCCC',
    success:    '#C8E6C0',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radii:   { sm: 4, md: 8, lg: 16, full: 9999 },
  typography: {
    sizeXs: 12, sizeSm: 14, sizeMd: 16, sizeLg: 20, sizeXl: 24, size2xl: 32,
    weightRegular: '400' as const,
    weightMedium:  '500' as const,
    weightBold:    '700' as const,
  },
};

export const darkTheme: AppTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#0F1F0F',
    surface:    '#1A2E1A',
    text:       '#F0F0F0',
    textMuted:  '#AAAAAA',
    border:     '#2E4A2E',
  },
};
```

### TypeScript augmentation

```ts
// types/styled.d.ts
import type { lightTheme } from '@/config/theme';
type AppTheme = typeof lightTheme;

declare module 'styled-components/native' {
  export interface DefaultTheme extends AppTheme {}
}
```

### Component usage

```tsx
import styled from 'styled-components/native';

const Container = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius:    ${({ theme }) => theme.radii.md}px;
  padding:          ${({ theme }) => theme.spacing.md}px;
`;

// Transient props for variants — $ prefix prevents forwarding to native element
const TaskRow = styled.View<{ $completed: boolean }>`
  opacity: ${({ $completed }) => ($completed ? 0.5 : 1)};
  background-color: ${({ $completed, theme }) =>
    $completed ? theme.colors.success : theme.colors.surface};
`;
```

### Tablet scaling

Use `useWindowDimensions()` to detect tablets. The threshold used consistently across the app is `Math.min(width, height) >= 600`. Pass an `$isTablet` transient prop to styled-components that need to respond to it.

```tsx
const { width, height } = useWindowDimensions();
const isTablet = Math.min(width, height) >= 600;

const Title = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.size2xl : theme.typography.sizeXl}px;
`;
```

Note: `flex: 0` in React Native sets `flexBasis: 0`, collapsing a view to zero height. To let a view size to its content without expanding, omit `flex` entirely — React Native defaults to `flexBasis: auto`.
