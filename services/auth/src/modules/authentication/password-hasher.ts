import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12;

export class PasswordHasher {
  private readonly dummyHash = bcrypt.hash('timing-equaliser', BCRYPT_COST);

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  async verify(password: string, hash: string | undefined): Promise<boolean> {
    const target = hash ?? (await this.dummyHash);
    const matches = await bcrypt.compare(password, target);
    return hash !== undefined && matches;
  }
}
