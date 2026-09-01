import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../formBase.type';

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

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('baseFormContainer', className)}>
          {label && (
            <p className="mb-2 text-sm font-medium">
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {options.map((option) => (
              <label
                key={option.value}
                htmlFor={`${name}-${option.value}`}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  id={`${name}-${option.value}`}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={field.value === option.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  className="accent-primary size-4"
                />
                {option.label}
              </label>
            ))}
          </div>
          {fieldState.error && (
            <p className="formErrorMessage text-error mt-1 text-xs">
              {fieldState.error.message?.toString()}
            </p>
          )}
        </div>
      )}
    />
  );
};
