import type { z } from 'zod';
import type { loginSchema } from './authentication.validation.js';

export type LoginInput = z.infer<typeof loginSchema>;
