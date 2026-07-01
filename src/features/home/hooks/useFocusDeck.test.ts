// Tests for useFocusDeck — the Today accordion's state machine. We exercise the
// logic that would mislead the user if it broke silently: the counter/labels,
// which row is open, the completion guards (locked + already-done), and the
// cleared-deck transition that ticks the streak.

import { act, renderHook } from '@testing-library/react-native';

import { useFocusDeck } from './useFocusDeck';

describe('useFocusDeck', () => {
  it('starts with the first task open and nothing done', () => {
    const { result } = renderHook(() => useFocusDeck());

    expect(result.current.cards).toHaveLength(4); // 3 tasks + locked preview
    expect(result.current.openId).toBe('soak');
    expect(result.current.doneIds).toEqual([]);
    expect(result.current.completionLabel).toBe('Task 1 of 3');
    expect(result.current.completionProgress).toBe(0);
    expect(result.current.isCleared).toBe(false);
    expect(result.current.streakDays).toBe(6);
  });

  it('opens the tapped row and closes whatever was open', () => {
    const { result } = renderHook(() => useFocusDeck());

    act(() => result.current.handleToggleRow('edges'));
    expect(result.current.openId).toBe('edges');

    // Tapping the open row again closes it.
    act(() => result.current.handleToggleRow('edges'));
    expect(result.current.openId).toBeNull();
  });

  it('completes a task, ticks the counter, and opens the next one', () => {
    const { result } = renderHook(() => useFocusDeck());

    act(() => result.current.handleComplete('soak'));

    expect(result.current.isDone('soak')).toBe(true);
    expect(result.current.completionLabel).toBe('Task 2 of 3');
    expect(result.current.completionProgress).toBeCloseTo(1 / 3);
    // The next unfinished task opens automatically.
    expect(result.current.openId).toBe('edges');
  });

  it('ignores a second completion of the same task', () => {
    const { result } = renderHook(() => useFocusDeck());

    act(() => result.current.handleComplete('soak'));
    act(() => result.current.handleComplete('soak'));

    expect(result.current.doneIds).toEqual(['soak']);
    expect(result.current.completionProgress).toBeCloseTo(1 / 3);
  });

  it('clears the deck and ticks the streak after all three tasks', () => {
    const { result } = renderHook(() => useFocusDeck());

    act(() => result.current.handleComplete('soak'));
    act(() => result.current.handleComplete('edges'));
    act(() => result.current.handleComplete('feed'));

    expect(result.current.isCleared).toBe(true);
    expect(result.current.completionLabel).toBe('All done');
    expect(result.current.completionProgress).toBe(1);
    expect(result.current.streakDays).toBe(7);
    // No task is left open once the day is cleared.
    expect(result.current.openId).toBeNull();
  });

  it('never completes the locked preview card', () => {
    const { result } = renderHook(() => useFocusDeck());

    act(() => result.current.handleComplete('mow')); // the locked card

    expect(result.current.isDone('mow')).toBe(false);
    expect(result.current.doneIds).toEqual([]);
    expect(result.current.completionProgress).toBe(0);
  });
});
