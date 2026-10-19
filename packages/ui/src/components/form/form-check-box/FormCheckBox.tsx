import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../FormBase.type';

export type FormCheckboxProps = Omit<BaseFormType, 'defaultValue'> & {
  defaultValue?: boolean;
  disabled?: boolean;
  className?: string;
};

export const FormCheckbox = ({
  name,
  label,
  defaultValue = false,
  disabled,
  required,
  className,
}: FormCheckboxProps) => {
  const { control } = useFormContext();
  const generatedId = useId();
  const inputId = `form-checkbox-${name}-${generatedId}`;
  const errorId = `${inputId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => (
        <div className={cn('baseFormContainer', className)}>
          <label
            htmlFor={inputId}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <input
              id={inputId}
              type="checkbox"
              name={field.name}
              checked={!!field.value}
              onChange={(event) => field.onChange(event.target.checked)}
              onBlur={field.onBlur}
              disabled={disabled}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              data-testid={`form-checkbox-${name}`}
              className="border-border bg-background accent-primary size-4 rounded"
            />
            {label && <span>{label}</span>}
          </label>
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
