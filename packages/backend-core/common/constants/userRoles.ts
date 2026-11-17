export const userRoles = {
  volunteer: 'volunteer',
  admin: 'admin',
} as const;

export type UserRole = (typeof userRoles)[keyof typeof userRoles];
