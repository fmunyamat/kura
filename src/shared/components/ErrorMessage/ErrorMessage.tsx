// The small red line of text shown when something goes wrong (e.g. "Something
// went wrong. Please try again."). It's coloured to stay readable on the app's
// dark glassy backgrounds, and it can sit just above or just below a button with
// a size option to match each screen. This file is only that styled message —
// the screens decide when to show it and what it says.

import styled from 'styled-components/native';

// ErrorMessage — inline error text shown above or below a CTA when an async
// operation fails. Uses errorOnDark so it reads clearly on semi-transparent glass
// panels over the app's dark photo backgrounds.
//
// size     — 'xs' (default) for onboarding/welcome; 'sm' for the sign-in card
//            which has a taller text hierarchy.
// spacing  — 'below' (default) adds margin-bottom; 'above' adds margin-top.
//            Matches how each callsite positions the message relative to the CTA.

interface ErrorMessageProps {
  size?: 'xs' | 'sm';
  spacing?: 'below' | 'above';
  children: React.ReactNode;
}

// Text — the actual red message text. The size and spacing props adjust the
// font size and whether the margin sits above or below it (see the props above).
const Text = styled.Text<{ $size: 'xs' | 'sm'; $spacing: 'below' | 'above' }>`
  font-size: ${({ theme, $size }) =>
    $size === 'sm' ? theme.typography.sizeSm : theme.typography.sizeXs}px;
  font-family: ${({ theme }) => theme.typography.fontBody};
  color: ${({ theme }) => theme.colors.errorOnDark};
  text-align: center;
  ${({ theme, $spacing }) =>
    $spacing === 'above'
      ? `margin-top: ${theme.spacing.xs}px;`
      : `margin-bottom: ${theme.spacing.sm}px;`}
`;

export const ErrorMessage = ({
  size = 'xs',
  spacing = 'below',
  children,
}: ErrorMessageProps) => (
  <Text $size={size} $spacing={spacing}>
    {children}
  </Text>
);
