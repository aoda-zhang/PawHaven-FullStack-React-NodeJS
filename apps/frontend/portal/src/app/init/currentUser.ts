import type { AuthUser } from '@pawhaven/shared/types';

import { sharedQueryKeys } from '@/shared/constants/sharedQueryKeys';
import { apiClient } from '@/shared/utils/apiClient';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const CURRENT_USER_STALE_MINUTES = 5;
const CURRENT_USER_STALE_TIME_MS =
  CURRENT_USER_STALE_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND;

// The JWT travels as an httpOnly cookie set by the gateway, so the browser
// never sees a token — the session is entirely server-side and this call is
// what tells us whether one exists.
const fetchCurrentUser = async (): Promise<AuthUser> => {
  return apiClient.get<AuthUser>('/auth/me');
};

/**
 * Options for the current-user query the auth guard suspends on.
 *
 * The key carries the id the provider holds for the signed-in user, so a
 * different user never reads the previous one's cached answer.
 */
export const currentUserQueryOptions = (userId: string) => ({
  queryKey: sharedQueryKeys.auth.currentUser(userId),
  queryFn: fetchCurrentUser,
  staleTime: CURRENT_USER_STALE_TIME_MS,
  retry: false,
});
