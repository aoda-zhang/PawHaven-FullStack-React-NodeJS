import type { IncomingHttpHeaders } from 'http';

/**
 * Reads a single value from incoming HTTP headers.
 * Node lowercases all incoming header names, so the key is normalized to
 * lowercase; array values are collapsed to their first entry.
 *
 * @param headers - The incoming HTTP headers
 * @param key - The header name (case-insensitive)
 * @returns The header value, or undefined when absent
 */
export const readHeader = (
  headers: IncomingHttpHeaders,
  key: string,
): string | undefined => {
  const value = headers[key.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};
