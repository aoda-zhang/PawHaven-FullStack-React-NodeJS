import { useQuery } from '@tanstack/react-query';

import { getUserCurrent } from './auth.api';
import { authQueryKeys } from './auth.queryKeys';

import { useGlobalState } from '@/store/globalReducer';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const CURRENT_USER_STALE_MINUTES = 5;
const CURRENT_USER_STALE_TIME_MS =
  CURRENT_USER_STALE_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND;

export const useCurrentUser = () => {
  const { profile } = useGlobalState();
  const userId = profile?.baseUserInfo?.userID ?? '';
  return useQuery({
    queryKey: authQueryKeys.currentUser(userId),
    queryFn: getUserCurrent,
    staleTime: CURRENT_USER_STALE_TIME_MS,
    retry: false,
  });
};
