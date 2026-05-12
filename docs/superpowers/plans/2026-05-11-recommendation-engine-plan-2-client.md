# Recommendation Engine — Plan 2: Client Side

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the client-side recommendation UI — a RecommendationCard with Yes/No buttons shown on the Home screen, a Settings screen with grass type change and "I've moved" data reset.

**Architecture:** TanStack Query fetches `pending` recommendation_events rows. Each row maps to display content (title, question, button labels) via a constants file. Yes/No mutations update the row status and invalidate the query so the card disappears immediately. The Settings screen uses a Supabase RPC to atomically wipe all user data on "I've moved".

**Tech Stack:** TanStack Query v5, Zustand, Supabase JS client, styled-components, RNTL (tests)

**Prerequisite:** Plan 1 (Foundation) must be complete — `recommendation_events` table and Supabase client must exist.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Install | `@tanstack/react-query` | Server state for recommendation queries and mutations |
| Create | `src/features/recommendations/types.ts` | RecommendationEvent type, status enum |
| Create | `src/features/recommendations/constants/recommendationContent.ts` | Maps recommendation type → display copy |
| Create | `src/features/recommendations/services/recommendations.service.ts` | Supabase queries: fetch pending, confirm, snooze |
| Create | `src/features/recommendations/services/recommendations.service.test.ts` | Unit tests |
| Create | `src/features/recommendations/hooks/useActiveRecommendations.ts` | TanStack Query — fetches pending recommendations |
| Create | `src/features/recommendations/hooks/useConfirmRecommendation.ts` | Mutation — sets status to confirmed |
| Create | `src/features/recommendations/hooks/useSnoozeRecommendation.ts` | Mutation — sets status to snoozed + snoozed_until |
| Create | `src/features/recommendations/components/RecommendationCard/RecommendationCard.tsx` | Card UI with Yes/Not yet buttons |
| Create | `src/features/recommendations/components/RecommendationCard/RecommendationCard.test.tsx` | RNTL tests |
| Create | `src/features/recommendations/components/RecommendationCard/index.tsx` | Barrel export |
| Modify | `src/features/onboarding/screens/Dashboard.tsx` | Show RecommendationCards above task list placeholder |
| Create | `app/(tabs)/settings.tsx` | Expo Router route for Settings tab |
| Create | `src/features/settings/screens/SettingsScreen.tsx` | Change grass type + I've moved |
| Create | `supabase/migrations/20260511000002_reset_user_data_rpc.sql` | reset_user_data() Postgres RPC |
| Modify | `app/(tabs)/_layout.tsx` | Add Settings tab |
| Install | `expo-notifications` | Push token registration |
| Create | `src/features/notifications/hooks/usePushToken.ts` | Registers for push notifications and upserts token to user_profiles |

---

### Task 1: Install TanStack Query and set up provider

**Files:**
- Install package
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Install TanStack Query**

```bash
npm install @tanstack/react-query
```

Expected: added to `package.json` dependencies.

- [ ] **Step 2: Add QueryProvider to app layout**

Read `app/_layout.tsx` first to see its current contents, then wrap with QueryClientProvider. The file likely exports a root layout — add the provider inside it:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

// queryClient — single TanStack Query client for the entire app.
// staleTime 0 means data is always considered stale on mount
// (safe default — each screen fetches fresh data when focused).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        {/* existing Stack.Screen entries */}
      </Stack>
    </QueryClientProvider>
  );
}
```

Preserve any existing imports and Stack.Screen entries — only add the QueryClientProvider wrapper.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx package.json package-lock.json
git commit -m "feat: install TanStack Query and add QueryClientProvider to root layout"
```

---

### Task 2: Recommendations types and constants

**Files:**
- Create: `src/features/recommendations/types.ts`
- Create: `src/features/recommendations/constants/recommendationContent.ts`

- [ ] **Step 1: Create types**

Create `src/features/recommendations/types.ts`:

