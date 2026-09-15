export const decodePem = (value: string): string =>
  value.includes('-----BEGIN')
    ? value
    : Buffer.from(value, 'base64').toString('utf8');
