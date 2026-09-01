import { Request } from 'express';

import { httpHeaders } from '../constants/httpHeaders';

/**
 * Extracts the authentication token from an HTTP request.
 * Checks the custom access token header first, then falls back to Authorization Bearer token.
 *
 * @param request - The Express request object
 * @returns The extracted token string, or undefined if no valid token is found
 */
export const getTokenFromHeader = (request: Request) => {
  if (request?.headers?.[httpHeaders.accessToken]) {
    return request?.headers?.[httpHeaders.accessToken];
  }
  const [type, token] =
    request?.headers?.[httpHeaders.authorization]?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
};
