export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: (userId: string) =>
    [...authQueryKeys.all, 'current', userId] as const,
};
