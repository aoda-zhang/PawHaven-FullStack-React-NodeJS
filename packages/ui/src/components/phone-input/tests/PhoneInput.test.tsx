// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PhoneInput } from '../PhoneInput';

describe('PhoneInput', () => {
  it('renders a phone textbox and country selector', () => {
    render(<PhoneInput phone="" onPhoneChange={vi.fn()} id="phone" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'phone');
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
  it('connects invalid state to the supplied error id', () => {
    render(
      <PhoneInput
        phone=""
        error="Phone number is invalid"
        onPhoneChange={vi.fn()}
        id="phone"
        errorId="phone-error"
      />,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'phone-error',
    );
  });
  it('announces an error without an explicit error id', () => {
    render(
      <PhoneInput
        phone=""
        error="Phone number is invalid"
        onPhoneChange={vi.fn()}
        id="phone"
      />,
    );

    const describedBy = screen
      .getByRole('textbox')
      .getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    if (!describedBy) throw new Error('expected an aria-describedby reference');

    const errorElement = document.getElementById(describedBy);
    expect(errorElement).not.toBeNull();
    expect(errorElement).toHaveTextContent('Phone number is invalid');
    expect(errorElement).not.toHaveAttribute('role', 'alert');
  });
  it('honours a default country override', () => {
    render(
      <PhoneInput
        phone=""
        onPhoneChange={vi.fn()}
        id="phone"
        defaultCountry="US"
      />,
    );

    const countrySelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(countrySelect.value).toBe('US');
  });
  it('disables the number input', () => {
    render(<PhoneInput phone="" onPhoneChange={vi.fn()} id="phone" disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
