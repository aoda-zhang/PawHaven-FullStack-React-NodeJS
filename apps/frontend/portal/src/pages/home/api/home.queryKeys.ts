import { sharedQueryKeys } from '@/shared/constants/queryKeys';

export const homeQueryKeys = {
  all: sharedQueryKeys.home.all,
  content: () => [...sharedQueryKeys.home.all, 'content'] as const,
};
