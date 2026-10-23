import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import PhoneInputWithCountry, { type Country } from 'react-phone-number-input';

import { cn } from '../../utils/cn';

export { isValidPhoneNumber } from 'react-phone-number-input';

interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

const StyledInput = ({ className, ref, ...props }: StyledInputProps) => (
  <input
    ref={ref}
    className={cn(
      'border-border bg-background text-foreground placeholder:text-text-secondary focus:border-primary focus:ring-primary/30 w-full rounded-input border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none',
      className,
    )}
    {...props}
  />
);

export interface PhoneInputProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  id?: string;
  error?: ReactNode;
  errorId?: string;
  required?: boolean;
  disabled?: boolean;
  defaultCountry?: Country;
}

export const PhoneInput = ({
  phone,
  onPhoneChange,
  id,
  error,
  errorId,
  required,
  disabled,
  defaultCountry = 'CN',
}: PhoneInputProps) => {
  const generatedId = useId();
  const resolvedErrorId = errorId ?? `phone-input-error-${generatedId}`;
  const isInvalid = error !== undefined;

  return (
    <>
      <PhoneInputWithCountry
        international
        defaultCountry={defaultCountry}
        value={phone}
        onChange={(value) => onPhoneChange(value ?? '')}
        inputComponent={StyledInput}
        numberInputProps={{
          id,
          required,
          'aria-invalid': isInvalid ? true : undefined,
          'aria-describedby': isInvalid ? resolvedErrorId : undefined,
        }}
        focusInputOnCountrySelection={false}
        disabled={disabled}
      />
      {isInvalid && (
        <p id={resolvedErrorId} className="text-error mt-1 text-xs">
          {error}
        </p>
      )}
    </>
  );
};
