import { sharedQueryKeys } from '@/shared/constants/queryKeys';

export const rescueCasesQueryKeys = {
  all: sharedQueryKeys.rescueCases.all,
  detail: (id: string) =>
    [...sharedQueryKeys.rescueCases.all, 'detail', id] as const,
};
