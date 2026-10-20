import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../FormBase.type';
import { hasErrorContent, resolveErrorContent } from '../formControl';

export type FormCheckboxProps = Omit<BaseFormType, 'defaultValue'> & {
  defaultValue?: boolean;
};

export const FormCheckbox = ({
  name,
  label,
  defaultValue = false,
  fullWidth = true,
  disabled,
  required,
  className,
  error: errorProp,
  errorId: errorIdProp,
}: FormCheckboxProps) => {
  const { control } = useFormContext();
  const generatedId = useId();
  const inputId = `form-checkbox-${name}-${generatedId}`;
  const errorId = errorIdProp ?? `${inputId}-error`;

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
              htmlFor={inputId}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                id={inputId}
                type="checkbox"
                name={field.name}
                ref={field.ref}
                checked={!!field.value}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                disabled={disabled}
                required={required}
                aria-invalid={isInvalid ? true : undefined}
                aria-describedby={isInvalid ? errorId : undefined}
                data-testid={`form-checkbox-${name}`}
                className="border-border bg-background accent-primary size-4 rounded"
              />
              <span>{label}</span>
            </label>
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
