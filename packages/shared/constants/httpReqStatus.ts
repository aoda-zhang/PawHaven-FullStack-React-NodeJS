/**
 * HTTP status codes used throughout the application.
 * @readonly
 * @enum {number}
 */
export const HTTP_STATUS = {
  OK: 200,
  // The request has been fulfilled and resulted in a new resource being created.
  CREATED: 201,
  // The request has been accepted for processing, but the processing has not been completed.
  ACCEPTED: 202,
  // The server successfully processed the request, but is not returning any content.
  NO_CONTENT: 204,
  // The request could not be understood by the server due to malformed syntax.
  BAD_REQUEST: 400,
  // The request requires user authentication.
  UNAUTHORIZED: 401,
  // The server understood the request, but refuses to authorize it.
  FORBIDDEN: 403,
  // The requested resource could not be found.
  NOT_FOUND: 404,
  // The user has sent too many requests in a given amount of time ("rate limiting").
  TOO_MANY_REQUESTS: 429,
  // The server encountered an unexpected condition which prevented it from fulfilling the request.
  INTERNAL_SERVER_ERROR: 500,
  // The server is currently unable to handle the request due to temporary overload or maintenance.
  SERVICE_UNAVAILABLE: 503,
  // The request has succeeded.
  // The request could not be completed due to a conflict with the current state of the resource.
  CONFLICT: 409,
  // The request method is not supported by the server for the requested resource.
  METHOD_NOT_ALLOWED: 405,
  BAD_GATEWAY: 502,
  // The server timed out waiting for the request.
  GATEWAY_TIMEOUT: 504,
} as const;
