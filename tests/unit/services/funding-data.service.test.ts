import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FundingDataService } from '../../../src/services/funding-data.service';
import type { FundingData, Platform } from '../../../src/types/funding-data.types';

// Mock dependencies
const mockCacheService = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  ping: vi.fn(),
  getMetrics: vi.fn(),
  close: vi.fn(),
};

const mockTokenStorage = {
  getUserToken: vi.fn(),
  saveUserToken: vi.fn(),
  deleteUserToken: vi.fn(),
  hasToken: vi.fn(),
};

const mockProvider = {
  platform: 'github',
  getFundingData: vi.fn(),
  getRateLimitInfo: vi.fn(),
  validateUsername: vi.fn(),
};

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockConfig = {
  cache: {
    defaultTTL: 300,
    maxTTL: 3600,
  },
  github: {
    token: 'test-token',
  },
};

vi.mock('../../../src/services/cache.service', () => ({
  getCacheService: () => mockCacheService,
}));

vi.mock('../../../src/services/token-storage.service', () => ({
  TokenStorageService: vi.fn(() => mockTokenStorage),
}));

vi.mock('../../../src/providers/github-sponsors.provider', () => ({
  GitHubSponsorsProvider: vi.fn(() => mockProvider),
}));

vi.mock('../../../src/core/logger', () => ({
  getLogger: () => mockLogger,
}));

vi.mock('../../../src/core/config', () => ({
  getConfig: () => mockConfig,
}));

describe('FundingDataService', () => {
  let service: FundingDataService;

  const mockFundingData: FundingData = {
    platform: 'github' as Platform,
    username: 'testuser',
    currentAmount: 5000,
    currency: 'USD',
    isRecurring: true,
    breakdown: { sponsors: 42 },
    lastUpdated: new Date('2024-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FundingDataService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getFundingData', () => {
    it('should return cached data if available and bypass is false', async () => {
      mockCacheService.get.mockResolvedValue(mockFundingData);

      const result = await service.getFundingData('github', 'testuser', false);

      expect(result).toEqual(mockFundingData);
      expect(mockCacheService.get).toHaveBeenCalledWith('funding:github:testuser');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { platform: 'github', username: 'testuser' },
        'Cache hit for funding data'
      );
      expect(mockTokenStorage.getUserToken).not.toHaveBeenCalled();
      expect(mockProvider.getFundingData).not.toHaveBeenCalled();
    });

    it('should fetch from provider when cache is empty', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockTokenStorage.getUserToken.mockResolvedValue('user-token');
      mockProvider.getFundingData.mockResolvedValue(mockFundingData);
      mockProvider.getRateLimitInfo.mockResolvedValue({
        remaining: 4999,
        limit: 5000,
        reset: new Date(),
      });

      const result = await service.getFundingData('github', 'testuser');

      expect(result).toEqual(mockFundingData);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        { platform: 'github', username: 'testuser' },
        'Cache miss, fetching from provider'
      );
      expect(mockTokenStorage.getUserToken).toHaveBeenCalledWith('testuser');
      expect(mockProvider.getFundingData).toHaveBeenCalledWith('testuser', 'user-token');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'funding:github:testuser',
        mockFundingData,
        300
      );
    });

    it('should bypass cache when bypassCache is true', async () => {
      mockCacheService.get.mockResolvedValue(mockFundingData);
      mockTokenStorage.getUserToken.mockResolvedValue('user-token');
      mockProvider.getFundingData.mockResolvedValue(mockFundingData);
      mockProvider.getRateLimitInfo.mockResolvedValue({
        remaining: 4999,
        limit: 5000,
        reset: new Date(),
      });

      await service.getFundingData('github', 'testuser', true);

      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(mockProvider.getFundingData).toHaveBeenCalled();
    });

    it('should throw error when platform is not supported', async () => {
      await expect(
        service.getFundingData('unsupported' as Platform, 'testuser')
      ).rejects.toThrow('Unsupported platform: unsupported');
    });

    it('should throw error when user has no token', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockTokenStorage.getUserToken.mockResolvedValue(null);

      await expect(service.getFundingData('github', 'testuser')).rejects.toThrow(
        'User testuser has not authorized this service'
      );
    });

    it('should use extended TTL when rate limit is low', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockTokenStorage.getUserToken.mockResolvedValue('user-token');
      mockProvider.getFundingData.mockResolvedValue(mockFundingData);
      mockProvider.getRateLimitInfo.mockResolvedValue({
        remaining: 50, // Low rate limit
        limit: 5000,
        reset: new Date(),
      });

      await service.getFundingData('github', 'testuser');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'funding:github:testuser',
        mockFundingData,
        3600 // maxTTL
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { platform: 'github', remaining: 50 },
        'Low rate limit, extending cache TTL'
      );
    });

    it('should use default TTL when rate limit info fails', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockTokenStorage.getUserToken.mockResolvedValue('user-token');
      mockProvider.getFundingData.mockResolvedValue(mockFundingData);
      mockProvider.getRateLimitInfo.mockRejectedValue(new Error('Rate limit check failed'));

      await service.getFundingData('github', 'testuser');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'funding:github:testuser',
        mockFundingData,
        300 // defaultTTL
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        'Failed to get rate limit info, using default TTL'
      );
    });

    it('should log and rethrow error when provider fails', async () => {
      const providerError = new Error('Provider failed');
      mockCacheService.get.mockResolvedValue(null);
      mockTokenStorage.getUserToken.mockResolvedValue('user-token');
      mockProvider.getFundingData.mockRejectedValue(providerError);

      await expect(service.getFundingData('github', 'testuser')).rejects.toThrow(
        'Provider failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: providerError, platform: 'github', username: 'testuser' },
        'Failed to fetch funding data'
      );
    });
  });

  describe('getSupportedPlatforms', () => {
    it('should return list of supported platforms', () => {
      const platforms = service.getSupportedPlatforms();

      expect(platforms).toEqual(['github']);
      expect(Array.isArray(platforms)).toBe(true);
    });
  });
});
