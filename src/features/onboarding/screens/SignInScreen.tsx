import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import styled from 'styled-components/native';
import { HeroSection } from '../components/HeroSection';
import { MagicLinkForm } from '../components/MagicLinkForm';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { ConfirmationPanel } from '../components/ConfirmationPanel';

const KEYBOARD_BEHAVIOR = Platform.select<'padding' | undefined>({
  ios: 'padding',
  default: undefined,
});

const Screen = styled(KeyboardAvoidingView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.screenDark};
`;

const AuthPanel = styled.View`
  flex: 3;
  background-color: ${({ theme }) => theme.colors.panelDark};
  border-top-width: 1px;
  border-top-color: rgba(255,255,255,0.08);
  padding: ${({ theme }) => theme.spacing.lg}px;
  gap: ${({ theme }) => theme.spacing.lg}px;
`;

const Divider = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.borderOnDark};
`;

const DividerText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
`;

export const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => setSubmitted(true);
  const handleReset = () => {
    setSubmitted(false);
    setEmail('');
  };

  return (
    <Screen behavior={KEYBOARD_BEHAVIOR}>
      <HeroSection />
      {submitted ? (
        <ConfirmationPanel email={email} onReset={handleReset} />
      ) : (
        <AuthPanel>
          <MagicLinkForm
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleSubmit}
          />
          <Divider>
            <DividerLine />
            <DividerText>or continue with</DividerText>
            <DividerLine />
          </Divider>
          <SocialAuthButtons
            onGooglePress={() => {}}
            onApplePress={() => {}}
          />
        </AuthPanel>
      )}
    </Screen>
  );
};
