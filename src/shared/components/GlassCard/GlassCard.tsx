import { ReactNode } from 'react';
import styled from 'styled-components/native';

interface GlassCardProps {
  children: ReactNode;
}

// Clip — rounded container clipped to its border-radius. overflow: hidden
// ensures children with backgrounds (inputs, rows) don't bleed past the
// rounded corners.
const Clip = styled.View`
  background-color: rgba(255, 255, 255, 0.44);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
`;

// Content — inner padding and gap that gives breathing room between
// the card's child elements (form, divider, social buttons).
const Content = styled.View`
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

// GlassCard — frosted white card used on the sign-in screen.
// rgba(255,255,255,0.44) background matches the FormCard / OptionsCard
// used across the onboarding screens for a consistent frosted look.
export const GlassCard = ({ children }: GlassCardProps) => (
  <Clip>
    <Content>{children}</Content>
  </Clip>
);

export default GlassCard;
