import bcrypt from 'bcryptjs';

/** Production cost factor. Tests pass a lower one to stay fast. */
export const DEFAULT_BCRYPT_COST = 12;

export class PasswordHasher {
  /** Computed eagerly (off the event loop) so the first unknown-email login is not slower than later ones. */
  private readonly dummyHash: Promise<string>;

  constructor(private readonly cost: number = DEFAULT_BCRYPT_COST) {
    this.dummyHash = bcrypt.hash('timing-equaliser', cost);
  }

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.cost);
  }

  /**
   * Compares against `hash`, or against a dummy hash of equal cost when the account does not
   * exist, so response time does not reveal whether an email is registered.
   */
  async verify(password: string, hash: string | undefined): Promise<boolean> {
    const target = hash ?? (await this.dummyHash);
    const matches = await bcrypt.compare(password, target);
    return hash !== undefined && matches;
  }
}
