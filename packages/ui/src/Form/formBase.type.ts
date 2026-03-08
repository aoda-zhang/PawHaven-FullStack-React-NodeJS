export interface BaseFormType {
  name: string;
  label?: string;
  defaultValue?: string | number;
  type?: string;
  fullWidth?: boolean;
  className?: string | string[];
  required?: boolean;
}

export interface BaseSelectType {
  options: Array<{ label: string; value: string | number }>;
}

export interface BaseTextFieldType {
  prefix?: string;
  defaultPrefix?: boolean;
  owPasswordToggle?: boolean;
  suffix?: string;
  showPasswordToggle?: boolean;
  defaultSuffix?: boolean;
}
