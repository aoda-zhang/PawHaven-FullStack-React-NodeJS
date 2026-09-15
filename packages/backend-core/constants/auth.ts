export const cookieKeys = {
  access_token: 'access_token',
  refresh_token: 'refresh_token',
} as const;

export const authRouteSuffixes = {
  login: '/auth/login',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  register: '/auth/register',
} as const;
