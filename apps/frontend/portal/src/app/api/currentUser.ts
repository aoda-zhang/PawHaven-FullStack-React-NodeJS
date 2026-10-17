import type { AuthUser } from '@pawhaven/shared/types';
import { useQuery } from '@tanstack/react-query';

import { getCurrentProfile } from '@/app/store/currentProfile';
import { useGlobalState } from '@/app/store/globalReducer';
import { sharedQueryKeys } from '@/shared/constants/queryKeys';
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

/** The id used to key the current-user cache; `''` when signed out. */
export const getCurrentUserId = (): string =>
  getCurrentProfile()?.baseUserInfo?.userID ?? '';

/**
 * Shared options for the current-user query.
 *
 * Both the auth route loader and `useCurrentUser()` build from this so they
 * agree on the cache key and only one request is ever in flight for it.
 */
export const currentUserQueryOptions = (userId: string) => ({
  queryKey: sharedQueryKeys.auth.currentUser(userId),
  queryFn: fetchCurrentUser,
  staleTime: CURRENT_USER_STALE_TIME_MS,
  retry: false,
});

export const useCurrentUser = () => {
  const { profile } = useGlobalState();
  const userId = profile?.baseUserInfo?.userID ?? '';
  return useQuery(currentUserQueryOptions(userId));
};