```ts
// RecommendationStatus — lifecycle of a single recommendation.
// pending: shown to user as a card.
// confirmed: user tapped Yes — task is accepted.
// snoozed: user tapped Not yet — hidden until snoozed_until date.
// dismissed: season ended before user responded — archived automatically.
export type RecommendationStatus =
  | 'pending'
  | 'confirmed'
  | 'snoozed'
  | 'dismissed';

// RecommendationEvent — a row from the recommendation_events table.
export interface RecommendationEvent {
  id: string;
  user_id: string;
  type: string;
  status: RecommendationStatus;
  snoozed_until: string | null;
  gdd_at_trigger: number | null;
  soil_temp_at_trigger: number | null;
  created_at: string;
  updated_at: string;
}

// RecommendationContent — the display copy for a given recommendation type.
export interface RecommendationContent {
  title: string;
  question: string;
  yesLabel: string;
  noLabel: string;
}
```

- [ ] **Step 2: Create content map**

Create `src/features/recommendations/constants/recommendationContent.ts`:

```ts
import type { RecommendationContent } from '~/features/recommendations/types';

// RECOMMENDATION_CONTENT — maps each recommendation type string to the
// copy shown on its task card. The question text is written for beginners —
// plain language, no lawn jargon. More types will be added here when
// GDD threshold ranges are confirmed.
export const RECOMMENDATION_CONTENT: Record<string, RecommendationContent> = {
  dormancy_break: {
    title: 'Your grass may be waking up',
    question: 'Are you starting to see green blades growing in your lawn?',
    yesLabel: 'Yes, I see green',
    noLabel: 'Not yet',
  },
  pre_emergent: {
    title: 'Time to apply pre-emergent',
    question:
      'The soil is warm enough for weed seeds to germinate. Have weeds started to appear?',
    yesLabel: "I'll apply it now",
    noLabel: 'Not seeing any yet',
  },
  spring_fertilize: {
    title: 'First fertilizer of the season',
    question: 'Is your grass actively growing — are you mowing it yet?',
    yesLabel: "Yes, I'll fertilize",
    noLabel: 'Not growing yet',
  },
};

// FALLBACK_CONTENT — shown when a recommendation type has no entry above.
// Should not appear in production; exists to prevent blank cards if a
// new type is deployed to the Edge Function before the client is updated.
export const FALLBACK_CONTENT: RecommendationContent = {
  title: 'Time for a lawn task',
  question: 'Based on your location and grass type, now is a good time to act.',
  yesLabel: "I'm on it",
  noLabel: 'Remind me later',
};
```

- [ ] **Step 3: Commit**

```bash
git add src/features/recommendations/types.ts \
        src/features/recommendations/constants/recommendationContent.ts
git commit -m "feat: add recommendation types and display content constants"
```

---

### Task 3: Recommendations service

**Files:**
- Create: `src/features/recommendations/services/recommendations.service.ts`
- Create: `src/features/recommendations/services/recommendations.service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/features/recommendations/services/recommendations.service.test.ts`:

```ts
jest.mock('~/shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { recommendationsService } from './recommendations.service';
import { supabase } from '~/shared/lib/supabase';

const mockFrom = (returnValue: object) => {
  (supabase.from as jest.Mock).mockReturnValue(returnValue);
};

describe('recommendationsService.getActive', () => {
  it('queries recommendation_events for pending status', async () => {
    const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
    mockFrom({ select: () => ({ eq: () => ({ eq: mockSelect }) }) });

    await recommendationsService.getActive();
    expect(supabase.from).toHaveBeenCalledWith('recommendation_events');
  });

  it('throws when Supabase returns an error', async () => {
    mockFrom({
      select: () => ({ eq: () => ({ eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }) }) }),
    });
    await expect(recommendationsService.getActive()).rejects.toThrow('DB error');
  });
});

describe('recommendationsService.confirm', () => {
  it('updates status to confirmed', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ error: null });
    mockFrom({ update: () => ({ eq: mockUpdate }) });
    await recommendationsService.confirm('rec-id-123');
    expect(supabase.from).toHaveBeenCalledWith('recommendation_events');
  });
});

describe('recommendationsService.snooze', () => {
  it('updates status to snoozed with snoozed_until date', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ error: null });
    mockFrom({ update: () => ({ eq: mockUpdate }) });
    await recommendationsService.snooze('rec-id-123', 5);
    expect(supabase.from).toHaveBeenCalledWith('recommendation_events');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/features/recommendations/services/recommendations.service.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement recommendations service**

Create `src/features/recommendations/services/recommendations.service.ts`:

```ts
import { supabase } from '~/shared/lib/supabase';
import type { RecommendationEvent } from '~/features/recommendations/types';

