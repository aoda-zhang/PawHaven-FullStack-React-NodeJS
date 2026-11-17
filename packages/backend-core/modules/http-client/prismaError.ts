import { HTTP_STATUS } from '@pawhaven/shared';

export interface MappedPrismaError {
  status: number;
  message: string;
}

const PRISMA_KNOWN_CODE = /^P\d{4}$/;

const PRISMA_INFRASTRUCTURE: MappedPrismaError = {
  status: HTTP_STATUS.SERVICE_UNAVAILABLE,
  message: 'Service temporarily unavailable',
};

// Safe, enumerated messages only — never forward Prisma's raw error text
// (query plans, connection strings, field names). Client-correctable Prisma
// errors keep their specific status; every other Prisma request failure is
// treated as an infrastructure failure and mapped to 503.
const PRISMA_STATUS: Record<string, MappedPrismaError> = {
  P2002: { status: HTTP_STATUS.CONFLICT, message: 'Resource already exists' },
  P2003: {
    status: HTTP_STATUS.CONFLICT,
    message: 'Related resource constraint failed',
  },
  P2025: { status: HTTP_STATUS.NOT_FOUND, message: 'Resource not found' },
};

const PRISMA_INFRASTRUCTURE_ERROR_NAMES = new Set([
  'PrismaClientInitializationError',
  'PrismaClientUnknownRequestError',
]);

const isPrismaInfrastructureError = (
  candidate: Record<string, unknown>,
): boolean => {
  const name = typeof candidate.name === 'string' ? candidate.name : '';
  return PRISMA_INFRASTRUCTURE_ERROR_NAMES.has(name);
};

export function mapPrismaError(exception: unknown): MappedPrismaError | null {
  if (!exception || typeof exception !== 'object') {
    return null;
  }

  const candidate = exception as Record<string, unknown>;
  const code = typeof candidate.code === 'string' ? candidate.code : '';

  if (PRISMA_KNOWN_CODE.test(code)) {
    return PRISMA_STATUS[code] ?? PRISMA_INFRASTRUCTURE;
  }

  if (isPrismaInfrastructureError(candidate)) {
    return PRISMA_INFRASTRUCTURE;
  }

  if (typeof candidate.clientVersion === 'string') {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  return null;
}
