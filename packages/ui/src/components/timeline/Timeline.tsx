import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn';

/**
 * Vertical timeline container. Lays out its `TimelineItem` children in a
 * single column. Mirrors the shadcn/ui timeline compound-component pattern.
 */
export const Timeline = ({
  className,
  ...props
}: HTMLAttributes<HTMLOListElement>) => (
  <ol className={cn('flex flex-col', className)} {...props} />
);

/** A single entry in the timeline. */
export const TimelineItem = ({
  className,
  ...props
}: HTMLAttributes<HTMLLIElement>) => (
  <li
    className={cn('relative flex gap-4 pb-6 last:pb-0', className)}
    {...props}
  />
);

/**
 * Column that stacks the dot and the connecting line. When `position` is
 * `alternate` the connector is rendered on both sides via the item layout.
 */
export const TimelineSeparator = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('relative flex flex-col items-center', className)}
    {...props}
  />
);

type TimelineDotProps = HTMLAttributes<HTMLSpanElement> & {
  /** Swap in a custom icon node (defaults to a filled dot). */
  icon?: ReactNode;
  /** Visual emphasis for the most recent / active entry. */
  variant?: 'default' | 'primary';
};

export const TimelineDot = ({
  className,
  icon,
  variant = 'default',
  ...props
}: TimelineDotProps) => (
  <span
    className={cn(
      'z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2',
      variant === 'primary'
        ? 'border-primary bg-primary text-primary-fg'
        : 'border-border bg-card text-text-secondary',
      className,
    )}
    aria-hidden="true"
    {...props}
  >
    {icon}
  </span>
);

/** Vertical line connecting consecutive dots. */
export const TimelineConnector = ({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'bg-border absolute top-8 h-[calc(100%-1rem)] w-0.5',
      className,
    )}
    {...props}
  />
);

/**
 * The main body of an entry (status, description, author, photo, etc.).
 * Rendered to the right of the separator by default.
 */
export const TimelineContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 pt-1', className)} {...props} />
);
