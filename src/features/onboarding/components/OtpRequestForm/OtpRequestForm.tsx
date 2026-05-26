import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

// OtpRequestForm — the email input panel. The user types their address and
// taps "Send code". On submit, Supabase emails them a 6-digit verification code.
// isLoading disables the button and shows a spinner while the request is in flight.
interface OtpRequestFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const Container = styled.View`
  width: 100%;
`;

// StyledTextInput — the email address text field. autoComplete and textContentType
// are both set to "email" so the device offers the keyboard's saved addresses.
// autoCapitalize="none" prevents iOS from uppercasing the first letter of the address.
const StyledTextInput = styled(TextInput)`
  border-width: 1px;
  height: 50px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.inputBorderDark};
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.inputBackgroundDark};
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeMd}px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textOnDark};
`;

// SubmitButton — overflow: hidden clips the LinearGradient to the button's
// border-radius so the gradient corners don't bleed outside the pill shape.
const SubmitButton = styled(Pressable)`
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  overflow: hidden;
  margin-top: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
`;

const GradientBackground = styled(LinearGradient)`
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.white};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) => theme.typography.weightBold};
`;

export const OtpRequestForm = ({
  email,
  onEmailChange,
  onSubmit,
  isLoading = false,
}: OtpRequestFormProps) => {
  const theme = useTheme();

  return (
    <Container>
      <StyledTextInput
        placeholder="Enter Email Address"
        placeholderTextColor="rgba(255,255,255,0.25)"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        accessibilityLabel="Email address"
      />
      <SubmitButton
        onPress={onSubmit}
        disabled={isLoading}
        accessibilityLabel={isLoading ? 'Sending code' : 'Send code'}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: isLoading }}
      >
        <GradientBackground
          colors={[theme.colors.primary, theme.colors.primaryMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <ButtonText>Send code</ButtonText>
          )}
        </GradientBackground>
      </SubmitButton>
    </Container>
  );
};
