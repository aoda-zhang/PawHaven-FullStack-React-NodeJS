import { Skeleton } from '@pawhaven/ui';

const DEFAULT_SKELETON_COUNT = 4;

interface AdoptablePetsSectionSkeletonProps {
  count?: number;
}

export const AdoptablePetsSectionSkeleton = ({
  count = DEFAULT_SKELETON_COUNT,
}: AdoptablePetsSectionSkeletonProps) => (
  <div
    className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2"
    aria-hidden="true"
    data-testid="adoptable-pets-skeleton"
  >
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="bg-background border-border w-64 flex-shrink-0 overflow-hidden rounded-2xl border shadow-sm"
      >
        <Skeleton className="h-44 w-full rounded-none" />
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32 rounded-md" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);
