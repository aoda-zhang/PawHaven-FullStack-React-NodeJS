# component — Splitting a Component

The thresholds, the reasoning behind each, and a worked decomposition of a page
component that grew past one job. The rules this file applies live in `SKILL.md` §1
and §3; this is where the cut gets chosen.

## Contents

| Section                                                                           | What it answers                                    |
| --------------------------------------------------------------------------------- | -------------------------------------------------- |
| [Split thresholds](#split-thresholds)                                             | Whether to split at all, and on what signal        |
| [Worked decomposition](#worked-decomposition)                                     | What the split looks like on a real page component |
| [Feature orchestrator vs pure component](#feature-orchestrator-vs-pure-component) | Which kind of component is left at the top         |

---

## Split thresholds

Split when **any** of these is true. Each one is a symptom of a component holding
more than one reason to change.

| Signal                                              | Why it means split                                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Lines > 150**                                     | Past this, a diff usually touches unrelated parts of the file at once                                                 |
| **Multiple levels of abstraction**                  | Low-level DOM manipulation and high-level business logic in one body have different readers and different test setups |
| **Repeated JSX patterns** — same structure 3+ times | Three copies drift; one component with a slot does not                                                                |
| **Testability** — a piece cannot be tested alone    | If it needs the whole tree to render, the boundary is in the wrong place                                              |
| **Multiple `useState` + `useEffect` clusters**      | That is a custom hook wearing a component costume; the states are independent                                         |

Under 150 lines with a single responsibility, splitting further costs a file and an
import to no benefit.

---

## Worked decomposition

Before — one monolithic component, where the fetching, the three states, and four
unrelated regions are all in one body:

```tsx
function RescueDetail({ rescueId }: { rescueId: string }) {
  // Fetching (40 lines)
  // Loading state (10 lines)
  // Error state (10 lines)
  // Image gallery (50 lines)
  // Rescue info (60 lines)
  // Timeline (40 lines)
  // CTA buttons (30 lines)
  return (/* massive JSX */);
}
```

After — the orchestrator holds the state and the ordering, and each region is a
component with one job:

```tsx
// RescueDetail/index.tsx — orchestrator only
export function RescueDetail({ rescueId }: { rescueId: string }) {
  const { data, isLoading, error } = useRescueQuery(rescueId);

  if (isLoading) return <RescueDetailSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data) return <EmptyState message={t('rescue.notFound')} />;

  return (
    <div className="rescue-detail">
      <RescueImageGallery images={data.images} />
      <RescueInfoSection rescue={data} />
      <RescueTimeline events={data.timeline} />
      <RescueActions rescue={data} />
    </div>
  );
}
```

Note the orchestrator above pulls data via a hook: that is a _feature_ component, not
a pure one. Pure components in `@pawhaven/ui` receive `data`, `isLoading`, and
`error` as props instead of fetching for themselves, and the loading/empty/error
branches live in the feature that owns the query.

---

## Feature orchestrator vs pure component

|                  | Feature component                       | Pure component (`@pawhaven/ui`)                    |
| ---------------- | --------------------------------------- | -------------------------------------------------- |
| Data             | Fetches, or reads a `react-query` hook  | Receives it as a prop                              |
| States           | Owns loading, empty, and error branches | Receives them as props, or the caller renders them |
| Domain knowledge | Knows about rescues, reports, adoption  | Knows about `variant="compact"`, not rescues       |
| Text             | Resolves i18n keys                      | Receives text as a prop or children                |
| Lives in         | `features/{Feature}/components/`        | `packages/ui/src/components/<Name>/`               |

The orchestrator is the component that composes; the pure components are the ones it
composes out of. If a region needs none of the left column, it is a candidate to
graduate (`SKILL.md` §2).
