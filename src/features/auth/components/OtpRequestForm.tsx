import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, useColorScheme } from 'react-native';
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

// StyledTextInput — the email address text field. Clear-glass style: a faint
// white well (13% at rest) with a hairline border so the field reads as a
// distinct control on the transparent pane. Focusing brightens the well to 22%
// instead of changing the border. Text is white because the photo behind the
// clear card is dark.
const StyledTextInput = styled(TextInput)<{
  theme: DefaultTheme;
  $focused: boolean;
  $isTablet: boolean;
}>`
  background-color: ${({ $focused, theme }) =>
    $focused ? theme.colors.glassClearInputFocused : theme.colors.glassClearInput};
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.glassClearInputBorder};
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  padding: 10px 12px;
  font-family: ${({ theme }: { theme: DefaultTheme }) => theme.typography.fontBody};
  font-size: 14px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textOnDark};
  height: ${({ $isTablet }) => ($isTablet ? 54 : 44)}px;
`;

// SubmitButton — the primary action on the clear glass card. Dark mode uses
// the deeper primary green so it reads as intentional against the dark photo;
// light mode uses the brighter primaryMid so it pops against the lighter scene.
const SubmitButton = styled(Pressable)<{ $disabled: boolean; $isTablet: boolean; $isDark: boolean }>`
  background-color: ${({ $isDark, theme }) =>
    $isDark ? theme.colors.primary : theme.colors.primaryMid};
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  padding: ${({ $isTablet }) => ($isTablet ? '18px' : '14px')} 12px;
  align-items: center;
  margin-top: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

// ButtonText — deep forest-green label, the darkest value on screen, for
// maximum contrast against the bright lime pill.
const ButtonText = styled.Text`
  font-family: ${({ theme }: { theme: DefaultTheme }) => theme.typography.fontBodyBold};
  font-size: 14px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.white};
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
  const isDark = useColorScheme() === 'dark';
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Container>
      <StyledTextInput
        $focused={isFocused}
        $isTablet={isTablet}
        placeholder="Enter email address"
        placeholderTextColor={theme.colors.textMutedOnDark}
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
        $isDark={isDark}
        onPress={onSubmit}
        disabled={isLoading}
        accessibilityLabel={isLoading ? 'Sending code' : 'Send code'}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: isLoading }}
      >
        {isLoading ? (
          // Spinner is deep forest green to stay visible on the lime pill —
          // a white spinner would wash out against the bright surface.
          <ActivityIndicator color={theme.colors.primaryDeep} />
        ) : (
          <ButtonText>Send code →</ButtonText>
        )}
      </SubmitButton>
    </Container>
  );
};
