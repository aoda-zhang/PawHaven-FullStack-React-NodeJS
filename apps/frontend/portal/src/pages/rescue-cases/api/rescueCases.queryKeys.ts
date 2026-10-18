import { sharedQueryKeys } from '@/shared/constants/sharedQueryKeys';

export const rescueCasesQueryKeys = {
  all: sharedQueryKeys.rescueCases.all,
  detail: (id: string) =>
    [...sharedQueryKeys.rescueCases.all, 'detail', id] as const,
};
