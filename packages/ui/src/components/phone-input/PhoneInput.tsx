import 'react-phone-number-input/style.css';
import type { InputHTMLAttributes, Ref } from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';

import { cn } from '../../utils/cn';

export { isValidPhoneNumber } from 'react-phone-number-input';

interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

const StyledInput = ({ className, ref, ...props }: StyledInputProps) => (
  <input
    ref={ref}
    className={cn(
      'border-border bg-background text-foreground placeholder:text-text-secondary focus:border-primary focus:ring-primary/30 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none',
      className,
    )}
    {...props}
  />
);

interface PhoneInputProps {
  phone: string;
  hasError: boolean;
  onPhoneChange: (phone: string) => void;
  id?: string;
  errorId?: string;
}

export const PhoneInput = ({
  phone,
  hasError,
  onPhoneChange,
  id,
  errorId,
}: PhoneInputProps) => {
  return (
    <PhoneInputWithCountry
      international
      defaultCountry="CN"
      value={phone}
      onChange={(value) => onPhoneChange(value ?? '')}
      inputComponent={StyledInput}
      numberInputProps={{
        id,
        'aria-invalid': hasError,
        'aria-describedby': hasError ? errorId : undefined,
      }}
      focusInputOnCountrySelection={false}
    />
  );
};
