import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { getConfig } from './config.js';
import { createLogger, getLogger } from './logger.js';
import { badgeRoutes } from '../routes/badge.routes.js';
import { healthRoutes } from '../routes/health.routes.js';
import { debugRoutes } from '../routes/debug.routes.js';
import { authRoutes } from '../routes/auth.routes.js';
import { indexRoutes } from '../routes/index.routes.js';
import { createCacheService } from '../services/cache.service.js';
import { createBadgeGeneratorService } from '../services/badge-generator.service.js';
import { createFundingDataService } from '../services/funding-data.service.js';

export async function createServer() {
  const config = getConfig();
  createLogger();

  // Initialize services
  createCacheService();
  createBadgeGeneratorService();
  createFundingDataService();

  const fastify = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    trustProxy: true,
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
  });

  // Security middleware
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // SVG needs inline styles
    crossOriginEmbedderPolicy: false,
  });

  // CORS
  await fastify.register(cors, {
    origin: config.cors.allowedOrigins === '*' ? '*' : config.cors.allowedOrigins.split(','),
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'], // Added POST for auth routes
    credentials: false,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
    cache: 10000,
    allowList: ['127.0.0.1'],
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  // Routes
  await fastify.register(indexRoutes); // Landing page
  await fastify.register(healthRoutes);
  await fastify.register(badgeRoutes, { prefix: '/badge' });
  await fastify.register(authRoutes); // OAuth authentication routes
  await fastify.register(debugRoutes);

  // Error handler
  fastify.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
    request.log.error({ error }, 'Unhandled error');

    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Internal Server Error' : error.message;

    return reply.code(statusCode).send({
      error: {
        message,
        statusCode,
      },
    });
  });

  return fastify;
}

export async function startServer() {
  const config = getConfig();
  const logger = getLogger();

  try {
    const server = await createServer();

    await server.listen({
      port: config.port,
      host: config.host,
    });

    logger.info(
      {
        port: config.port,
        host: config.host,
        nodeEnv: config.nodeEnv,
      },
      'Server started successfully'
    );

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      await server.close();
      const { getCacheService } = await import('../services/cache.service.js');
      await getCacheService().close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}
