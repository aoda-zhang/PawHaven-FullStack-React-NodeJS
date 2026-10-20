import { type HTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div
    role="status"
    aria-label="Loading"
    {...props}
    className={cn('bg-muted animate-pulse', className)}
  />
);
