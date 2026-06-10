import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

// OtpRequestForm — the email input panel. The user types their address and
// taps "Send code". On submit, Supabase emails them a 6-digit verification code.
// isLoading disables the button and shows a spinner while the request is in flight.
interface OtpRequestFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  isTablet?: boolean;
}

const Container = styled.View`
  width: 100%;
`;

// StyledTextInput — the email address text field. Dark well background matches
// the inputs in the onboarding Location screen: rgba(0,0,0,0.10) at rest,
// rgba(0,0,0,0.18) when focused. No border — the background change signals focus.
const StyledTextInput = styled(TextInput)<{
  theme: DefaultTheme;
  $focused: boolean;
  $isTablet: boolean;
}>`
  background-color: ${({ $focused }) =>
    $focused ? 'rgba(0, 0, 0, 0.18)' : 'rgba(0, 0, 0, 0.10)'};
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  padding: 10px 12px;
  font-family: ${({ theme }: { theme: DefaultTheme }) => theme.typography.fontBody};
  font-size: 14px;
  color: #ffffff;
  height: ${({ $isTablet }) => ($isTablet ? 54 : 44)}px;
`;

// SubmitButton — soft lime-green pastel pill. rgba(184,229,106,0.28) applies
// the brand lime at low opacity so the button reads as a gentle colour accent
// on the frosted card rather than a heavy dark block.
const SubmitButton = styled(Pressable)<{ $disabled: boolean; $isTablet: boolean }>`
  background-color: rgba(82, 140, 32, 0.92);
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  padding: ${({ $isTablet }) => ($isTablet ? '18px' : '14px')} 12px;
  align-items: center;
  margin-top: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

// ButtonText — deep forest green label for maximum contrast against the
// light lime-pastel pill surface.
const ButtonText = styled.Text`
  font-family: ${({ theme }: { theme: DefaultTheme }) => theme.typography.fontBodyBold};
  font-size: 14px;
  color: #ffffff;
  text-align: center;
`;

export const OtpRequestForm = ({
  email,
  onEmailChange,
  onSubmit,
  isLoading = false,
  isTablet = false,
}: OtpRequestFormProps) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Container>
      <StyledTextInput
        $focused={isFocused}
        $isTablet={isTablet}
        placeholder="Enter email address"
        placeholderTextColor={theme.colors.placeholderOnGlass}
        value={email}
        onChangeText={onEmailChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        accessibilityLabel="Email address"
      />
      <SubmitButton
        $disabled={isLoading}
        $isTablet={isTablet}
        onPress={onSubmit}
        disabled={isLoading}
        accessibilityLabel={isLoading ? 'Sending code' : 'Send code'}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <ButtonText>Send code →</ButtonText>
        )}
      </SubmitButton>
    </Container>
  );
};