export const recommendationsService = {
  // getActive — fetches all pending recommendations for the current user.
  // Called on every Home screen focus via TanStack Query. RLS ensures
  // users only ever see their own rows.
  async getActive(): Promise<RecommendationEvent[]> {
    const { data, error } = await supabase
      .from('recommendation_events')
      .select('*')
      .eq('status', 'pending');

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // confirm — marks a recommendation as confirmed (user tapped Yes).
  // Triggers the query invalidation in the hook so the card disappears.
  async confirm(id: string): Promise<void> {
    const { error } = await supabase
      .from('recommendation_events')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // snooze — hides a recommendation for snoozeDays days (user tapped Not yet).
  // The Edge Function checks snoozed_until before re-firing the same type.
  async snooze(id: string, snoozeDays: number): Promise<void> {
    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + snoozeDays);

    const { error } = await supabase
      .from('recommendation_events')
      .update({
        status: 'snoozed',
        snoozed_until: snoozedUntil.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest src/features/recommendations/services/recommendations.service.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/recommendations/services/
git commit -m "feat: add recommendations service (getActive, confirm, snooze)"
```

---

### Task 4: Recommendation query and mutation hooks

**Files:**
- Create: `src/features/recommendations/hooks/useActiveRecommendations.ts`
- Create: `src/features/recommendations/hooks/useConfirmRecommendation.ts`
- Create: `src/features/recommendations/hooks/useSnoozeRecommendation.ts`

- [ ] **Step 1: Create the query hook**

Create `src/features/recommendations/hooks/useActiveRecommendations.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { recommendationsService } from '~/features/recommendations/services/recommendations.service';

// RECOMMENDATIONS_QUERY_KEY — shared key for invalidation in mutation hooks.
export const RECOMMENDATIONS_QUERY_KEY = ['recommendations', 'active'] as const;

// useActiveRecommendations — fetches all pending recommendation cards for
// the current user. Refetches on screen focus so tapping a push notification
// and opening the app always shows fresh data.
export const useActiveRecommendations = () =>
  useQuery({
    queryKey: RECOMMENDATIONS_QUERY_KEY,
    queryFn: recommendationsService.getActive,
  });
```

- [ ] **Step 2: Create the confirm mutation hook**

Create `src/features/recommendations/hooks/useConfirmRecommendation.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationsService } from '~/features/recommendations/services/recommendations.service';
import { RECOMMENDATIONS_QUERY_KEY } from './useActiveRecommendations';

// useConfirmRecommendation — fires when the user taps Yes on a card.
// Invalidates the active recommendations query so the card disappears immediately.
export const useConfirmRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recommendationsService.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY });
    },
  });
};
```

- [ ] **Step 3: Create the snooze mutation hook**

Create `src/features/recommendations/hooks/useSnoozeRecommendation.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationsService } from '~/features/recommendations/services/recommendations.service';
import { RECOMMENDATIONS_QUERY_KEY } from './useActiveRecommendations';

// DEFAULT_SNOOZE_DAYS — how long a "Not yet" answer hides the card.
// The Edge Function checks snoozed_until and won't re-fire before this window.
const DEFAULT_SNOOZE_DAYS = 5;

