import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(16),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(14),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  WALLET_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  WALLET_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  DATABASE_URL: z.string().min(1),
});

export const env = envSchema.parse(process.env);
