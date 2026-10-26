import { Skeleton } from '@pawhaven/ui';

export const RescueDetailSkeleton = () => (
  <div
    className="mx-auto max-w-3xl py-6"
    aria-hidden="true"
    data-testid="rescue-detail-skeleton"
  >
    <Skeleton className="rounded-skeleton mb-4 h-5 w-36" />

    <div className="border-border bg-card rounded-card-large overflow-hidden border shadow-sm">
      <Skeleton className="h-72 w-full rounded-none" />
      <div className="space-y-4 p-5 sm:p-6">
        <Skeleton className="rounded-skeleton h-4 w-28" />
        <Skeleton className="rounded-skeleton h-8 w-2/3" />
        <Skeleton className="rounded-skeleton h-4 w-48" />
        <Skeleton className="rounded-media h-20 w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="rounded-media h-20" />
          ))}
        </div>
      </div>
    </div>

    <Skeleton className="rounded-card-large mt-6 h-40 w-full" />
    <Skeleton className="rounded-card-large mt-4 h-48 w-full" />
    <Skeleton className="rounded-card-large mt-4 h-64 w-full" />
  </div>
);