// useSnoozeRecommendation — fires when the user taps "Not yet" on a card.
// Hides the card for DEFAULT_SNOOZE_DAYS days and invalidates the query.
export const useSnoozeRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      recommendationsService.snooze(id, DEFAULT_SNOOZE_DAYS),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECOMMENDATIONS_QUERY_KEY });
    },
  });
};
```

- [ ] **Step 4: Commit**

```bash
git add src/features/recommendations/hooks/
git commit -m "feat: add useActiveRecommendations, useConfirmRecommendation, useSnoozeRecommendation hooks"
```

---

### Task 5: RecommendationCard component

**Files:**
- Create: `src/features/recommendations/components/RecommendationCard/RecommendationCard.tsx`
- Create: `src/features/recommendations/components/RecommendationCard/RecommendationCard.test.tsx`
- Create: `src/features/recommendations/components/RecommendationCard/index.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/features/recommendations/components/RecommendationCard/RecommendationCard.test.tsx`:

```tsx
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { RecommendationCard } from './RecommendationCard';

const mockRec = {
  id: 'rec-1',
  user_id: 'user-1',
  type: 'dormancy_break',
  status: 'pending' as const,
  snoozed_until: null,
  gdd_at_trigger: 120,
  soil_temp_at_trigger: 52.3,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('RecommendationCard', () => {
  it('renders the card title and question', () => {
    const { getByText } = render(
      <RecommendationCard
        recommendation={mockRec}
        onConfirm={jest.fn()}
        onSnooze={jest.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('Your grass may be waking up')).toBeTruthy();
    expect(getByText(/Are you starting to see green blades/i)).toBeTruthy();
  });

  it('calls onConfirm with the recommendation id when Yes is pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <RecommendationCard
        recommendation={mockRec}
        onConfirm={onConfirm}
        onSnooze={jest.fn()}
      />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getByText('Yes, I see green'));
    expect(onConfirm).toHaveBeenCalledWith('rec-1');
  });

  it('calls onSnooze with the recommendation id when Not yet is pressed', () => {
    const onSnooze = jest.fn();
    const { getByText } = render(
      <RecommendationCard
        recommendation={mockRec}
        onConfirm={jest.fn()}
        onSnooze={onSnooze}
      />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getByText('Not yet'));
    expect(onSnooze).toHaveBeenCalledWith('rec-1');
  });

  it('renders fallback content for unknown recommendation types', () => {
    const { getByText } = render(
      <RecommendationCard
        recommendation={{ ...mockRec, type: 'unknown_future_type' }}
        onConfirm={jest.fn()}
        onSnooze={jest.fn()}
      />,
      { wrapper: Wrapper }
    );
    expect(getByText('Time for a lawn task')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/features/recommendations/components/RecommendationCard/RecommendationCard.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement RecommendationCard**

Create `src/features/recommendations/components/RecommendationCard/RecommendationCard.tsx`:

```tsx
import styled from 'styled-components/native';
import {
  FALLBACK_CONTENT,
  RECOMMENDATION_CONTENT,
} from '~/features/recommendations/constants/recommendationContent';
import type { RecommendationEvent } from '~/features/recommendations/types';

// Card — the outer container. Uses the same glass style as other cards
// in the app for visual consistency.
const Card = styled.View`
  background-color: ${({ theme }) => theme.colors.glassCard};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// CardTitle — the main heading on the card. Bold so it reads as a task.
const CardTitle = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.textOnGlass};
`;

// CardQuestion — the plain-English question asking the user what they see.
const CardQuestion = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// ButtonRow — side-by-side Yes and Not yet buttons.
const ButtonRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

// YesButton — confirms the recommendation. Uses the accent green to
// signal a positive action.
const YesButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.gradientMidLight};
  border-radius: ${({ theme }) => theme.radii.sm}px;
  padding: ${({ theme }) => theme.spacing.sm}px;
  align-items: center;
`;

// NoButton — snoozes the recommendation. Outlined style signals it's
// a secondary action, not a dismissal.
const NoButton = styled.TouchableOpacity`
  flex: 1;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.textMutedOnGlass};
  border-radius: ${({ theme }) => theme.radii.sm}px;
  padding: ${({ theme }) => theme.spacing.sm}px;
  align-items: center;
`;

const YesButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
`;

const NoButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
`;

interface RecommendationCardProps {
  recommendation: RecommendationEvent;
  onConfirm: (id: string) => void;
  onSnooze: (id: string) => void;
}

// RecommendationCard — a time-sensitive task card shown at the top of the
// Home screen when the recommendation engine fires. The question and button
// labels come from RECOMMENDATION_CONTENT keyed by recommendation.type.
// Yes confirms the task; Not yet snoozes it for 5 days.
export const RecommendationCard = ({
  recommendation,
  onConfirm,
  onSnooze,
}: RecommendationCardProps) => {
  const content =
    RECOMMENDATION_CONTENT[recommendation.type] ?? FALLBACK_CONTENT;

  return (
    <Card>
      <CardTitle>{content.title}</CardTitle>
      <CardQuestion>{content.question}</CardQuestion>
      <ButtonRow>
        <YesButton
          onPress={() => onConfirm(recommendation.id)}
          accessibilityRole="button"
          accessibilityLabel={content.yesLabel}
        >
          <YesButtonText>{content.yesLabel}</YesButtonText>
        </YesButton>
        <NoButton
          onPress={() => onSnooze(recommendation.id)}
          accessibilityRole="button"
          accessibilityLabel={content.noLabel}
        >
          <NoButtonText>{content.noLabel}</NoButtonText>
        </NoButton>
      </ButtonRow>
    </Card>
  );
};
```

- [ ] **Step 4: Create barrel export**

Create `src/features/recommendations/components/RecommendationCard/index.tsx`:

```ts
export { RecommendationCard } from './RecommendationCard';
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx jest src/features/recommendations/components/RecommendationCard/RecommendationCard.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/features/recommendations/components/RecommendationCard/
git commit -m "feat: add RecommendationCard component with Yes/Not yet buttons"
```

---

### Task 6: Update Home screen (Dashboard)

**Files:**
- Modify: `src/features/onboarding/screens/Dashboard.tsx`

The Dashboard is currently a placeholder. Wire in the recommendation cards above a task list placeholder.

- [ ] **Step 1: Update Dashboard.tsx**

Replace `src/features/onboarding/screens/Dashboard.tsx`:

```tsx
import { FlatList, View } from 'react-native';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecommendationCard } from '~/features/recommendations/components/RecommendationCard';
import { useActiveRecommendations } from '~/features/recommendations/hooks/useActiveRecommendations';
import { useConfirmRecommendation } from '~/features/recommendations/hooks/useConfirmRecommendation';
import { useSnoozeRecommendation } from '~/features/recommendations/hooks/useSnoozeRecommendation';

// ScreenRoot — full-screen safe area container.
const ScreenRoot = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

// ContentArea — scrollable content with consistent horizontal padding.
const ContentArea = styled.View`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

// SectionTitle — labels each section of the dashboard.
const SectionTitle = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeLg}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.text};
`;

// PlaceholderCard — temporary stand-in for task list items.
// Will be replaced by TaskCard in the tasks feature build.
const PlaceholderCard = styled.View`
  background-color: ${({ theme }) => theme.colors.glassCard};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  height: 64px;
`;

// Dashboard — the main Home tab screen.
// Recommendation cards appear at the top when time-sensitive actions are
// pending. The task list below will be populated when the tasks feature
// is built. If recommendation fetch fails, the screen degrades gracefully —
// the task list still loads independently.
export const Dashboard = () => {
  const { data: recommendations = [] } = useActiveRecommendations();
  const { mutate: confirm } = useConfirmRecommendation();
  const { mutate: snooze } = useSnoozeRecommendation();

  return (
    <ScreenRoot>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 16 }}
        data={[]}
        keyExtractor={(item) => item}
        renderItem={null}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            {recommendations.length > 0 && (
              <>
                <SectionTitle>Action needed</SectionTitle>
                {recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onConfirm={confirm}
                    onSnooze={snooze}
                  />
                ))}
              </>
            )}
            <SectionTitle>Your tasks</SectionTitle>
            {/* TaskList will replace these placeholders in the tasks feature */}
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
          </View>
        }
      />
    </ScreenRoot>
  );
};

