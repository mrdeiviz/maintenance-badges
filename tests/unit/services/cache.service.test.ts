import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../../../src/services/cache.service';

// Mock Redis
const { mockRedis, mockLogger, mockConfig } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    ping: vi.fn(),
    quit: vi.fn(),
    on: vi.fn(),
  },
  mockLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  mockConfig: {
    cache: {
      defaultTTL: 300,
    },
    redis: {
      url: 'redis://localhost:6379',
      password: undefined,
    },
  },
}));

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => mockRedis),
}));

vi.mock('../../../src/core/config.js', () => ({
  getConfig: () => mockConfig,
}));

vi.mock('../../../src/core/logger.js', () => ({
  getLogger: () => mockLogger,
}));

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CacheService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const testData = { name: 'test', value: 123 };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await service.get<typeof testData>('test-key');

      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('non-existent-key');
    });

    it('should increment cache hits on successful get', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'test' }));

      await service.get('test-key');

      const metrics = service.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
    });

    it('should increment cache misses on null value', async () => {
      mockRedis.get.mockResolvedValue(null);

      await service.get('test-key');

      const metrics = service.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(1);
    });

    it('should handle JSON parse errors and return null', async () => {
      mockRedis.get.mockResolvedValue('invalid-json{');

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle Redis errors and return null', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error), key: 'test-key' },
        'Cache get failed'
      );
    });

    it('should handle different data types', async () => {
      const testCases = [
        { input: 'string', expected: 'string' },
        { input: 123, expected: 123 },
        { input: true, expected: true },
        { input: { nested: { object: true } }, expected: { nested: { object: true } } },
        { input: [1, 2, 3], expected: [1, 2, 3] },
      ];

      for (const testCase of testCases) {
        mockRedis.get.mockResolvedValue(JSON.stringify(testCase.input));
        const result = await service.get('test-key');
        expect(result).toEqual(testCase.expected);
      }
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const testData = { name: 'test', value: 123 };
      mockRedis.setex.mockResolvedValue('OK');

      await service.set('test-key', testData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        300, // default TTL
        JSON.stringify(testData)
      );
    });

    it('should set value with custom TTL', async () => {
      const testData = { name: 'test', value: 123 };
      mockRedis.setex.mockResolvedValue('OK');

      await service.set('test-key', testData, 600);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        600, // custom TTL
        JSON.stringify(testData)
      );
    });

    it('should handle different data types', async () => {
      const testCases = [
        'string',
        123,
        true,
        { nested: { object: true } },
        [1, 2, 3],
        null,
      ];

      for (const testCase of testCases) {
        mockRedis.setex.mockResolvedValue('OK');
        await service.set('test-key', testCase);
        expect(mockRedis.setex).toHaveBeenCalledWith(
          'test-key',
          300,
          JSON.stringify(testCase)
        );
      }
    });

    it('should handle Redis errors silently and log', async () => {
      const testData = { name: 'test' };
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await service.set('test-key', testData);

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error), key: 'test-key' },
        'Cache set failed'
      );
    });

    it('should handle JSON stringify errors', async () => {
      const circularRef: any = {};
      circularRef.self = circularRef;

      await service.set('test-key', circularRef);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.del('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle Redis errors silently and log', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await service.del('test-key');

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: expect.any(Error), key: 'test-key' },
        'Cache delete failed'
      );
    });
  });

  describe('ping', () => {
    it('should return true when Redis responds with PONG', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await service.ping();

      expect(result).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should return false when Redis ping fails', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await service.ping();

      expect(result).toBe(false);
    });

    it('should return false when Redis responds with unexpected value', async () => {
      mockRedis.ping.mockResolvedValue('UNEXPECTED');

      const result = await service.ping();

      expect(result).toBe(false);
    });
  });

  describe('getMetrics', () => {
    it('should return initial metrics with zero values', () => {
      const metrics = service.getMetrics();

      expect(metrics).toEqual({
        hits: 0,
        misses: 0,
        total: 0,
        hitRate: '0.00%',
      });
    });

    it('should calculate metrics correctly after cache operations', async () => {
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify({ data: 'test' })) // hit
        .mockResolvedValueOnce(null) // miss
        .mockResolvedValueOnce(JSON.stringify({ data: 'test2' })) // hit
        .mockResolvedValueOnce(null); // miss

      await service.get('key1');
      await service.get('key2');
      await service.get('key3');
      await service.get('key4');

      const metrics = service.getMetrics();

      expect(metrics).toEqual({
        hits: 2,
        misses: 2,
        total: 4,
        hitRate: '50.00%',
      });
    });

    it('should calculate 100% hit rate', async () => {
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify({ data: 'test' }))
        .mockResolvedValueOnce(JSON.stringify({ data: 'test2' }))
        .mockResolvedValueOnce(JSON.stringify({ data: 'test3' }));

      await service.get('key1');
      await service.get('key2');
      await service.get('key3');

      const metrics = service.getMetrics();

      expect(metrics.hitRate).toBe('100.00%');
    });

    it('should calculate 0% hit rate', async () => {
      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await service.get('key1');
      await service.get('key2');
      await service.get('key3');

      const metrics = service.getMetrics();

      expect(metrics.hitRate).toBe('0.00%');
    });

    it('should format hit rate with two decimal places', async () => {
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify({ data: 'test' })) // hit
        .mockResolvedValueOnce(null) // miss
        .mockResolvedValueOnce(null); // miss

      await service.get('key1');
      await service.get('key2');
      await service.get('key3');

      const metrics = service.getMetrics();

      expect(metrics.hitRate).toBe('33.33%');
    });
  });

  describe('close', () => {
    it('should quit Redis connection', async () => {
      mockRedis.quit.mockResolvedValue('OK');

      await service.close();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
