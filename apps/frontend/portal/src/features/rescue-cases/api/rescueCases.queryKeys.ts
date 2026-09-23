export const rescueCasesQueryKeys = {
  all: ['rescueCases'] as const,
  detail: (id: string) => [...rescueCasesQueryKeys.all, 'detail', id] as const,
};
