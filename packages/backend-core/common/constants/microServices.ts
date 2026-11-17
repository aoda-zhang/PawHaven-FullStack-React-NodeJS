export const microServiceNames = {
  GATEWAY: 'gateway',
  CORE: 'core-service',
  DOCUMENT: 'document-service',
  AUTH: 'auth-service',
} as const;

export type MicroServiceNameType =
  (typeof microServiceNames)[keyof typeof microServiceNames];