export default Dashboard;
```

- [ ] **Step 2: Commit**

```bash
git add src/features/onboarding/screens/Dashboard.tsx
git commit -m "feat: show RecommendationCards on Dashboard above task list placeholder"
```

---

### Task 7: reset_user_data RPC migration

**Files:**
- Create: `supabase/migrations/20260511000002_reset_user_data_rpc.sql`

- [ ] **Step 1: Write migration SQL**

Create `supabase/migrations/20260511000002_reset_user_data_rpc.sql`:

```sql
-- reset_user_data — atomically deletes all lawn data for the calling user.
-- Used by the "I've moved" flow in Settings. The auth account (auth.users row)
-- is preserved so the user keeps their email/session.
-- SECURITY DEFINER runs as the function owner (service role), which allows
-- deleting across tables that have RLS. auth.uid() still resolves to the
-- calling user's ID so only their own data is deleted.
CREATE OR REPLACE FUNCTION reset_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete profile and all associated rows.
  -- task_completions, recommendation_events, and lawn_photos all FK to
  -- auth.users (not user_profiles), so they must be deleted explicitly.
  DELETE FROM user_profiles         WHERE user_id = auth.uid();
  DELETE FROM task_completions      WHERE user_id = auth.uid();
  DELETE FROM recommendation_events WHERE user_id = auth.uid();
  DELETE FROM lawn_photos           WHERE user_id = auth.uid();
  -- Note: lawn-photos Storage objects must be deleted by the calling client
  -- after this RPC returns. The DB rows are gone; Storage is separate.
