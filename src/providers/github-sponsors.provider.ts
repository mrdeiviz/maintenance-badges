import { graphql } from '@octokit/graphql';
import { BaseFundingProvider } from './base.provider.js';
import type { FundingData, RateLimitInfo } from '../types/funding-data.types.js';
import { getConfig } from '../core/config.js';
import { getLogger } from '../core/logger.js';

interface GitHubSponsorshipData {
  user: {
    sponsorshipsAsMaintainer: {
      totalRecurringMonthlyPriceInCents: number;
      totalCount: number;
    } | null; // Can be null if not the token owner
  } | null;
  rateLimit: {
    remaining: number;
    limit: number;
    resetAt: string;
  };
}

const SPONSORS_QUERY = `
  query GetSponsorsData($username: String!) {
    user(login: $username) {
      sponsorshipsAsMaintainer(first: 100, activeOnly: true) {
        totalRecurringMonthlyPriceInCents
        totalCount
      }
    }
    rateLimit {
      remaining
      limit
      resetAt
    }
  }
`;

export class GitHubSponsorsProvider extends BaseFundingProvider {
  platform = 'github';
  private logger = getLogger();

  constructor() {
    super();
  }

  private createGraphQLClient(token: string): typeof graphql {
    return graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });
  }

  private getApiToken(): string {
    const config = getConfig();
    if (!config.github.token) {
      throw new Error('GitHub token is required for rate limit checks');
    }
    return config.github.token;
  }

  async getFundingData(username: string, token?: string): Promise<FundingData> {
    if (!this.validateUsername(username)) {
      throw new Error(`Invalid GitHub username: ${username}`);
    }

    if (!token) {
      throw new Error('GitHub token is required for this user');
    }

    this.logger.debug({ username }, 'Fetching GitHub Sponsors data');

    const graphqlClient = this.createGraphQLClient(token);
    const data = await this.getSponsorsData(username, graphqlClient);

    // Validate user exists
    if (!data.user) {
      throw new Error(`GitHub user not found: ${username}`);
    }

    // Validate sponsorships data is available
    if (!data.user.sponsorshipsAsMaintainer) {
      throw new Error(
        `Cannot access sponsor data for ${username}. ` +
        `The provided token does not have permission to view this user's sponsors.`
      );
    }

    return {
      platform: 'github',
      username,
      currentAmount: data.user.sponsorshipsAsMaintainer.totalRecurringMonthlyPriceInCents / 100,
      currency: 'USD',
      isRecurring: true,
      breakdown: {
        sponsors: data.user.sponsorshipsAsMaintainer.totalCount,
      },
      lastUpdated: new Date(),
    };
  }

  async getSponsorsData(
    username: string,
    graphqlClient?: typeof graphql
  ): Promise<GitHubSponsorshipData> {
    if (!this.validateUsername(username)) {
      throw new Error(`Invalid GitHub username: ${username}`);
    }

    const client = graphqlClient ?? this.createGraphQLClient(this.getApiToken());
    return this.fetchWithRetry(() => this.querySponsorsData(username, client));
  }

  validateUsername(username: string): boolean {
    // GitHub username rules: alphanumeric + hyphens, 1-39 characters
    // Cannot start/end with hyphen, no consecutive hyphens
    return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username);
  }

  async getRateLimitInfo(): Promise<RateLimitInfo> {
    try {
      const query = `{ rateLimit { remaining limit resetAt } }`;
      const graphqlClient = this.createGraphQLClient(this.getApiToken());
      const result = await graphqlClient<{
        rateLimit: { remaining: number; limit: number; resetAt: string };
      }>(query);

      return {
        remaining: result.rateLimit.remaining,
        limit: result.rateLimit.limit,
        reset: new Date(result.rateLimit.resetAt),
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch rate limit info');
      throw error;
    }
  }

  private async querySponsorsData(
    username: string,
    graphqlClient: typeof graphql
  ): Promise<GitHubSponsorshipData> {
    try {
      const result = await graphqlClient<GitHubSponsorshipData>(SPONSORS_QUERY, {
        username,
      });

      // Log rate limit warning if low
      if (result.rateLimit.remaining < 100) {
        this.logger.warn(
          { remaining: result.rateLimit.remaining },
          'GitHub API rate limit is low'
        );
      }

      return result;
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`GitHub user not found: ${username}`);
      }
      if (error.status === 403 && error.message?.includes('rate limit')) {
        throw new Error('GitHub API rate limit exceeded');
      }

      this.logger.error({ error, username }, 'GitHub API query failed');
      throw error;
    }
  }
}
