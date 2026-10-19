import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType, BaseSelectType } from '../FormBase.type';

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
  required,
  className,
}: FormSelectProps) => {
  const { control } = useFormContext();
  const generatedId = useId();
  const selectId = `form-select-${name}-${generatedId}`;
  const errorId = `${selectId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => (
        <div
          className={cn('baseFormContainer', className, fullWidth && 'w-full')}
        >
          {label && (
            <label htmlFor={selectId} className="mb-2 block text-sm font-medium">
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}
          <div className="relative">
            <select
              {...field}
              id={selectId}
              disabled={disabled}
              required={required}
              value={field.value ?? ''}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => {
                const matched = options?.find(
                  (item) => String(item.value) === event.target.value,
                );
                field.onChange(matched ? matched.value : event.target.value);
              }}
              className="border-border bg-background focus:border-primary text-text w-full appearance-none rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placeholder && <option value="">{placeholder}</option>}
              {options?.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="text-text-secondary pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            />
          </div>
          {error && (
            <p id={errorId} role="alert" className="text-error mt-1 text-xs">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
};
