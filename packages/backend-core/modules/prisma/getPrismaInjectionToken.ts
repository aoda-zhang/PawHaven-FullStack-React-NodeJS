/**
 * Symbol used as the base for Prisma client injection tokens.
 */
export const PRISMA_CLIENT = Symbol('PRISMA_CLIENT');

/**
 * Generates a unique NestJS injection token for a named Prisma client instance.
 * Used for dependency injection when multiple Prisma clients are registered.
 *
 * @param name - The name of the Prisma client instance
 * @returns A unique injection token string
 */
export const getPrismaInjectionToken = (name: string) =>
  `${PRISMA_CLIENT.toString()}:${name}`;
