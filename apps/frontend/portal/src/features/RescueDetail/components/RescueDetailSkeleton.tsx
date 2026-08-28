import { Skeleton } from '@pawhaven/ui';

export const RescueDetailSkeleton = () => (
  <div
    className="mx-auto max-w-3xl px-4 py-6"
    aria-hidden="true"
    data-testid="rescue-detail-skeleton"
  >
    <Skeleton className="mb-4 h-5 w-36 rounded-md" />

    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
      <Skeleton className="h-72 w-full rounded-none" />
      <div className="space-y-4 p-5 sm:p-6">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-8 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>

    <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
    <Skeleton className="mt-4 h-48 w-full rounded-2xl" />
    <Skeleton className="mt-4 h-64 w-full rounded-2xl" />
  </div>
);
