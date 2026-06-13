import styled from 'styled-components/native';

// GlassDivider — 1px horizontal rule using the glassClearDivider token.
// Used inside glass cards to separate sections without adding visual weight.
//
// flex — set true when the divider sits in a row alongside other flex children
//        (e.g. the "or continue with" row in SignIn) so it stretches to fill
//        available space. Defaults false for block-level dividers between stacked
//        items (Location fields, GrassType/EffortLevel option rows).

interface GlassDividerProps {
  flex?: boolean;
}

export const GlassDivider = styled.View<{ flex?: boolean }>`
  ${({ flex: f }) => (f ? 'flex: 1;' : '')}
  height: 1px;
  background-color: ${({ theme }) => theme.colors.glassClearDivider};
`;
