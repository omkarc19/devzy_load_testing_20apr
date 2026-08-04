import { z } from 'zod';

/**
 * Environment schema for the Orders API. Parsing happens once at startup so a
 * misconfigured deployment fails fast instead of throwing deep inside a request.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  API_KEY: z.string().min(1, 'API_KEY must not be empty'),
  DEFAULT_CURRENCY: z
    .string()
    .length(3, 'DEFAULT_CURRENCY must be a 3-letter ISO 4217 code')
    .default('USD'),
  MAX_ORDER_ITEMS: z.coerce.number().int().positive().max(500).default(50),
  SHIPPING_PARTNER_BASE_URL: z.string().url().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

/**
 * Returns the validated application config, parsing `process.env` on first call.
 * Subsequent calls return the cached value.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (cached) {
    return cached;
  }

  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}

/** Resets the cached config. Intended for tests only. */
export function resetConfigForTests(): void {
  cached = null;
}
