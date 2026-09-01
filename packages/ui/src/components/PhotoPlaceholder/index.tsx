import { PawPrint } from 'lucide-react';

import { cn } from '../../utils/cn';

export interface PhotoPlaceholderProps {
  className?: string;
  iconClassName?: string;
}

/**
 * Shown when an item has no photo. Never substitute a decorative hero image —
 * that presents an unrelated picture as if it were the subject's own.
 */
export const PhotoPlaceholder = ({
  className,
  iconClassName,
}: PhotoPlaceholderProps) => (
  <div
    className={cn(
      'bg-muted text-text-secondary flex h-full w-full items-center justify-center',
      className,
    )}
    aria-hidden="true"
  >
    <PawPrint className={cn('h-10 w-10', iconClassName)} />
  </div>
);
