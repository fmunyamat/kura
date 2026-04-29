import type { AppTheme } from '~/config/theme';

declare module 'styled-components/native' {
  export interface DefaultTheme extends AppTheme {}
}
