export const rescueDetailQueryKeys = {
  all: ['rescueDetail'] as const,
  detail: (id: number) => [...rescueDetailQueryKeys.all, 'detail', id] as const,
};
