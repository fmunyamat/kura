import React from 'react';
import { ActivityIndicator, TextInput } from 'react-native';
import styled, { useTheme, DefaultTheme } from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';

interface MagicLinkFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const Container = styled.View`
  width: 100%;
`;

const Label = styled.Text`
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) => theme.typography.weightMedium};
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
  margin-bottom: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.xs}px;
`;

const StyledTextInput = styled(TextInput)`
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.inputBorder};
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.inputBackground};
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeMd}px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
`;

const SubmitButton = styled.TouchableOpacity`
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  overflow: hidden;
  margin-top: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
`;

const GradientBackground = styled(LinearGradient)`
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) => theme.typography.weightBold};
`;

export const MagicLinkForm: React.FC<MagicLinkFormProps> = ({
  email,
  onEmailChange,
  onSubmit,
  isLoading = false,
}) => {
  const theme = useTheme();

  return (
    <Container>
      <Label>Email address</Label>
      <StyledTextInput
        placeholder="you@example.com"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <SubmitButton onPress={onSubmit} disabled={isLoading} activeOpacity={0.85}>
        <GradientBackground
          colors={[theme.colors.primary, theme.colors.primaryMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ButtonText>Send magic link</ButtonText>
          )}
        </GradientBackground>
      </SubmitButton>
    </Container>
  );
};
