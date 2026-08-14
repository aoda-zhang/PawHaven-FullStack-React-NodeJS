import { ChevronDown } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType, BaseSelectType } from '../formBase.type';

export type FormSelectProps = BaseFormType &
  BaseSelectType & {
    placeholder?: string;
    disabled?: boolean;
  };

export const FormSelect = ({
  name,
  label,
  options,
  defaultValue = '',
  fullWidth = true,
  placeholder,
  disabled,
  className,
}: FormSelectProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => (
        <div
          className={cn('baseFormContainer', className, fullWidth && 'w-full')}
        >
          {label && <div className="mb-2 text-sm font-medium">{label}</div>}
          <div className="relative">
            <select
              {...field}
              disabled={disabled}
              value={field.value ?? ''}
              aria-invalid={!!error}
              className="border-border bg-background focus:border-primary text-text w-full appearance-none rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placeholder && <option value="">{placeholder}</option>}
              {options?.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="text-text-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          </div>
          {error && <p className="text-error mt-1 text-xs">{error.message}</p>}
        </div>
      )}
    />
  );
};
