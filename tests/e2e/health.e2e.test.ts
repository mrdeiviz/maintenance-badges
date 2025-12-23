import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const cacheService = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  ping: vi.fn().mockResolvedValue(true),
  getMetrics: vi.fn().mockReturnValue({ hits: 1, misses: 0, total: 1, hitRate: '100.00%' }),
  close: vi.fn().mockResolvedValue(undefined),
};

const fundingDataService = {
  getFundingData: vi.fn(),
  getSupportedPlatforms: vi.fn().mockReturnValue(['github']),
};

vi.mock('../../src/services/cache.service.js', () => ({
  createCacheService: () => cacheService,
  getCacheService: () => cacheService,
}));

vi.mock('../../src/services/funding-data.service.js', () => ({
  createFundingDataService: () => fundingDataService,
  getFundingDataService: () => fundingDataService,
}));

vi.mock('../../src/services/token-storage.service.js', () => ({
  TokenStorageService: class {
    async saveUserToken() {}
    async getUserToken() {
      return 'test-token';
    }
    async deleteUserToken() {}
    async hasToken() {
      return true;
    }
  },
}));

vi.mock('../../src/providers/github-sponsors.provider.js', () => ({
  GitHubSponsorsProvider: class {
    async getRateLimitInfo() {
      return {
        remaining: 4999,
        limit: 5000,
        reset: new Date('2024-01-01T00:00:00.000Z'),
      };
    }
  },
}));

describe('Health routes (e2e)', () => {
  let server: Awaited<ReturnType<typeof import('../../src/core/server.js').createServer>>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_OAUTH_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_OAUTH_CLIENT_SECRET = 'test-client-secret';
    process.env.GITHUB_OAUTH_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
    process.env.ENCRYPTION_SECRET = 'test-encryption-secret-32-characters';
    process.env.SESSION_SECRET = 'test-session-secret-32-characters';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.ALLOWED_ORIGINS = '*';

    const { loadConfig } = await import('../../src/core/config.js');
    loadConfig();

    const { createServer } = await import('../../src/core/server.js');
    server = await createServer();
    await server.ready();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  it('reports healthy services', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.status).toBe('ok');
    expect(payload.services.redis.connected).toBe(true);
    expect(payload.services.github.accessible).toBe(true);
    expect(payload.platforms).toEqual(['github']);
  });

  it('responds to ping', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/ping',
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.pong).toBe(true);
  });
});
