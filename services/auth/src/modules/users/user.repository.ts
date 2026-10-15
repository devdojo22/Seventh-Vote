import type { Membership, PrismaClient, User, Workspace } from '@prisma/client';
import { isUniqueConstraintViolation } from '../../shared/errors/prisma-errors.js';

export type UserWithMemberships = User & { memberships: Membership[] };
export type UserWithWorkspaces = User & { memberships: (Membership & { workspace: Workspace })[] };

export interface NewUser {
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** Memberships ordered oldest first; the first one is the default workspace at sign-in. */
  findByIdWithMemberships(id: string): Promise<UserWithMemberships | null>;
  findByIdWithWorkspaces(id: string): Promise<UserWithWorkspaces | null>;
  /** Returns null when the email is already registered, including a concurrent sign-up. */
  create(user: NewUser): Promise<User | null>;
  setMfaSecret(id: string, encryptedSecret: string): Promise<void>;
  enableMfa(id: string): Promise<void>;
  /**
   * Atomically records `step` as the last accepted TOTP time step.
   * Returns false if a code for this step (or a later one) was already accepted, i.e. a replay.
   */
  claimTotpStep(id: string, step: number): Promise<boolean>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdWithMemberships(id: string): Promise<UserWithMemberships | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { memberships: { orderBy: { createdAt: 'asc' } } },
    });
  }

  findByIdWithWorkspaces(id: string): Promise<UserWithWorkspaces | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { memberships: { include: { workspace: true } } },
    });
  }

  async create(user: NewUser): Promise<User | null> {
    try {
      return await this.prisma.user.create({ data: user });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) return null;
      throw error;
    }
  }

  async setMfaSecret(id: string, encryptedSecret: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { mfaSecret: encryptedSecret } });
  }

  async enableMfa(id: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { mfaEnabled: true } });
  }

  async claimTotpStep(id: string, step: number): Promise<boolean> {
    // A single conditional UPDATE: two concurrent requests with the same code cannot both match.
    const { count } = await this.prisma.user.updateMany({
      where: { id, OR: [{ mfaLastStep: null }, { mfaLastStep: { lt: step } }] },
      data: { mfaLastStep: step },
    });
    return count === 1;
  }
}
