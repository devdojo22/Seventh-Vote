import { authenticator } from 'otplib';
import QRCode from 'qrcode';

/** RFC 6238 default; authenticator apps assume 30-second steps. */
const TOTP_STEP_SECONDS = 30;

export interface MfaEnrolment {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

/** TOTP generation and checking. Replay protection is enforced by the caller via the returned step. */
export class MfaService {
  constructor(
    private readonly issuer: string,
    private readonly now: () => number = Date.now,
  ) {}

  async createEnrolment(accountName: string): Promise<MfaEnrolment> {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(accountName, this.issuer, secret);
    return { secret, otpauthUrl, qrDataUrl: await QRCode.toDataURL(otpauthUrl) };
  }

  /**
   * Checks a code against the current time step only (no drift window, same as before).
   * Returns the time step the code belongs to, or null if the code is wrong.
   */
  verifyCode(code: string, secret: string): number | null {
    const epoch = this.now();
    const totp = authenticator.clone({ epoch, step: TOTP_STEP_SECONDS, window: 0 });
    if (!totp.check(code, secret)) return null;
    return Math.floor(epoch / 1000 / TOTP_STEP_SECONDS);
  }
}
