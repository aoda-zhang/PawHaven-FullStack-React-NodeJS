import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '../../../utils/cn';
import type { BaseFormType, BaseTextFieldType } from '../formBase.type';

export type FormInputProps = BaseFormType &
  BaseTextFieldType & {
    type?: string;
    placeholder?: string;
    autoComplete?: string;
    size?: 'small' | 'medium';
    variant?: 'standard' | 'outlined' | 'filled';
    disabled?: boolean;
    maxLength?: number;
  };

const sizeClasses: Record<NonNullable<FormInputProps['size']>, string> = {
  small: 'h-9 px-3 text-sm',
  medium: 'h-10 px-4 text-sm',
};

const variantClasses: Record<NonNullable<FormInputProps['variant']>, string> = {
  outlined: 'border-border bg-background border focus:border-primary',
  filled: 'bg-background-muted border-transparent focus:bg-background',
  standard: 'border-b border-border rounded-none bg-transparent',
};

export const FormInput = ({
  name,
  label,
  defaultValue = '',
  type = 'text',
  fullWidth = true,
  showPasswordToggle = true,
  size = 'medium',
  variant = 'outlined',
  required,
  className,
  placeholder,
  autoComplete,
  disabled,
  maxLength,
}: FormInputProps) => {
  const { control } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === 'password';
  const shouldShowToggle = isPasswordType && showPasswordToggle;
  const inputType = shouldShowToggle && showPassword ? 'text' : type;

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
          <div className="relative">
            <input
              {...field}
              type={inputType}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              maxLength={maxLength}
              required={required}
              aria-invalid={!!error}
              className={cn(
                'border-border bg-background focus:border-primary w-full rounded-md border text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                sizeClasses[size],
                variantClasses[variant],
                error && 'border-error focus:border-error',
                shouldShowToggle && 'pr-10',
              )}
            />
            {shouldShowToggle && (
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((s) => !s)}
                className="text-text-secondary hover:text-text absolute top-1/2 right-3 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            )}
          </div>
          {error && <p className="text-error mt-1 text-xs">{error.message}</p>}
        </div>
      )}
    />
  );
};
