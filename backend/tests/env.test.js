const { envSchema } = require('../src/config/env');

describe('Environment Variable Validation', () => {
  it('validates proper environment configurations successfully', () => {
    const validConfig = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
      JWT_SECRET: 'a_long_secure_secret_key_that_exceeds_32_characters_orderwise',
      PORT: '4000',
      NODE_ENV: 'test',
    };
    const result = envSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(4000);
      expect(result.data.NODE_ENV).toBe('test');
    }
  });

  it('fails fast when required DATABASE_URL is missing', () => {
    const invalidConfig = {
      JWT_SECRET: 'a_long_secure_secret_key_that_exceeds_32_characters_orderwise',
    };
    const result = envSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      const dbIssue = result.error.issues.find((i) => i.path.includes('DATABASE_URL'));
      expect(dbIssue).toBeDefined();
    }
  });

  it('fails fast when JWT_SECRET is too short', () => {
    const invalidConfig = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
      JWT_SECRET: 'short',
    };
    const result = envSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      const secretIssue = result.error.issues.find((i) => i.path.includes('JWT_SECRET'));
      expect(secretIssue).toBeDefined();
    }
  });
});
