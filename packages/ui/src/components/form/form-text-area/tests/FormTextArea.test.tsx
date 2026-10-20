// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { FormTextArea } from '../FormTextArea';

const Harness = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: {} });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
};

describe('FormTextArea', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(
      <Harness>
        <FormTextArea name="description" label="Description" />
      </Harness>,
    );
    expect(
      screen.getByRole('textbox', { name: 'Description' }),
    ).toBeInTheDocument();
  });
});
