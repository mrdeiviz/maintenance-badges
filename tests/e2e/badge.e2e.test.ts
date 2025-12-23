import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const cacheService = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  ping: vi.fn().mockResolvedValue(true),
  getMetrics: vi.fn().mockReturnValue({ hits: 0, misses: 0, total: 0, hitRate: '0.00%' }),
  close: vi.fn().mockResolvedValue(undefined),
};

const fundingService = {
  getFundingData: vi.fn().mockResolvedValue({
    platform: 'github',
    username: 'sindresorhus',
    currentAmount: 2500,
    currency: 'USD',
    isRecurring: true,
    breakdown: { sponsors: 42 },
    lastUpdated: new Date(),
  }),
  getSupportedPlatforms: vi.fn().mockReturnValue(['github']),
};

vi.mock('../../src/services/cache.service.ts', () => ({
  createCacheService: () => cacheService,
  getCacheService: () => cacheService,
}));

vi.mock('../../src/services/funding-data.service.ts', () => ({
  createFundingDataService: () => fundingService,
  getFundingDataService: () => fundingService,
}));

describe('Badge routes (e2e)', () => {
  let server: Awaited<ReturnType<typeof import('../../src/core/server.ts').createServer>>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.ALLOWED_ORIGINS = '*';

    const { loadConfig } = await import('../../src/core/config.ts');
    loadConfig();

    const { createServer } = await import('../../src/core/server.ts');
    server = await createServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('returns an SVG badge with default label', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/badge/github/sindresorhus/5000',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('image/svg+xml');
    expect(response.body).toContain('<svg');
    expect(response.body).toContain('Maintenance Fund');
  });

  it('returns a progress style badge with a track', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/badge/github/sindresorhus/5000?style=progress',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('opacity="0.7"');
  });
});
