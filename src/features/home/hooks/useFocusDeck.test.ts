// Tests for useFocusDeck — the deck's state machine. We exercise the logic that
// would fail silently and mislead the user: the counter/labels, the peek
// bounds, the completion guards, and the cleared-deck transition. The animation
// itself isn't here — the hook's handoff point is handleCardFlyOutEnd, which we
// call directly to stand in for a card finishing its fly-off.

import { act, renderHook } from '@testing-library/react-native';

import { useFocusDeck } from './useFocusDeck';

// Run a full completion of the current front card: arm it, then fire the
// callback the card would fire once it has flown away.
const completeFrontCard = (
  result: { current: ReturnType<typeof useFocusDeck> }
) => {
  act(() => result.current.handleComplete());
  act(() => result.current.handleCardFlyOutEnd());
};

describe('useFocusDeck', () => {
  it('starts on the first of three tasks with the full deck', () => {
    const { result } = renderHook(() => useFocusDeck());

    expect(result.current.remainingCards).toHaveLength(4); // 3 tasks + locked
    expect(result.current.peekIndex).toBe(0);
    expect(result.current.completionLabel).toBe('Task 1 of 3');
    expect(result.current.completionProgress).toBe(0);
    expect(result.current.peekLabel).toBe('Card 1 of 4');
    expect(result.current.isCleared).toBe(false);
    expect(result.current.streakDays).toBe(6);
  });

  it('peeks forward to the locked card and clamps at the end', () => {
    const { result } = renderHook(() => useFocusDeck());

    act(() => result.current.handlePeek(1));
    expect(result.current.peekIndex).toBe(1);
    expect(result.current.canPeekBack).toBe(true);

    act(() => result.current.handlePeek(1));
    act(() => result.current.handlePeek(1)); // now on the locked preview (index 3)
    expect(result.current.peekIndex).toBe(3);
    expect(result.current.peekLabel).toBe('Tomorrow · locked');
    expect(result.current.canPeekForward).toBe(false);

    act(() => result.current.handlePeek(1)); // no-op past the end
    expect(result.current.peekIndex).toBe(3);
  });

  it('does not peek back past the front of the deck', () => {
    const { result } = renderHook(() => useFocusDeck());

    expect(result.current.canPeekBack).toBe(false);
    act(() => result.current.handlePeek(-1));
    expect(result.current.peekIndex).toBe(0);
  });

  it('closes an open modal when the user peeks', () => {
    const { result } = renderHook(() => useFocusDeck());

    act(() => result.current.handleToggleExpanded());
    expect(result.current.isExpanded).toBe(true);

    act(() => result.current.handlePeek(1));
    expect(result.current.isExpanded).toBe(false);
  });

  it('ignores Done while peeked away from the front card', () => {
    const { result } = renderHook(() => useFocusDeck());

    act(() => result.current.handlePeek(1));
    act(() => result.current.handleComplete());
    expect(result.current.completingCardId).toBeNull();
    expect(result.current.isBusy).toBe(false);
  });

  it('advances the counter when a task is completed', () => {
    const { result } = renderHook(() => useFocusDeck());

    act(() => result.current.handleComplete());
    expect(result.current.isBusy).toBe(true);
    expect(result.current.completingCardId).toBe('soak');

    act(() => result.current.handleCardFlyOutEnd());
    expect(result.current.remainingCards).toHaveLength(3);
    expect(result.current.completionLabel).toBe('Task 2 of 3');
    expect(result.current.completionProgress).toBeCloseTo(1 / 3);
    expect(result.current.peekIndex).toBe(0);
    expect(result.current.isBusy).toBe(false);
  });

  it('clears the deck and ticks the streak after all three tasks', () => {
    const { result } = renderHook(() => useFocusDeck());

    completeFrontCard(result);
    completeFrontCard(result);
    completeFrontCard(result);

    expect(result.current.isCleared).toBe(true);
    expect(result.current.completionLabel).toBe('All done');
    expect(result.current.peekLabel).toBe('See you tomorrow');
    expect(result.current.canPeekBack).toBe(false);
    expect(result.current.canPeekForward).toBe(false);
    expect(result.current.streakDays).toBe(7);
    // The locked preview is still in the deck, never completed.
    expect(result.current.remainingCards).toHaveLength(1);
    expect(result.current.remainingCards[0].isLocked).toBe(true);
  });

  it('cannot complete the locked card once the deck is cleared', () => {
    const { result } = renderHook(() => useFocusDeck());

    completeFrontCard(result);
    completeFrontCard(result);
    completeFrontCard(result);

    act(() => result.current.handleComplete());
    expect(result.current.completingCardId).toBeNull();
    expect(result.current.remainingCards).toHaveLength(1);
  });
});
