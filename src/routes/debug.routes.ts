import type { FastifyPluginAsync } from 'fastify';
import { getConfig } from '../core/config.js';
import { GitHubSponsorsProvider } from '../providers/github-sponsors.provider.js';

export const debugRoutes: FastifyPluginAsync = async (fastify) => {
  const config = getConfig();

  fastify.get('/debug/github/:username', async (request, reply) => {
    if (config.nodeEnv === 'production') {
      return reply.code(404).send({ error: 'Not Found' });
    }

    const { username } = request.params as { username: string };
    const provider = new GitHubSponsorsProvider();
    const data = await provider.getSponsorsData(username);

    return reply
      .code(200)
      .header('Cache-Control', 'no-store')
      .send({
        username,
        totalRecurringMonthlyPriceInCents:
          data.user.sponsorshipsAsMaintainer.totalRecurringMonthlyPriceInCents,
        totalCount: data.user.sponsorshipsAsMaintainer.totalCount,
        rateLimit: data.rateLimit,
      });
  });
};
