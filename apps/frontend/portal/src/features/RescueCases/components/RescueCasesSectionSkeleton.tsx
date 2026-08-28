import { Skeleton } from '@pawhaven/ui';

const DEFAULT_SKELETON_COUNT = 4;

interface RescueCasesSectionSkeletonProps {
  count?: number;
}

export const RescueCasesSectionSkeleton = ({
  count = DEFAULT_SKELETON_COUNT,
}: RescueCasesSectionSkeletonProps) => (
  <div
    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2"
    aria-hidden="true"
    data-testid="rescue-cases-skeleton"
  >
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm"
      >
        <div className="relative h-48">
          <Skeleton className="h-full w-full rounded-none" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <div className="absolute bottom-3 left-3">
            <Skeleton className="h-5 w-40 rounded-md" />
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
          <div className="border-border flex items-center justify-between border-t pt-3">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
