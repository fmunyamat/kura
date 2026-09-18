// A thin hairline used to separate sections inside glass cards — like the faint
// line between two rows. It's deliberately subtle so it divides content without
// adding visual clutter. This whole file is that one 1px line and a `flex` option
// for when it needs to stretch to fill a row.

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

// GlassDivider — the actual 1px line. `flex` makes it stretch to fill a row when
// needed; without it, it's a plain full-width hairline between stacked items.
export const GlassDivider = styled.View<{ flex?: boolean }>`
  ${({ flex: f }) => (f ? 'flex: 1;' : '')}
  height: 1px;
  background-color: ${({ theme }) => theme.colors.glassClearDivider};
`;
