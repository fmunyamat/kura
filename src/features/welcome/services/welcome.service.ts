import { logger } from '~/shared/utils/logger';
import { supabase } from '~/shared/lib/supabase';

// welcomeService — handles the single write operation for the welcome flow.
// The service is intentionally tiny: one screen triggers it, one column changes.
export const welcomeService = {
  // markWelcomeSeen — sets has_seen_welcome = true for the currently authed user.
  // Only called when the user taps "Start Growing" on screen 4 of the welcome flow.
  // Throws on Supabase error so the caller can catch it and show an error message
  // without routing the user into AppTabs before the write is confirmed.
  async markWelcomeSeen(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // A missing user here means the session expired between screens — unlikely
    // but we treat it as a hard failure so the user is re-routed to sign-in by
    // the auth state change listener rather than silently entering the tabs.
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_profiles')
      .update({ has_seen_welcome: true })
      .eq('user_id', user.id);

    if (error) {
      logger.error('welcomeService.markWelcomeSeen failed', {
        operation: 'markWelcomeSeen',
        userId: user.id,
        supabaseCode: error.code,
      });
      throw new Error('markWelcomeSeen failed');
    }
  },
};
