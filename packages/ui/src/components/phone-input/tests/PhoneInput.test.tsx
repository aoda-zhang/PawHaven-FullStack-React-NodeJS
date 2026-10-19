// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PhoneInput } from '../PhoneInput';

describe('PhoneInput', () => {
  it('renders a phone textbox and country selector', () => {
    render(<PhoneInput phone="" hasError={false} onPhoneChange={vi.fn()} id="phone" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'phone');
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
  it('connects invalid state to the supplied error id', () => {
    render(<PhoneInput phone="" hasError onPhoneChange={vi.fn()} id="phone" errorId="phone-error" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'phone-error');
  });
});