END;
$$;

-- Grant execute permission to authenticated users only.
GRANT EXECUTE ON FUNCTION reset_user_data() TO authenticated;
```

- [ ] **Step 2: Apply migration**

Using the Supabase MCP tool:
```
mcp__plugin_supabase_supabase__apply_migration
  name: "reset_user_data_rpc"
  query: <paste full SQL above>
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260511000002_reset_user_data_rpc.sql
git commit -m "feat: add reset_user_data() RPC for I've moved data wipe"
```

---

### Task 8: Settings screen

**Files:**
- Create: `src/features/settings/screens/SettingsScreen.tsx`
- Create: `app/(tabs)/settings.tsx`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create SettingsScreen**

Create `src/features/settings/screens/SettingsScreen.tsx`:

```tsx
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '~/shared/lib/supabase';
import { logger } from '~/shared/utils/logger';

// ScreenRoot — full-screen safe area container.
const ScreenRoot = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

// SectionTitle — labels each settings group.
const SectionTitle = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  margin-top: ${({ theme }) => theme.spacing.md}px;
`;

// SettingsCard — container for a group of settings rows.
const SettingsCard = styled.View`
  background-color: ${({ theme }) => theme.colors.glassCard};
  border-radius: ${({ theme }) => theme.radii.md}px;
  overflow: hidden;
`;

// SettingsRow — a single tappable settings item.
const SettingsRow = styled.TouchableOpacity`
  padding: ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

// RowLabel — the setting name.
const RowLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeMd}px;
  color: ${({ theme }) => theme.colors.text};
`;

// RowValue — current value shown on the right (e.g. "Cool-season").
const RowValue = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
`;

// Divider — thin line between rows in a card.
const Divider = styled.View`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
  margin-left: ${({ theme }) => theme.spacing.md}px;
`;

