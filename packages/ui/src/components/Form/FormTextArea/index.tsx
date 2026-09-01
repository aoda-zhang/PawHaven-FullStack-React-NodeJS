import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../formBase.type';

export type FormTextAreaProps = BaseFormType & {
  placeholder?: string;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
};

export const FormTextArea = ({
  name,
  label,
  defaultValue = '',
  fullWidth = true,
  rows = 5,
  minRows = 5,
  maxRows = 10,
  placeholder,
  disabled,
  required,
  className,
}: FormTextAreaProps) => {
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
          <textarea
            {...field}
            value={field.value ?? ''}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!error}
            className="border-border bg-background focus:border-primary text-text w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight: minRows * 20, maxHeight: maxRows * 20 }}
          />
          {error && <p className="text-error mt-1 text-xs">{error.message}</p>}
        </div>
      )}
    />
  );
};
