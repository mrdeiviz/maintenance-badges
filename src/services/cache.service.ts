import Redis from 'ioredis';
import { getConfig } from '../core/config.js';
import { getLogger } from '../core/logger.js';

export class CacheService {
  private redis: Redis;
  private logger = getLogger();
  private defaultTTL: number;
  private metrics = {
    hits: 0,
    misses: 0,
  };

  constructor() {
    const config = getConfig();
    this.defaultTTL = config.cache.defaultTTL;

    this.redis = new Redis(config.redis.url, {
      password: config.redis.password,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('connect', () => {
      this.logger.info('Redis connected');
    });

    this.redis.on('error', (error) => {
      this.logger.error({ error }, 'Redis connection error');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);

      if (value === null) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error({ error, key }, 'Cache get failed');
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const expiresIn = ttl ?? this.defaultTTL;

      await this.redis.setex(key, expiresIn, serialized);
    } catch (error) {
      this.logger.error({ error, key }, 'Cache set failed');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error({ error, key }, 'Cache delete failed');
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      total,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

let cacheServiceInstance: CacheService | null = null;

export function createCacheService(): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService();
  }
  return cacheServiceInstance;
}

export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    throw new Error('Cache service not initialized. Call createCacheService() first.');
  }
  return cacheServiceInstance;
}