// DestructiveRow — "I've moved" row styled in red to signal data loss.
const DestructiveRow = styled(SettingsRow)``;

const DestructiveLabel = styled(RowLabel)`
  color: ${({ theme }) => theme.colors.error};
`;

// GrassTypePicker — inline picker shown when the user taps Change grass type.
const PickerContainer = styled.View`
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const PickerOption = styled.TouchableOpacity<{ $selected: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm}px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.colors.gradientMidLight : theme.colors.glassOnboardingInput};
  align-items: center;
`;

const PickerOptionText = styled.Text<{ $selected: boolean }>`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.white : theme.colors.textOnGlass};
  font-weight: ${({ theme }) => theme.typography.weightBold};
`;

const PickerNote = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  text-align: center;
`;

type GrassType = 'cool-season' | 'warm-season';

// SettingsScreen — allows the user to change their grass type or trigger a
// full data reset if they've moved to a new location.
export const SettingsScreen = () => {
  const [grassType, setGrassType] = useState<GrassType | null>(null);
  const [showGrassPicker, setShowGrassPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleChangeGrassType = async (newType: GrassType) => {
    if (isSaving || newType === grassType) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ grass_type: newType });

      if (error) throw new Error(error.message);
      setGrassType(newType);
      setShowGrassPicker(false);
    } catch (err) {
      logger.error('Failed to update grass type', err);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleIveMoved = () => {
    // Warn the user before wiping all data — this is irreversible (MASWE-0087).
    Alert.alert(
      "You've moved?",
      'This will erase all your lawn history, photos, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, start fresh',
          style: 'destructive',
          onPress: confirmReset,
        },
      ]
    );
  };

  const confirmReset = async () => {
    setIsResetting(true);

    try {
      // Delete all user data via the RPC (runs in a transaction server-side).
      const { error } = await supabase.rpc('reset_user_data');
      if (error) throw new Error(error.message);

      // Delete lawn-photos Storage objects. If this fails the DB is already
      // clean — log the error but don't block onboarding.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: storageError } = await supabase.storage
          .from('lawn-photos')
          .remove([`${user.id}/`]);
        if (storageError) {
          logger.error('Storage cleanup failed after reset', storageError);
        }
      }

      // Navigate back to onboarding so the user sets up their new location.
      router.replace('/onboarding');
    } catch (err) {
      logger.error('Data reset failed', err);
      Alert.alert('Something went wrong', 'Please try again or contact support.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <ScreenRoot>
      <SectionTitle>Your lawn</SectionTitle>
      <SettingsCard>
        <SettingsRow onPress={() => setShowGrassPicker((v) => !v)}>
          <RowLabel>Grass type</RowLabel>
          <RowValue>
            {grassType
              ? grassType === 'cool-season'
                ? 'Cool-season'
                : 'Warm-season'
              : 'Loading...'}
          </RowValue>
        </SettingsRow>

        {showGrassPicker && (
          <>
            <Divider />
            <PickerContainer>
              <PickerOption
                $selected={grassType === 'cool-season'}
                onPress={() => handleChangeGrassType('cool-season')}
                accessibilityRole="radio"
              >
                <PickerOptionText $selected={grassType === 'cool-season'}>
                  ❄️ Cool-season
                </PickerOptionText>
              </PickerOption>
              <PickerOption
                $selected={grassType === 'warm-season'}
                onPress={() => handleChangeGrassType('warm-season')}
                accessibilityRole="radio"
              >
                <PickerOptionText $selected={grassType === 'warm-season'}>
                  ☀️ Warm-season
                </PickerOptionText>
              </PickerOption>
              <PickerNote>
                Changing your grass type will affect all future recommendations.
              </PickerNote>
            </PickerContainer>
          </>
        )}
      </SettingsCard>

      <SectionTitle>Location</SectionTitle>
      <SettingsCard>
        <DestructiveRow
          onPress={handleIveMoved}
          disabled={isResetting}
          accessibilityRole="button"
        >
          <DestructiveLabel>
            {isResetting ? 'Resetting...' : "I've moved"}
          </DestructiveLabel>
        </DestructiveRow>
      </SettingsCard>
    </ScreenRoot>
  );
};

export default SettingsScreen;
```

