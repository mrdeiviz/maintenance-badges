import type { FastifyPluginAsync } from 'fastify';
import { BadgeParamsSchema, BadgeQuerySchema } from '../schemas/badge.schema.js';
import { z } from 'zod';
import { getBadgeGeneratorService } from '../services/badge-generator.service.js';
import { getFundingDataService } from '../services/funding-data.service.js';
import crypto from 'crypto';

export const badgeRoutes: FastifyPluginAsync = async (fastify) => {
  const badgeService = getBadgeGeneratorService();
  const fundingService = getFundingDataService();

  fastify.get('/sample/:goal', async (request, reply) => {
    const goal = z.coerce.number().positive().max(1_000_000_000).parse(
      (request.params as { goal: string }).goal
    );
    const query = BadgeQuerySchema.parse(request.query);
    const currentAmount = query.current ?? Math.round(goal * 0.68);

    const svg = badgeService.generateFundingBadge({
      current: currentAmount,
      goal,
      style: query.style,
      label: query.label,
      logo: query.logo,
      color: query.color,
    });

    const etag = `"${crypto.createHash('md5').update(svg).digest('hex').slice(0, 27)}"`;

    return reply
      .code(200)
      .header('Content-Type', 'image/svg+xml;charset=utf-8')
      .header('Cache-Control', 'public, max-age=3600, s-maxage=3600')
      .header('ETag', etag)
      .header('X-Content-Type-Options', 'nosniff')
      .send(svg);
  });

  fastify.get('/:platform/:username/:goal', async (request, reply) => {
    try {
      // Validate and parse parameters
      const params = BadgeParamsSchema.parse(request.params);
      const query = BadgeQuerySchema.parse(request.query);

      const isDemo = query.demo === true;
      const funding = isDemo ? {
        currentAmount: query.current ?? Math.round(params.goal * 0.68),
      } : await fundingService.getFundingData(
        params.platform,
        params.username,
        query.refresh
      );

      // Generate badge
      const svg = badgeService.generateFundingBadge({
        current: funding.currentAmount,
        goal: params.goal,
        style: query.style,
        label: query.label,
        logo: query.logo,
        color: query.color,
      });

      // Generate ETag
      const etag = `"${crypto.createHash('md5').update(svg).digest('hex').slice(0, 27)}"`;

      // Check If-None-Match for 304 responses
      if (request.headers['if-none-match'] === etag) {
        return reply.code(304).send();
      }

      // Send SVG response
      return reply
        .code(200)
        .header('Content-Type', 'image/svg+xml;charset=utf-8')
        .header('Cache-Control', isDemo ? 'public, max-age=3600' : 'public, max-age=300, s-maxage=300')
        .header('ETag', etag)
        .header('X-Content-Type-Options', 'nosniff')
        .send(svg);
    } catch (error: any) {
      request.log.error({ error, params: request.params }, 'Failed to generate badge');

      // Determine error message and cache control
      let errorMessage = 'Error';
      let cacheControl = 'public, max-age=60'; // Default: short cache

      if (error.message?.includes('has not authorized this service')) {
        errorMessage = 'Not Authorized - Connect GitHub';
        cacheControl = 'public, max-age=300'; // 5 min - might authorize soon
      } else if (error.message?.includes('Cannot access sponsor data')) {
        errorMessage = 'Access Denied';
        cacheControl = 'public, max-age=1800'; // 30 min - permissions unlikely to change quickly
      } else if (error.message?.includes('GitHub user not found')) {
        errorMessage = 'User Not Found';
        cacheControl = 'public, max-age=3600'; // 1 hour - won't change soon
      } else if (error.message?.includes('Invalid GitHub username')) {
        errorMessage = 'Invalid Username';
        cacheControl = 'public, max-age=3600'; // 1 hour - won't change
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Rate Limited';
        cacheControl = 'public, max-age=300'; // 5 min - might recover
      } else if (error.message?.includes('Unsupported platform')) {
        errorMessage = 'Invalid Platform';
        cacheControl = 'public, max-age=3600'; // 1 hour - won't change
      } else if (error.message?.includes('token is required')) {
        errorMessage = 'Token Required';
        cacheControl = 'public, max-age=300'; // 5 min
      }

      // Return error badge (still 200 so the badge displays)
      const errorSvg = badgeService.generateErrorBadge(errorMessage);

      return reply
        .code(200)
        .header('Content-Type', 'image/svg+xml;charset=utf-8')
        .header('Cache-Control', cacheControl)
        .send(errorSvg);
    }
  });
};
