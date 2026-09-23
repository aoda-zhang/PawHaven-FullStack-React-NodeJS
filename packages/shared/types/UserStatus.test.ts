import { describe, expect, it } from 'vitest';

import { AuthUserSchema, SessionSchema, UserSchema } from './Auth.schema.js';
import { userStatus, UserStatusSchema } from './UserStatus.js';

const baseUser = {
  userId: 'user-1',
  email: 'reporter@example.com',
};

describe('userStatus', () => {
  it('exposes only pending and active', () => {
    expect(userStatus).toEqual({ pending: 'pending', active: 'active' });
  });

  it('declares values the schema accepts', () => {
    Object.values(userStatus).forEach((value) => {
      expect(UserStatusSchema.safeParse(value).success).toBe(true);
    });
  });
});

describe('UserStatusSchema', () => {
  it('accepts pending', () => {
    expect(UserStatusSchema.parse('pending')).toBe('pending');
  });

  it('accepts active', () => {
    expect(UserStatusSchema.parse('active')).toBe('active');
  });

  it('rejects an unknown status', () => {
    expect(UserStatusSchema.safeParse('banned').success).toBe(false);
  });

  it('rejects an empty status', () => {
    expect(UserStatusSchema.safeParse('').success).toBe(false);
  });

  it('rejects a missing status', () => {
    expect(UserStatusSchema.safeParse(undefined).success).toBe(false);
  });
});

describe('UserSchema', () => {
  it('accepts a user with status pending', () => {
    expect(UserSchema.parse({ ...baseUser, status: 'pending' })).toMatchObject({
      userId: 'user-1',
      status: 'pending',
    });
  });

  it('accepts a user with status active', () => {
    expect(UserSchema.parse({ ...baseUser, status: 'active' })).toMatchObject({
      status: 'active',
    });
  });

  it('rejects a user without a status', () => {
    const result = UserSchema.safeParse(baseUser);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['status']);
  });

  it('rejects a user with an unknown status', () => {
    const result = UserSchema.safeParse({ ...baseUser, status: 'banned' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['status']);
  });
});

describe('AuthUserSchema', () => {
  it('keeps status required', () => {
    const result = AuthUserSchema.safeParse(baseUser);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['status']);
  });

  it('accepts an auth user carrying a status', () => {
    expect(
      AuthUserSchema.parse({ ...baseUser, status: 'pending' }),
    ).toMatchObject({ status: 'pending' });
  });
});

describe('SessionSchema', () => {
  it('rejects a session whose user has no status', () => {
    const result = SessionSchema.safeParse({ user: baseUser, expires_in: 300 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['user', 'status']);
  });

  it('accepts a session whose user carries a status', () => {
    const session = SessionSchema.parse({
      user: { ...baseUser, status: 'pending' },
      expires_in: 300,
    });

    expect(session.user.status).toBe('pending');
  });
});
