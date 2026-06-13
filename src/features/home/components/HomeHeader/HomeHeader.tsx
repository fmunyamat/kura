// HomeHeader — the top of the Today screen: a small uppercase eyebrow naming
// the day, and the big personal greeting underneath it.

import styled from 'styled-components/native';

interface HomeHeaderProps {
  eyebrow: string;
  greeting: string;
}

const Eyebrow = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9.5px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.subtextOnPhoto};
`;

const Greeting = styled.Text`
  margin-top: 12px;
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 24px;
  color: ${({ theme }) => theme.colors.white};
`;

export const HomeHeader = ({ eyebrow, greeting }: HomeHeaderProps) => (
  <>
    <Eyebrow>{eyebrow}</Eyebrow>
    <Greeting>{greeting}</Greeting>
  </>
);
