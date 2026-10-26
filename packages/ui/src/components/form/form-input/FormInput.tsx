import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType, BaseTextFieldType } from '../FormBase.type';
import {
  FORM_CONTROL_SIZE_CLASSES,
  FORM_CONTROL_VARIANT_CLASSES,
  hasErrorContent,
  resolveErrorContent,
  type FormControlSize,
  type FormControlVariant,
} from '../formControl';

export type FormInputProps = BaseFormType &
  BaseTextFieldType & {
    type?: string;
    placeholder?: string;
    autoComplete?: string;
    size?: FormControlSize;
    variant?: FormControlVariant;
    maxLength?: number;
  };

export const FormInput = ({
  name,
  label,
  defaultValue = '',
  type = 'text',
  fullWidth = true,
  showPasswordToggle = true,
  size = 'md',
  variant = 'outline',
  required,
  disabled,
  className,
  placeholder,
  autoComplete,
  maxLength,
  error: errorProp,
  errorId: errorIdProp,
}: FormInputProps) => {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = `form-input-${name}-${generatedId}`;
  const errorId = errorIdProp ?? `${inputId}-error`;

  const isPasswordType = type === 'password';
  const shouldShowToggle = isPasswordType && showPasswordToggle;
  const inputType = shouldShowToggle && showPassword ? 'text' : type;
  const sizeClasses = FORM_CONTROL_SIZE_CLASSES[size];
  const variantClasses = FORM_CONTROL_VARIANT_CLASSES[variant];

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
            <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
              {label}
              {required && (
                <span className="text-error ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </label>
            <div className="relative">
              <input
                {...field}
                id={inputId}
                type={inputType}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                maxLength={maxLength}
                required={required}
                aria-invalid={isInvalid ? true : undefined}
                aria-describedby={isInvalid ? errorId : undefined}
                data-testid={`form-input-${name}`}
                className={cn(
                  'border-border bg-background focus:border-primary rounded-input-large w-full border text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  sizeClasses,
                  variantClasses,
                  isInvalid && 'border-error focus:border-error',
                  shouldShowToggle && 'pr-10',
                )}
              />
              {shouldShowToggle && (
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-controls={inputId}
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-text-secondary hover:text-text absolute top-1/2 right-3 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
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
