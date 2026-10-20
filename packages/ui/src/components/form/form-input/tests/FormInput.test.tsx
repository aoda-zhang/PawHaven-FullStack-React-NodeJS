// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { FormInput } from '../FormInput';

const Harness = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: {} });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
};

describe('FormInput', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(
      <Harness>
        <FormInput name="name" label="Name" />
      </Harness>,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('disables the control', () => {
    render(
      <Harness>
        <FormInput name="name" label="Name" disabled />
      </Harness>,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
  });

  it('maps the sm and md sizes', () => {
    render(
      <Harness>
        <FormInput name="name" label="Name" size="sm" />
      </Harness>,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveClass('h-9');

    render(
      <Harness>
        <FormInput name="other" label="Other" size="md" />
      </Harness>,
    );
    expect(screen.getByRole('textbox', { name: 'Other' })).toHaveClass('h-10');
  });

  it('maps the standard, outline and fill variants', () => {
    render(
      <Harness>
        <FormInput name="name" label="Name" variant="standard" />
      </Harness>,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveClass(
      'border-b',
      'bg-transparent',
    );

    render(
      <Harness>
        <FormInput name="other" label="Other" variant="outline" />
      </Harness>,
    );
    expect(screen.getByRole('textbox', { name: 'Other' })).toHaveClass(
      'border-border',
      'bg-background',
    );

    render(
      <Harness>
        <FormInput name="last" label="Last" variant="fill" />
      </Harness>,
    );
    expect(screen.getByRole('textbox', { name: 'Last' })).toHaveClass(
      'bg-background-subtle',
      'border-transparent',
    );
  });
});
