import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';

/**
 * Combines CSS class names conditionally using clsx.
 * Accepts strings, objects, arrays, and other ClassValue types.
 *
 * @param inputs - Class values to combine (strings, objects, arrays, etc.)
 * @returns A single string of merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
