import styled from 'styled-components/native';

interface ConfirmationPanelProps {
  email: string;
  onReset: () => void;
}

const Panel = styled.View`
  flex: 3;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const IconCircle = styled.View`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  background-color: ${({ theme }) => theme.colors.success};
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

const IconText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeLg}px;
`;

const Heading = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.gradientMid};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
`;

const BodyText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

const EmailPillWrapper = styled.View`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.xs}px ${({ theme }) => theme.spacing.sm}px;
`;

const EmailPillText = styled.Text`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
`;

const ResetLink = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.primaryMid};
  text-decoration-line: underline;
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

export const ConfirmationPanel = ({
  email,
  onReset,
}: ConfirmationPanelProps) => (
  <Panel>
    <IconCircle>
      <IconText>✉️</IconText>
    </IconCircle>
    <Heading>Check your inbox</Heading>
    <BodyText>We sent a sign-in link to</BodyText>
    <EmailPillWrapper>
      <EmailPillText>{email}</EmailPillText>
    </EmailPillWrapper>
    <BodyText>Open it to sign in — no password needed.</BodyText>
    <ResetLink
      onPress={onReset}
      accessibilityRole="button"
      accessibilityLabel="Use a different email"
    >
      Use a different email
    </ResetLink>
  </Panel>
);
