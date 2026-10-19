import { type HTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div className={cn('bg-muted motion-reduce:animate-none animate-pulse', className)} {...props} />
);
