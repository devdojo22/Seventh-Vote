import { Prisma } from '@prisma/client';

/** P2002: a unique constraint rejected the write, e.g. two concurrent sign-ups with one email. */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
