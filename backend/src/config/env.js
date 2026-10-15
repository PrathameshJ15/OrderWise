const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const INSECURE_JWT_SECRETS = [
  'secret',
  'password',
  'changeme',
  'replace_with_long_random_string_min_64_chars',
  '12345678901234567890123456789012',
  'jwtsecret',
  'admin',
  'testsecret',
];

function validateJwtSecretStrength(secret, nodeEnv = process.env.NODE_ENV || 'development') {
  if (!secret || typeof secret !== 'string') {
    throw new Error('JWT_SECRET is required');
  }

  if (secret.length < 32) {
    throw new Error(`JWT_SECRET must be at least 32 characters long for cryptographic security (found ${secret.length} characters)`);
  }

  const lower = secret.toLowerCase();
  const isKnownInsecure = INSECURE_JWT_SECRETS.some((bad) => lower === bad || lower.startsWith(bad));

  if (nodeEnv === 'production') {
    if (secret.length < 64) {
      throw new Error(`FATAL: Production JWT_SECRET must be at least 64 characters long per AGENTS.md (found ${secret.length} characters)`);
    }
    if (isKnownInsecure) {
      throw new Error('FATAL: Insecure or default placeholder JWT_SECRET detected in production environment!');
    }
  } else if (isKnownInsecure) {
    console.warn('⚠️  SECURITY WARNING: JWT_SECRET appears to be a default or placeholder value. Ensure a high-entropy secret is configured for production.');
  }

  return true;
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  GROQ_API_KEY: z.string().default('mock_or_pending_groq_key'),
  GROQ_MODEL: z.string().default('llama3-70b-8192'),
  PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, 'PORT must be a valid port number'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ FATAL: Environment variable validation failed:');
  parsed.error.issues.forEach((issue) => {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  });
  throw new Error(`Environment validation error: ${parsed.error.message}`);
}

const env = parsed.data;

// Validate secret strength at startup
validateJwtSecretStrength(env.JWT_SECRET, env.NODE_ENV);

module.exports = { env, envSchema, validateJwtSecretStrength };
