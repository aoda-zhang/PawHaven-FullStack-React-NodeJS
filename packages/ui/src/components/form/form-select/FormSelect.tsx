import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType, BaseSelectType } from '../FormBase.type';
import { hasErrorContent, resolveErrorContent } from '../formControl';

export type FormSelectProps = BaseFormType &
  BaseSelectType & {
    placeholder?: string;
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
  error: errorProp,
  errorId: errorIdProp,
}: FormSelectProps) => {
  const { control } = useFormContext();
  const generatedId = useId();
  const selectId = `form-select-${name}-${generatedId}`;
  const errorId = errorIdProp ?? `${selectId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => {
        const errorContent = resolveErrorContent(errorProp, error);
        const isInvalid = Boolean(error) || hasErrorContent(errorProp);

        return (
          <div
            className={cn(
              'baseFormContainer',
              className,
              fullWidth && 'w-full',
            )}
          >
            <label
              htmlFor={selectId}
              className="mb-2 block text-sm font-medium"
            >
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </label>
            <div className="relative">
              <select
                {...field}
                id={selectId}
                disabled={disabled}
                required={required}
                value={field.value ?? ''}
                aria-invalid={isInvalid ? true : undefined}
                aria-describedby={isInvalid ? errorId : undefined}
                onChange={(event) => {
                  const matched = options?.find(
                    (item) => String(item.value) === event.target.value,
                  );
                  field.onChange(matched ? matched.value : event.target.value);
                }}
                className="border-border bg-background focus:border-primary text-text rounded-input-large w-full appearance-none border px-3 py-2 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
            {isInvalid && (
              <p id={errorId} className="text-error mt-1 text-xs">
                {errorContent}
              </p>
            )}
          </div>
        );
      }}
    />
  );
};
