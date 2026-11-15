import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      h: [{ h: ['control'] }],
      w: [{ w: ['control'] }],
      px: [{ px: ['control-x'] }],
      size: [{ size: ['control'] }],
    },
  },
});

/**
 * Merges Tailwind CSS class names with proper conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 *
 * @param inputs - Class values to merge (strings, objects, arrays, etc.)
 * @returns A single string of merged class names with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
