(process.env as Record<string, string>).NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-test-access-secret-123456";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-test-refresh-secret-12345";
process.env.BCRYPT_COST = "8";
process.env.APP_TIMEZONE = "Asia/Jakarta";
process.env.AI_PROVIDER = "local";
