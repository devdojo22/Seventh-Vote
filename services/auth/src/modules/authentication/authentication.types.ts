import type { z } from 'zod';
import type { loginSchema, mfaCodeSchema, registerSchema } from './authentication.validation.js';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;