Note: The current grass type is not yet loaded from the DB in this implementation — `grassType` starts as `null` and shows "Loading...". Loading the current value from Supabase on mount (with `useEffect` + TanStack Query) is a follow-up improvement once the tasks feature and profile hooks are built.

- [ ] **Step 2: Create the route file**

Create `app/(tabs)/settings.tsx`:

```ts
export { default } from '~/features/settings/screens/SettingsScreen';
```

- [ ] **Step 3: Add Settings tab to layout**

Update `app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';

// TabsLayout — root layout for the authenticated tab navigator.
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/ app/(tabs)/settings.tsx app/(tabs)/_layout.tsx
git commit -m "feat: add Settings screen with grass type picker and I've moved data reset"
```

---

### Task 9: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
npx jest
```

Expected: All tests pass. If any fail, fix before proceeding.

- [ ] **Step 2: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: resolve test failures after Plan 2 integration"
```

---

---

### Task 10: Push token registration

**Files:**
- Create: `src/features/notifications/hooks/usePushToken.ts`

The Edge Function only processes users who have a `push_token` stored. Without this task, no push notifications fire. Call `usePushToken()` from the root authenticated layout so the token is registered as soon as the user has a session.

- [ ] **Step 1: Install expo-notifications**

```bash
npx expo install expo-notifications
```

Expected: added to `package.json` dependencies.

- [ ] **Step 2: Implement usePushToken**

Create `src/features/notifications/hooks/usePushToken.ts`:

```ts
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '~/shared/lib/supabase';
import { logger } from '~/shared/utils/logger';

// usePushToken — registers the device for push notifications and upserts
// the Expo push token to user_profiles. Called once after the user has an
// active session. The Edge Function reads this token to send notifications.
// Permission is requested at first call — if denied, the token is never
// stored and push notifications are silently skipped for this user.
export const usePushToken = () => {
  useEffect(() => {
    registerAndStore();
  }, []);

  const registerAndStore = async () => {
    // Android requires a notification channel before any notification shows.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission is denied, skip silently — push notifications are
    // a convenience, not a requirement for the app to function.
    if (finalStatus !== 'granted') return;

    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;

      const { error } = await supabase
        .from('user_profiles')
        .update({ push_token: token });

      if (error) logger.error('Failed to store push token', error);
    } catch (err) {
      logger.error('Push token registration failed', err);
    }
  };
};
```

- [ ] **Step 3: Call usePushToken from the authenticated layout**

In `app/(tabs)/_layout.tsx`, add the hook call:

```tsx
import { Tabs } from 'expo-router';
import { usePushToken } from '~/features/notifications/hooks/usePushToken';

export default function TabsLayout() {
  // Register for push notifications and store the token in user_profiles
  // so the Edge Function can reach this device.
  usePushToken();

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerShown: false }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', headerShown: false }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/notifications/hooks/usePushToken.ts app/(tabs)/_layout.tsx \
        package.json package-lock.json
git commit -m "feat: register push token and upsert to user_profiles on app launch"
```

---

### Task 11: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
npx jest
```

Expected: All tests pass. If any fail, fix before proceeding.

- [ ] **Step 2: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: resolve test failures after Plan 2 integration"
```

---

**Plan 2 complete.** The Home screen shows recommendation cards when the Edge Function fires them. The Settings screen lets users change their grass type or trigger a full data reset if they move.

**Next:** Plan 3 (Edge Function) will be written once GDD threshold ranges are confirmed by Farai. The plan will cover: GDD utilities, Open-Meteo weather fetching, weather_cache deduplication, rule evaluation, Expo push notification sending, main orchestrator, and pg_cron scheduling.
