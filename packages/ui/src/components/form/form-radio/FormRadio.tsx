import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../FormBase.type';

interface Option {
  value: string;
  label: string;
}

export type FormRadioProps = BaseFormType & {
  options: Option[];
};

export const FormRadio = ({
  name,
  label,
  options,
  required,
  className,
}: FormRadioProps) => {
  const { control } = useFormContext();
  const generatedId = useId();
  const errorId = `form-radio-${name}-${generatedId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <fieldset
          className={cn('baseFormContainer', className)}
          aria-describedby={error ? errorId : undefined}
        >
          {label && (
            <legend className="mb-2 text-sm font-medium">
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </legend>
          )}
          <div className="flex flex-col gap-2">
            {options.map((option) => {
              const optionId = `form-radio-${name}-${generatedId}-${option.value}`;

              return (
                <label
                  key={option.value}
                  htmlFor={optionId}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    id={optionId}
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={field.value === option.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    onBlur={field.onBlur}
                    required={required}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className="accent-primary size-4"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
          {error && (
            <p id={errorId} role="alert" className="text-error mt-1 text-xs">
              {error.message}
            </p>
          )}
        </fieldset>
      )}
    />
  );
};
