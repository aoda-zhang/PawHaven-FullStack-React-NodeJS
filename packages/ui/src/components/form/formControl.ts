import type { ReactNode } from 'react';

export type FormControlSize = 'sm' | 'md';

export type FormControlVariant = 'standard' | 'outline' | 'fill';

export const FORM_CONTROL_SIZE_CLASSES: Record<FormControlSize, string> = {
  sm: 'h-control-sm px-control-x-sm text-sm',
  md: 'h-control px-control-x text-sm',
};

export const FORM_CONTROL_VARIANT_CLASSES: Record<FormControlVariant, string> =
  {
    standard: 'border-b border-border rounded-none bg-transparent',
    outline:
      'border-border bg-background border rounded-input-large focus:border-primary',
    fill: 'bg-background-subtle border-transparent rounded-input-large focus:bg-background',
  };

export const hasErrorContent = (error: ReactNode | undefined): boolean =>
  error !== undefined && error !== null && error !== false && error !== '';

export const resolveErrorContent = (
  error: ReactNode | undefined,
  fieldError?: { message?: string },
): ReactNode | undefined => {
  if (error !== undefined) return error;
  if (!fieldError) return undefined;
  return fieldError.message ?? '';
};
