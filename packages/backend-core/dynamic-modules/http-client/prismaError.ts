export interface MappedPrismaError {
  status: number;
  message: string;
}

const PRISMA_KNOWN_CODE = /^P\d{4}$/;

// Safe, enumerated messages only — never forward Prisma's raw error text
// (query plans, connection strings, field names). Map a small, client-meaningful
// subset of Prisma error codes; everything else falls back to a generic 500.
const PRISMA_STATUS: Record<string, MappedPrismaError> = {
  P2002: { status: 409, message: 'Resource already exists' },
  P2003: { status: 409, message: 'Related resource constraint failed' },
  P2025: { status: 404, message: 'Resource not found' },
};

export function mapPrismaError(exception: unknown): MappedPrismaError | null {
  if (!exception || typeof exception !== 'object') {
    return null;
  }

  const candidate = exception as Record<string, unknown>;
  const code = typeof candidate.code === 'string' ? candidate.code : '';

  if (PRISMA_KNOWN_CODE.test(code)) {
    return (
      PRISMA_STATUS[code] ?? { status: 500, message: 'Internal server error' }
    );
  }

  if (typeof candidate.clientVersion === 'string') {
    return { status: 500, message: 'Internal server error' };
  }

  return null;
}
