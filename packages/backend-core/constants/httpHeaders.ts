/**
 * Canonical HTTP header names shared by every backend service.
 * Header names are case-insensitive on the wire; the lowercase form is
 * canonical because Node normalizes incoming headers to lowercase.
 */
export const httpHeaders = {
  traceId: 'x-trace-id',
  authUserId: 'x-auth-user-id',
  authUserEmail: 'x-auth-user-email',
  authVerified: 'x-auth-verified',
  authUserRoles: 'x-auth-user-roles',
  timestamp: 'x-timestamp',
  sign: 'x-sign',
  appSource: 'x-app-source',
  env: 'x-env',
  accessToken: 'access-token',
  locale: 'locale',
  acceptLanguage: 'accept-language',
  contentType: 'content-type',
  authorization: 'authorization',
  cookie: 'cookie',
  setCookie: 'set-cookie',
} as const;
