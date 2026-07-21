import { useQuery } from '@tanstack/react-query';

import { getUserCurrent } from './auth.api';
import { authQueryKeys } from './auth.queryKeys';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: getUserCurrent,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
