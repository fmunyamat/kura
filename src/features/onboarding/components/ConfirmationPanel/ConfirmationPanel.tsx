import { useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import { GlassCard } from '~/shared/components/GlassCard';

interface ConfirmationPanelProps {
  email: string;
  onReset: () => void;
}

// Panel — outer container for the confirmation slide. It occupies exactly one
// screen-width slot in the horizontal row that SignInScreen manages. padding
// pushes the glass card away from the screen edges; justify-content: center
// vertically centres the card in whatever height the PanelHost gives us.
const Panel = styled.View<{ $width: number; $isTablet: boolean }>`
  width: ${({ $width }) => $width}px;
  flex: 1;
  padding: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.xl : theme.spacing.md}px;
  justify-content: center;
`;

// GlassContent — aligns the icon, headings, and links in a centred column
// inside the glass card. Gap scales up on tablets so the content feels
// proportional at larger viewing distances.
const GlassContent = styled.View<{ $isTablet: boolean }>`
  align-items: center;
  gap: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.xl : theme.spacing.lg}px;
`;

// IconCircle — a subtle circular badge behind the envelope emoji.
const IconCircle = styled.View<{ $isTablet: boolean }>`
  width: ${({ $isTablet }) => ($isTablet ? 72 : 48)}px;
  height: ${({ $isTablet }) => ($isTablet ? 72 : 48)}px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  background-color: rgba(255, 255, 255, 0.08);
  align-items: center;
  justify-content: center;
`;

// IconText — the envelope emoji inside the circle. Scales up on tablets.
const IconText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeXl : theme.typography.sizeLg}px;
`;

// Heading — the main title line the user reads first.
const Heading = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeXl : theme.typography.sizeLg}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.textOnDark};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
`;

// BodyText — the supporting lines of copy that explain what to do next.
const BodyText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// EmailPillWrapper — a dark capsule that frames the user's email address.
// The border matches the email input field so it feels like the same language.
const EmailPillWrapper = styled.View<{ $isTablet: boolean }>`
  background-color: ${({ theme }) => theme.colors.inputBackgroundDark};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.inputBorderDark};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.sm : theme.spacing.xs}px
    ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px;
`;

// EmailPillText — the address inside the pill, in lime so it stands out
// clearly from the surrounding muted body copy.
const EmailPillText = styled.Text<{ $isTablet: boolean }>`
  color: ${({ theme }) => theme.colors.lime};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeSm}px;
`;

// ResetLink — a tappable line that slides the form back so the user can
// correct a typo or try a different address.
const ResetLink = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  text-decoration-line: underline;
`;

export const ConfirmationPanel = ({
  email,
  onReset,
}: ConfirmationPanelProps) => {
  // useWindowDimensions re-runs on rotation so width and isTablet always
  // reflect the current device orientation. Math.min picks the shorter side
  // so a landscape tablet still counts as a tablet.
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  return (
    <Panel $width={width} $isTablet={isTablet}>
      <GlassCard>
        <GlassContent $isTablet={isTablet}>
          <IconCircle $isTablet={isTablet}>
            <IconText $isTablet={isTablet}>✉️</IconText>
          </IconCircle>
          <Heading $isTablet={isTablet}>Check your inbox</Heading>
          <BodyText $isTablet={isTablet}>We sent a sign-in link to</BodyText>
          <EmailPillWrapper $isTablet={isTablet}>
            <EmailPillText $isTablet={isTablet}>{email}</EmailPillText>
          </EmailPillWrapper>
          <BodyText $isTablet={isTablet}>Open it to sign in — no password needed.</BodyText>
          <ResetLink
            $isTablet={isTablet}
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Use a different email"
          >
            Use a different email
          </ResetLink>
        </GlassContent>
      </GlassCard>
    </Panel>
  );
};
