import type { BaseFundingProvider } from '../providers/base.provider.js';
import { GitHubSponsorsProvider } from '../providers/github-sponsors.provider.js';
import type { FundingData, Platform } from '../types/funding-data.types.js';
import { getCacheService } from './cache.service.js';
import { TokenStorageService } from './token-storage.service.js';
import { getLogger } from '../core/logger.js';
import { getConfig } from '../core/config.js';

export class FundingDataService {
  private providers = new Map<Platform, BaseFundingProvider>();
  private cacheService = getCacheService();
  private tokenStorage: TokenStorageService;
  private logger = getLogger();

  private getConfig() {
    return getConfig();
  }

  constructor() {
    // Register providers (MVP: GitHub Sponsors only)
    this.providers.set('github', new GitHubSponsorsProvider());
    this.tokenStorage = new TokenStorageService();
  }

  async getFundingData(platform: Platform, username: string, bypassCache = false): Promise<FundingData> {
    const provider = this.providers.get(platform);

    if (!provider) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Generate cache key
    const cacheKey = `funding:${platform}:${username}`;

    // Check cache first (unless bypassed)
    if (!bypassCache) {
      const cached = await this.cacheService.get<FundingData>(cacheKey);
      if (cached) {
        this.logger.debug({ platform, username }, 'Cache hit for funding data');
        return cached;
      }
    }

    this.logger.debug({ platform, username }, 'Cache miss, fetching from provider');

    // **NEW:** Fetch user's OAuth token
    const userToken = await this.tokenStorage.getUserToken(username);

    if (!userToken) {
      throw new Error(
        `User ${username} has not authorized this service. ` +
        `Please visit /auth/github to connect your GitHub account.`
      );
    }

    // Fetch from provider using user's token
    try {
      const data = await provider.getFundingData(username, userToken);

      // Determine TTL based on rate limit
      const config = this.getConfig();
      let ttl = config.cache.defaultTTL;
      try {
        const rateLimitInfo = await provider.getRateLimitInfo();
        if (rateLimitInfo.remaining < 100) {
          // Low on rate limit, cache longer
          ttl = config.cache.maxTTL;
          this.logger.warn(
            { platform, remaining: rateLimitInfo.remaining },
            'Low rate limit, extending cache TTL'
          );
        }
      } catch (error) {
        this.logger.warn({ error }, 'Failed to get rate limit info, using default TTL');
      }

      // Cache the result
      await this.cacheService.set(cacheKey, data, ttl);

      return data;
    } catch (error: any) {
      this.logger.error({ error, platform, username }, 'Failed to fetch funding data');
      throw error;
    }
  }

  getSupportedPlatforms(): Platform[] {
    return Array.from(this.providers.keys());
  }
}

let fundingDataServiceInstance: FundingDataService | null = null;

export function createFundingDataService(): FundingDataService {
  if (!fundingDataServiceInstance) {
    fundingDataServiceInstance = new FundingDataService();
  }
  return fundingDataServiceInstance;
}

export function getFundingDataService(): FundingDataService {
  if (!fundingDataServiceInstance) {
    throw new Error('Funding data service not initialized.');
  }
  return fundingDataServiceInstance;
}
