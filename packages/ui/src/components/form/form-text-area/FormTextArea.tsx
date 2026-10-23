import { useId } from 'react';
import type { CSSProperties } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType } from '../FormBase.type';
import { hasErrorContent, resolveErrorContent } from '../formControl';

const LINE_HEIGHT_REM = 1.25;
const DEFAULT_ROWS = 5;
const DEFAULT_MIN_ROWS = 5;
const DEFAULT_MAX_ROWS = 10;

type TextareaStyle = CSSProperties & {
  '--form-textarea-line-height': string;
  '--form-textarea-min-height': string;
  '--form-textarea-max-height': string;
};

export type FormTextAreaProps = BaseFormType & {
  placeholder?: string;
  rows?: number;
  minRows?: number;
  maxRows?: number;
};

export const FormTextArea = ({
  name,
  label,
  defaultValue = '',
  fullWidth = true,
  rows = DEFAULT_ROWS,
  minRows = DEFAULT_MIN_ROWS,
  maxRows = DEFAULT_MAX_ROWS,
  placeholder,
  disabled,
  required,
  className,
  error: errorProp,
  errorId: errorIdProp,
}: FormTextAreaProps) => {
  const { control } = useFormContext();
  const generatedId = useId();
  const textareaId = `form-textarea-${name}-${generatedId}`;
  const errorId = errorIdProp ?? `${textareaId}-error`;

  const style: TextareaStyle = {
    '--form-textarea-line-height': `${LINE_HEIGHT_REM}rem`,
    '--form-textarea-min-height': `calc(var(--form-textarea-line-height) * ${minRows})`,
    '--form-textarea-max-height': `calc(var(--form-textarea-line-height) * ${maxRows})`,
  };

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
              htmlFor={textareaId}
              className="mb-2 block text-sm font-medium"
            >
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </label>
            <textarea
              {...field}
              id={textareaId}
              value={field.value ?? ''}
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              aria-invalid={isInvalid ? true : undefined}
              aria-describedby={isInvalid ? errorId : undefined}
              data-testid={`form-textarea-${name}`}
              style={style}
              className={cn(
                'border-border bg-background focus:border-primary text-text w-full rounded-input border px-3 py-2 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                'max-h-(--form-textarea-max-height) min-h-(--form-textarea-min-height)',
              )}
            />
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
