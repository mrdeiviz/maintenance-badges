import type { FastifyPluginAsync } from 'fastify';
import { getCacheService } from '../services/cache.service.js';
import { GitHubSponsorsProvider } from '../providers/github-sponsors.provider.js';
import { getFundingDataService } from '../services/funding-data.service.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  const cacheService = getCacheService();
  const fundingService = getFundingDataService();

  fastify.get('/health', async (_request, reply) => {
    const isRedisHealthy = await checkRedisHealth();
    const githubHealth = await checkGitHubHealth();

    const healthy = isRedisHealthy && githubHealth.accessible;

    return reply.code(healthy ? 200 : 503).send({
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: {
          connected: isRedisHealthy,
        },
        github: {
          accessible: githubHealth.accessible,
          rateLimit: githubHealth.rateLimit,
        },
      },
      cache: cacheService.getMetrics(),
      platforms: fundingService.getSupportedPlatforms(),
    });
  });

  fastify.get('/ping', async (_request, reply) => {
    return reply.send({ pong: true, timestamp: Date.now() });
  });

  async function checkRedisHealth(): Promise<boolean> {
    try {
      return await cacheService.ping();
    } catch {
      return false;
    }
  }

  async function checkGitHubHealth(): Promise<{
    accessible: boolean;
    rateLimit?: {
      remaining: number;
      limit: number;
      reset: string;
    };
  }> {
    try {
      const provider = new GitHubSponsorsProvider();
      const rateLimitInfo = await provider.getRateLimitInfo();

      return {
        accessible: true,
        rateLimit: {
          remaining: rateLimitInfo.remaining,
          limit: rateLimitInfo.limit,
          reset: rateLimitInfo.reset.toISOString(),
        },
      };
    } catch {
      return {
        accessible: false,
      };
    }
  }
};
