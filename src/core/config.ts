import { z } from "zod";

const ConfigSchema = z.object({
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  port: z.coerce.number().positive().default(3000),
  host: z.string().default("0.0.0.0"),
  logLevel: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  github: z.object({
    token: z.string().min(1, "GitHub token is required"), // Keep for backwards compatibility
    apiTimeout: z.coerce.number().positive().default(10000),
    oauth: z.object({
      clientId: z.string().min(1, "GitHub OAuth Client ID is required"),
      clientSecret: z.string().min(1, "GitHub OAuth Client Secret is required"),
      callbackUrl: z.string().url("Callback URL must be valid"),
    }),
  }),

  database: z.object({
    url: z.string().min(1, "Database URL is required"),
  }),

  encryption: z.object({
    secretKey: z
      .string()
      .min(32, "Encryption secret must be at least 32 characters"),
  }),

  session: z.object({
    secret: z.string().min(32, "Session secret must be at least 32 characters"),
    cookieDomain: z.string().optional(),
  }),

  redis: z.object({
    url: z.string().url("Redis URL must be valid"),
    password: z.string().optional(),
  }),

  cache: z.object({
    defaultTTL: z.coerce.number().positive().default(300), // 5 minutes
    maxTTL: z.coerce.number().positive().default(3600), // 1 hour
  }),

  rateLimit: z.object({
    max: z.coerce.number().positive().default(100),
    window: z.coerce.number().positive().default(60000), // 1 minute
  }),

  sentry: z
    .object({
      dsn: z.string().optional(),
      environment: z.string().default("development"),
    })
    .optional(),

  cors: z.object({
    allowedOrigins: z.string().default("*"),
  }),

  publicBaseUrl: z.string().url("Public base URL must be valid").optional(),
  badgeExampleUsername: z
    .string()
    .min(1, "Badge example username must be valid")
    .optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

let configInstance: Config | null = null;

export function loadConfig(): Config {
  if (configInstance) {
    return configInstance;
  }

  const config = ConfigSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    host: process.env.HOST,
    logLevel: process.env.LOG_LEVEL,

    github: {
      token: process.env.GITHUB_TOKEN,
      apiTimeout: process.env.GITHUB_API_TIMEOUT,
      oauth: {
        clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
        clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        callbackUrl: process.env.GITHUB_OAUTH_CALLBACK_URL,
      },
    },

    database: {
      url: process.env.DATABASE_URL,
    },

    encryption: {
      secretKey: process.env.ENCRYPTION_SECRET,
    },

    session: {
      secret: process.env.SESSION_SECRET,
      cookieDomain: process.env.SESSION_COOKIE_DOMAIN,
    },

    redis: {
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
    },

    cache: {
      defaultTTL: process.env.CACHE_DEFAULT_TTL,
      maxTTL: process.env.CACHE_MAX_TTL,
    },

    rateLimit: {
      max: process.env.RATE_LIMIT_MAX,
      window: process.env.RATE_LIMIT_WINDOW,
    },

    sentry: process.env.SENTRY_DSN
      ? {
          dsn: process.env.SENTRY_DSN,
          environment: process.env.SENTRY_ENVIRONMENT,
        }
      : undefined,

    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS,
    },

    publicBaseUrl: process.env.PUBLIC_BASE_URL,
    badgeExampleUsername: process.env.BADGE_EXAMPLE_USERNAME,
  });

  if (!config.success) {
    console.error("❌ Invalid configuration:");
    console.error(JSON.stringify(config.error.format(), null, 2));
    process.exit(1);
  }

  configInstance = config.data;
  return config.data;
}

export function getConfig(): Config {
  if (!configInstance) {
    throw new Error("Configuration not loaded. Call loadConfig() first.");
  }
  return configInstance;
}
