import type { FieldErrors } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { translateFieldErrors } from './translateFieldErrors';

const translate = (message: string) =>
  message.startsWith('validation.') ? `translated:${message}` : message;

describe('translateFieldErrors', () => {
  it('translates flat field error messages', () => {
    const errors: FieldErrors<{ email: string; password: string }> = {
      email: { type: 'invalid_string', message: 'validation.email.invalid' },
      password: { type: 'minLength', message: 'validation.password.invalid' },
    };

    const result = translateFieldErrors(errors, translate);

    expect(result.email?.message).toBe('translated:validation.email.invalid');
    expect(result.password?.message).toBe(
      'translated:validation.password.invalid',
    );
  });

  it('passes non-key messages through unchanged', () => {
    const errors: FieldErrors<{ email: string }> = {
      email: { type: 'server', message: 'Raw message from the server' },
    };

    const result = translateFieldErrors(errors, translate);

    expect(result.email?.message).toBe('Raw message from the server');
  });

  it('translates nested object errors', () => {
    const errors: FieldErrors<{ address: { street: string } }> = {
      address: {
        street: {
          type: 'required',
          message: 'validation.address.street_required',
        },
      },
    };

    const result = translateFieldErrors(errors, translate);

    expect(result.address?.street?.message).toBe(
      'translated:validation.address.street_required',
    );
  });

  it('translates array path errors', () => {
    const errors: FieldErrors<{ photos: Array<{ name: string }> }> = {
      photos: [
        {
          name: {
            type: 'required',
            message: 'validation.photos.name_required',
          },
        },
      ],
    };

    const result = translateFieldErrors(errors, translate);

    expect(result.photos?.[0]?.name?.message).toBe(
      'translated:validation.photos.name_required',
    );
  });

  it('translates string and array values in types', () => {
    const errors: FieldErrors<{ password: string }> = {
      password: {
        type: 'invalid',
        message: 'validation.password.invalid',
        types: {
          minLength: 'validation.password.invalid',
          invalid: ['validation.password.invalid', 'Raw message'],
        },
      },
    };

    const result = translateFieldErrors(errors, translate);

    expect(result.password?.types).toEqual({
      minLength: 'translated:validation.password.invalid',
      invalid: ['translated:validation.password.invalid', 'Raw message'],
    });
  });

  it('translates root errors', () => {
    const errors: FieldErrors<{ email: string }> = {
      root: { type: 'server', message: 'validation.root.failed' },
    };

    const result = translateFieldErrors(errors, translate);

    expect(result.root?.message).toBe('translated:validation.root.failed');
  });

  it('does not mutate the input errors', () => {
    const errors: FieldErrors<{ address: { street: string } }> = {
      address: {
        street: {
          type: 'required',
          message: 'validation.address.required',
          types: { required: 'validation.address.required' },
        },
      },
    };
    const snapshot = structuredClone(errors);

    translateFieldErrors(errors, translate);

    expect(errors).toEqual(snapshot);
  });
});
