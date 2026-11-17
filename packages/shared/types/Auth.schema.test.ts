import { describe, expect, it } from 'vitest';

import { CredentialsSchema, PasswordSchema } from './Auth.schema.js';

const issuesOf = (value: string) => {
  const result = PasswordSchema.safeParse(value);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

const invalidPasswords = [
  '',
  'Aa1-a',
  'Aa1-aaaaa',
  'aa1-aa',
  'AA1-AA',
  'Aa-aaaa',
  'Aa1aaaa',
  'Aa1!aa',
  'Aa1 aa',
  '密码密码密码',
  'Aa1-😀a',
];

describe('PasswordSchema', () => {
  it('accepts compliant passwords using each allowed special character', () => {
    expect(PasswordSchema.safeParse('Aa1-aa').success).toBe(true);
    expect(PasswordSchema.safeParse('Aa1+aa').success).toBe(true);
    expect(PasswordSchema.safeParse('Aa1_aa').success).toBe(true);
    expect(PasswordSchema.safeParse('Aa1-aaaa').success).toBe(true);
  });

  it.each(invalidPasswords)('rejects %j with one complete message', (value) => {
    expect(issuesOf(value)).toEqual(['validation.password.invalid']);
  });

  it.each([undefined, 123])(
    'rejects non-string %j with one complete message',
    (value) => {
      const result = PasswordSchema.safeParse(value);

      expect(result.success).toBe(false);
      expect(result.error?.issues.map((issue) => issue.message)).toEqual([
        'validation.password.invalid',
      ]);
    },
  );
});

describe('CredentialsSchema', () => {
  it('attaches the password issue to the password path', () => {
    const result = CredentialsSchema.safeParse({
      email: 'valid@example.com',
      password: 'weak',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'validation.password.invalid',
    );
    expect(
      result.error?.issues.every((issue) => issue.path[0] === 'password'),
    ).toBe(true);
  });
});
