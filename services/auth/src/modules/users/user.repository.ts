import type { Membership, PrismaClient, User } from '@prisma/client';

export type UserWithMemberships = User & { memberships: Membership[] };

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIdWithMemberships(id: string): Promise<UserWithMemberships | null>;
  markEmailVerified(id: string, at: Date): Promise<void>;
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

  async markEmailVerified(id: string, at: Date): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id, emailVerifiedAt: null },
      data: { emailVerifiedAt: at },
    });
  }
}
