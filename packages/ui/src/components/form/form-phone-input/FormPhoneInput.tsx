import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import { PhoneInput } from '../../phone-input/PhoneInput';
import type { BaseFormType } from '../FormBase.type';

export type FormPhoneInputProps = BaseFormType;

export const FormPhoneInput = ({
  name,
  label,
  defaultValue = '',
  fullWidth = true,
  required,
  className,
}: FormPhoneInputProps) => {
  const { control } = useFormContext();
  const generatedId = useId();
  const inputId = `form-phone-${name}-${generatedId}`;
  const errorId = `${inputId}-error`;

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
            <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}
          <div data-testid={`form-phone-${name}`}>
            <PhoneInput
              id={inputId}
              errorId={errorId}
              phone={field.value ?? ''}
              hasError={Boolean(error)}
              required={required}
              onPhoneChange={field.onChange}
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
