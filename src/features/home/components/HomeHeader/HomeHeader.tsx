// HomeHeader — the top of the Today screen: a small uppercase eyebrow naming
// the day, and the big personal greeting underneath it.

import styled from 'styled-components/native';

interface HomeHeaderProps {
  eyebrow: string;
  greeting: string;
}

// Eyebrow — the tiny, wide-spaced uppercase line above the greeting (e.g. the
// day of the week). Deliberately faint so it sits quietly over the photo.
const Eyebrow = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9.5px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textPhotoSubtle};
`;

// Greeting — the big, bold personal hello (e.g. "Good morning, Sam"). This is
// the main headline of the Today screen, sized large to lead the eye.
const Greeting = styled.Text`
  margin-top: 12px;
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 24px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
`;

export const HomeHeader = ({ eyebrow, greeting }: HomeHeaderProps) => (
  <>
    <Eyebrow>{eyebrow}</Eyebrow>
    <Greeting>{greeting}</Greeting>
  </>
);
