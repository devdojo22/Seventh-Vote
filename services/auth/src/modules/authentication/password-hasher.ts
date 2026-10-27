import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12;

export class PasswordHasher {
  /** Computed eagerly (off the event loop) so the first unknown-email login is not slower than later ones. */
  private readonly dummyHash = bcrypt.hash('timing-equaliser', BCRYPT_COST);

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
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
