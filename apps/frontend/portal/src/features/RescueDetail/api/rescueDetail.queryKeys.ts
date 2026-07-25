export const rescueDetailQueryKeys = {
  all: ['rescueDetail'] as const,
  detail: (id: string) => [...rescueDetailQueryKeys.all, 'detail', id] as const,
};
