/**
 * The query-cache keys that cross a slice boundary.
 *
 * A key belongs here only when something outside its owner must reach it. A2
 * forbids page-to-page imports, so the home and rescue-cases keys that
 * `report-animal` invalidates cannot live in those pages. The auth prefix is
 * here for the same reason: `app/init/currentUser.ts` owns the query nested
 * under it, while the auth page owns the invalidation that clears it.
 *
 * Every other key stays in its owner's `api/<name>.queryKeys.ts`, which nests
 * its private keys under the base key it imports from here — so each cache
 * string exists exactly once and cannot drift between two declarations.
 *
 * Invalidation is prefix-matched by TanStack Query, so invalidating
 * `sharedQueryKeys.home.all` also refreshes every key nested under it.
 */

export const sharedQueryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: (userId: string) =>
      [...sharedQueryKeys.auth.all, 'current', userId] as const,
  },
  home: {
    all: ['home'] as const,
  },
  rescueCases: {
    all: ['rescueCases'] as const,
  },
} as const;
