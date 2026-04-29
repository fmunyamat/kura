jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { MagicLinkForm } from './MagicLinkForm';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('MagicLinkForm', () => {
  it('renders the email placeholder', () => {
    const { getByPlaceholderText } = render(
      <MagicLinkForm email="" onEmailChange={jest.fn()} onSubmit={jest.fn()} />,
      { wrapper: Wrapper }
    );
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  it('calls onEmailChange when text changes', () => {
    const onEmailChange = jest.fn();
    const { getByPlaceholderText } = render(
      <MagicLinkForm email="" onEmailChange={onEmailChange} onSubmit={jest.fn()} />,
      { wrapper: Wrapper }
    );
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    expect(onEmailChange).toHaveBeenCalledWith('test@example.com');
  });

  it('calls onSubmit when button is pressed', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(
      <MagicLinkForm email="" onEmailChange={jest.fn()} onSubmit={onSubmit} />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getByText('Send magic link'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
