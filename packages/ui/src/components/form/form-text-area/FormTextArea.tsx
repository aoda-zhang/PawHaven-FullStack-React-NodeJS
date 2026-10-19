import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../FormBase.type';

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
  const generatedId = useId();
  const textareaId = `form-textarea-${name}-${generatedId}`;
  const errorId = `${textareaId}-error`;

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
            <label htmlFor={textareaId} className="mb-2 block text-sm font-medium">
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}
          <textarea
            {...field}
            id={textareaId}
            value={field.value ?? ''}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="border-border bg-background focus:border-primary text-text w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight: minRows * 20, maxHeight: maxRows * 20 }}
          />
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
