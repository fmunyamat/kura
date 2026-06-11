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
