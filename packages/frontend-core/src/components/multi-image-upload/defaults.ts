export interface PreviewItem {
  id: number;
  file: File;
  url: string;
}

export const DEFAULT_MAX = 5;
export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
export const DEFAULT_MAX_SIZE_MB = 5;
export const DEFAULT_MAX_SIZE_BYTES = DEFAULT_MAX_SIZE_MB * BYTES_PER_MB;
export const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
export const DEFAULT_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png';
export const EMPTY_FILES: File[] = [];
