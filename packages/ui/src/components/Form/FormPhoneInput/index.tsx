import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import { PhoneInput } from '../../PhoneInput';
import type { BaseFormType } from '../formBase.type';

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
            <div className="mb-2 text-sm font-medium">
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </div>
          )}
          <PhoneInput
            phone={field.value ?? ''}
            hasError={Boolean(error)}
            onPhoneChange={field.onChange}
          />
          {error && <p className="text-error mt-1 text-xs">{error.message}</p>}
        </div>
      )}
    />
  );
};
