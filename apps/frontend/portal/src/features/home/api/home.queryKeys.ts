export const homeQueryKeys = {
  all: ['home'] as const,
  content: () => [...homeQueryKeys.all, 'content'] as const,
};
