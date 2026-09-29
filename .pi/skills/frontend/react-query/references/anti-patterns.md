# react-query — Anti-Pattern Catalogue

Every fix in this file is stated once, in `SKILL.md`. This catalogue is the
diagnosis: what the symptom looks like, why it breaks, and which section of the body
holds the rule. Check a diff against it before reporting a data-fetching change
done.

| Anti-pattern                                             | Why it breaks                                                            | Rule |
| -------------------------------------------------------- | ------------------------------------------------------------------------ | ---- |
| Raw string query keys                                    | No type safety; scattered magic strings                                  | §2.1 |
| Storing query data in Redux                              | Duplicates the cache; serves data that has gone stale                    | §1.1 |
| `useQuery` in a parent, prop-drilled to deep children    | Re-fetch cascades; pointless prop drilling                               | §1.1 |
| Calling `refetch()` after a mutation                     | One query, one moment; the rest of the cache stays stale                 | §4.1 |
| No optimistic update for a UX-critical mutation          | A spinner for every action; the UI lags the user                         | §4.2 |
| `staleTime: 0` globally                                  | Excessive refetching; flickering UI                                      | §2.3 |
| Not handling loading, error, and empty states            | Blank screen on failure; a broken page on empty                          | §3.3 |
| `isLoading` used as the Suspense key                     | Breaks transitions; the view flickers                                    | §3.2 |
| `refetchOnWindowFocus` disabled for every query          | A tab left open never notices changed data                               | §2.3 |
| A mutation that never invalidates                        | Every cache entry keeps serving the pre-write value                      | §4.1 |
| Deriving a value inside `queryFn`                        | A second consumer of the same key reads the derived type, not the entity | §3.2 |
| `useQuery` in `mutations.ts`                             | GET hooks belong in `queries.ts`; two files, one concern                 | §7   |
| A hook duplicated across `queries.ts` and `mutations.ts` | Two copies, independent invalidation                                     | §7   |
| An empty `queries.ts` / `mutations.ts` (`export {}`)     | A dead file that reads as complete                                       | §7   |
| A page importing `mockData` directly                     | Fabricated data is indistinguishable from real data in production        | §7   |
