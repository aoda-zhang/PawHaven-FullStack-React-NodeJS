import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../FormBase.type';
import { hasErrorContent, resolveErrorContent } from '../formControl';

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
  defaultValue = '',
  fullWidth = true,
  required,
  disabled,
  className,
  error: errorProp,
  errorId: errorIdProp,
}: FormRadioProps) => {
  const { control } = useFormContext();
  const generatedId = useId();
  const baseId = `form-radio-${name}-${generatedId}`;
  const errorId = errorIdProp ?? `${baseId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => {
        const errorContent = resolveErrorContent(errorProp, error);
        const isInvalid = Boolean(error) || hasErrorContent(errorProp);
        const selectedIndex = options.findIndex(
          (option) => option.value === field.value,
        );
        const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;

        return (
          <fieldset
            role="radiogroup"
            className={cn(
              'baseFormContainer',
              className,
              fullWidth && 'w-full',
            )}
            aria-invalid={isInvalid ? true : undefined}
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
            <div className="flex flex-col gap-2">
              {options.map((option, index) => {
                const optionId = `${baseId}-${option.value}`;

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
                      ref={index === focusIndex ? field.ref : undefined}
                      checked={field.value === option.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      onBlur={field.onBlur}
                      disabled={disabled}
                      required={required}
                      className="accent-primary size-4"
                    />
                    {option.label}
                  </label>
                );
              })}
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
