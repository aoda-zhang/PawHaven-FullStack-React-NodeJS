import type { ReactNode } from 'react';

export interface BaseFormType {
  name: string;
  label: string;
  defaultValue?: string | number;
  fullWidth?: boolean;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: ReactNode;
  errorId?: string;
}

export interface BaseSelectType {
  options: Array<{ label: string; value: string | number }>;
}

export interface BaseTextFieldType {
  showPasswordToggle?: boolean;
}
