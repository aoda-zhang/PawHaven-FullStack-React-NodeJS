import { sharedQueryKeys } from '@/shared/constants/sharedQueryKeys';

export const rescueCasesQueryKeys = {
  all: sharedQueryKeys.rescueCases.all,
  list: (params?: Record<string, unknown>) =>
    [...sharedQueryKeys.rescueCases.all(), 'list', params] as const,
  detail: (id: string) =>
    [...sharedQueryKeys.rescueCases.all(), 'detail', id] as const,
};
