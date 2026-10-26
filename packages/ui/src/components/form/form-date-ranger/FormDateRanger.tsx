import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../FormBase.type';
import { hasErrorContent, resolveErrorContent } from '../formControl';

type DateRangeValue = [string | null, string | null] | null;

export type FormDateRangerProps = BaseFormType;

export const FormDateRanger = ({
  name,
  label,
  defaultValue,
  fullWidth = true,
  required,
  disabled,
  className,
  error: errorProp,
  errorId: errorIdProp,
}: FormDateRangerProps) => {
  const { control } = useFormContext();
  const generatedId = useId();
  const baseId = `form-date-range-${name}-${generatedId}`;
  const startId = `${baseId}-start`;
  const endId = `${baseId}-end`;
  const errorId = errorIdProp ?? `${baseId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => {
        const raw: unknown = field.value;
        const value: DateRangeValue = Array.isArray(raw)
          ? ([raw[0] ?? null, raw[1] ?? null] as DateRangeValue)
          : null;
        const update = (index: 0 | 1, next: string) => {
          const current = value ?? [null, null];
          field.onChange(index === 0 ? [next, current[1]] : [current[0], next]);
        };
        const errorContent = resolveErrorContent(errorProp, error);
        const isInvalid = Boolean(error) || hasErrorContent(errorProp);

        return (
          <fieldset
            className={cn(
              'baseFormContainer',
              className,
              fullWidth && 'w-full',
            )}
            aria-describedby={isInvalid ? errorId : undefined}
          >
            <legend className="mb-2 text-sm font-medium">
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </legend>
            <div className="flex items-center gap-2">
              <label htmlFor={startId} className="sr-only">
                {`${label} start`}
              </label>
              <input
                id={startId}
                type="date"
                value={value?.[0] ?? ''}
                ref={field.ref}
                onChange={(event) => update(0, event.target.value)}
                onBlur={field.onBlur}
                disabled={disabled}
                aria-invalid={isInvalid ? true : undefined}
                className="border-border bg-background focus:border-primary text-text rounded-input-large w-full border px-3 py-2 text-sm transition-colors focus:outline-none"
              />
              <span className="text-text-secondary" aria-hidden="true">
                –
              </span>
              <label htmlFor={endId} className="sr-only">
                {`${label} end`}
              </label>
              <input
                id={endId}
                type="date"
                value={value?.[1] ?? ''}
                onChange={(event) => update(1, event.target.value)}
                onBlur={field.onBlur}
                disabled={disabled}
                aria-invalid={isInvalid ? true : undefined}
                className="border-border bg-background focus:border-primary text-text rounded-input-large w-full border px-3 py-2 text-sm transition-colors focus:outline-none"
              />
            </div>
            {isInvalid && (
              <p id={errorId} className="text-error mt-1 text-xs">
                {errorContent}
              </p>
            )}
          </fieldset>
        );
      }}
    />
  );
};
