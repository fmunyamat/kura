import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { ConfirmationPanel } from './ConfirmationPanel';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('ConfirmationPanel', () => {
  it('renders the heading', () => {
    const { getByText } = render(
      <ConfirmationPanel email="hello@kura.com" onReset={jest.fn()} />,
      { wrapper: Wrapper },
    );
    expect(getByText('Check your inbox')).toBeTruthy();
  });

  it('displays the submitted email', () => {
    const { getByText } = render(
      <ConfirmationPanel email="hello@kura.com" onReset={jest.fn()} />,
      { wrapper: Wrapper },
    );
    expect(getByText('hello@kura.com')).toBeTruthy();
  });

  it('calls onReset when the reset link is pressed', () => {
    const onReset = jest.fn();
    const { getByText } = render(
      <ConfirmationPanel email="hello@kura.com" onReset={onReset} />,
      { wrapper: Wrapper },
    );
    fireEvent.press(getByText('Use a different email'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
