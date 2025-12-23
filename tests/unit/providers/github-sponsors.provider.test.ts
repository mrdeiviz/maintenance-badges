import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { GitHubSponsorsProvider as GitHubSponsorsProviderType } from '../../../src/providers/github-sponsors.provider';

const { mockGraphql, mockGraphqlDefaults } = vi.hoisted(() => {
  const mockGraphql = vi.fn();
  const mockGraphqlDefaults = vi.fn(() => mockGraphql);
  return { mockGraphql, mockGraphqlDefaults };
});

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockConfig = {
  github: {
    token: 'test-github-token',
  },
};

vi.mock('@octokit/graphql', () => ({
  graphql: {
    defaults: mockGraphqlDefaults,
  },
}));

vi.mock('../../../src/core/logger.js', () => ({
  getLogger: () => mockLogger,
}));

vi.mock('../../../src/core/config.js', () => ({
  getConfig: () => mockConfig,
}));

describe('GitHubSponsorsProvider', () => {
  let GitHubSponsorsProvider: typeof import('../../../src/providers/github-sponsors.provider').GitHubSponsorsProvider;
  let provider: GitHubSponsorsProviderType;

  const mockSponsorshipData = {
    user: {
      sponsorshipsAsMaintainer: {
        totalRecurringMonthlyPriceInCents: 250000, // $2,500
        totalCount: 42,
      },
    },
    rateLimit: {
      remaining: 4999,
      limit: 5000,
      resetAt: '2024-01-01T00:00:00.000Z',
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ GitHubSponsorsProvider } = await import('../../../src/providers/github-sponsors.provider.js'));
    provider = new GitHubSponsorsProvider();
    mockGraphqlDefaults.mockReturnValue(mockGraphql);
    mockConfig.github.token = 'test-github-token';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const validUsernames = [
        'user',
        'user123',
        'user-name',
        'user-123',
        'a',
        'a1',
        'user-with-many-dashes',
        'User-With-Caps',
      ];

      validUsernames.forEach((username) => {
        expect(provider.validateUsername(username)).toBe(true);
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        '', // empty
        '-user', // starts with hyphen
        'user-', // ends with hyphen
        'user--name', // consecutive hyphens
        'user_name', // underscore not allowed
        'user.name', // dot not allowed
        'user name', // space not allowed
        'a'.repeat(40), // too long (max 39)
        'user@github', // special characters
      ];

      invalidUsernames.forEach((username) => {
        expect(provider.validateUsername(username)).toBe(false);
      });
    });
  });

  describe('getFundingData', () => {
    it('should fetch and return funding data successfully', async () => {
      mockGraphql.mockResolvedValue(mockSponsorshipData);

      const result = await provider.getFundingData('testuser', 'user-token');

      expect(result).toEqual({
        platform: 'github',
        username: 'testuser',
        currentAmount: 2500, // converted from cents
        currency: 'USD',
        isRecurring: true,
        breakdown: {
          sponsors: 42,
        },
        lastUpdated: expect.any(Date),
      });

      expect(mockLogger.debug).toHaveBeenCalledWith({ username: 'testuser' }, 'Fetching GitHub Sponsors data');
    });

    it('should throw error for invalid username', async () => {
      await expect(provider.getFundingData('invalid--username', 'token')).rejects.toThrow(
        'Invalid GitHub username: invalid--username'
      );
    });

    it('should throw error when token is not provided', async () => {
      await expect(provider.getFundingData('testuser')).rejects.toThrow(
        'GitHub token is required for this user'
      );
    });

    it('should throw error when user does not exist', async () => {
      mockGraphql.mockResolvedValue({
        user: null,
        rateLimit: mockSponsorshipData.rateLimit,
      });

      await expect(provider.getFundingData('nonexistent', 'token')).rejects.toThrow(
        'GitHub user not found: nonexistent'
      );
    });

    it('should throw error when sponsorship data is not accessible', async () => {
      mockGraphql.mockResolvedValue({
        user: {
          sponsorshipsAsMaintainer: null,
        },
        rateLimit: mockSponsorshipData.rateLimit,
      });

      await expect(provider.getFundingData('testuser', 'token')).rejects.toThrow(
        'Cannot access sponsor data for testuser'
      );
    });

    it('should use provided token to create GraphQL client', async () => {
      mockGraphql.mockResolvedValue(mockSponsorshipData);

      await provider.getFundingData('testuser', 'custom-token');

      expect(mockGraphqlDefaults).toHaveBeenCalledWith({
        headers: {
          authorization: 'token custom-token',
        },
      });
    });

    it('should handle zero sponsors', async () => {
      mockGraphql.mockResolvedValue({
        user: {
          sponsorshipsAsMaintainer: {
            totalRecurringMonthlyPriceInCents: 0,
            totalCount: 0,
          },
        },
        rateLimit: mockSponsorshipData.rateLimit,
      });

      const result = await provider.getFundingData('testuser', 'token');

      expect(result.currentAmount).toBe(0);
      expect(result.breakdown.sponsors).toBe(0);
    });
  });

  describe('getSponsorsData', () => {
    it('should fetch sponsors data successfully', async () => {
      mockGraphql.mockResolvedValue(mockSponsorshipData);

      const result = await provider.getSponsorsData('testuser', mockGraphql);

      expect(result).toEqual(mockSponsorshipData);
      expect(mockGraphql).toHaveBeenCalled();
    });

    it('should warn when rate limit is low', async () => {
      const lowRateLimitData = {
        ...mockSponsorshipData,
        rateLimit: {
          ...mockSponsorshipData.rateLimit,
          remaining: 50,
        },
      };

      mockGraphql.mockResolvedValue(lowRateLimitData);

      await provider.getSponsorsData('testuser', mockGraphql);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        { remaining: 50 },
        'GitHub API rate limit is low'
      );
    });

    it('should not warn when rate limit is sufficient', async () => {
      mockGraphql.mockResolvedValue(mockSponsorshipData);

      await provider.getSponsorsData('testuser', mockGraphql);

      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should throw error for invalid username', async () => {
      await expect(provider.getSponsorsData('invalid--username')).rejects.toThrow(
        'Invalid GitHub username: invalid--username'
      );
    });

    it('should handle 404 errors', async () => {
      const error404 = new Error('Not found');
      (error404 as any).status = 404;
      mockGraphql.mockRejectedValue(error404);

      await expect(provider.getSponsorsData('testuser', mockGraphql)).rejects.toThrow(
        'GitHub user not found: testuser'
      );
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('rate limit exceeded');
      (rateLimitError as any).status = 403;
      mockGraphql.mockRejectedValue(rateLimitError);

      await expect(provider.getSponsorsData('testuser', mockGraphql)).rejects.toThrow(
        'GitHub API rate limit exceeded'
      );
    });

    it('should log and rethrow other errors', async () => {
      const genericError = new Error('Generic error');
      mockGraphql.mockRejectedValue(genericError);

      await expect(provider.getSponsorsData('testuser', mockGraphql)).rejects.toThrow(
        'Generic error'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error: genericError, username: 'testuser' },
        'GitHub API query failed'
      );
    });

    it('should retry on failure with exponential backoff', async () => {
      const temporaryError = new Error('Temporary failure');
      mockGraphql
        .mockRejectedValueOnce(temporaryError)
        .mockRejectedValueOnce(temporaryError)
        .mockResolvedValueOnce(mockSponsorshipData);

      const result = await provider.getSponsorsData('testuser', mockGraphql);

      expect(result).toEqual(mockSponsorshipData);
      expect(mockGraphql).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const persistentError = new Error('Persistent failure');
      mockGraphql.mockRejectedValue(persistentError);

      await expect(provider.getSponsorsData('testuser', mockGraphql)).rejects.toThrow();
    });
  });

  describe('getRateLimitInfo', () => {
    it('should fetch rate limit information', async () => {
      mockGraphql.mockResolvedValue({
        rateLimit: {
          remaining: 4500,
          limit: 5000,
          resetAt: '2024-01-01T12:00:00.000Z',
        },
      });

      const result = await provider.getRateLimitInfo();

      expect(result).toEqual({
        remaining: 4500,
        limit: 5000,
        reset: new Date('2024-01-01T12:00:00.000Z'),
      });

      expect(mockGraphql).toHaveBeenCalledWith('{ rateLimit { remaining limit resetAt } }');
    });

    it('should throw error when GitHub token is not configured', async () => {
      mockConfig.github.token = undefined as any;

      await expect(provider.getRateLimitInfo()).rejects.toThrow(
        'GitHub token is required for rate limit checks'
      );
    });

    it('should log and rethrow errors', async () => {
      mockConfig.github.token = 'test-github-token';
      const error = new Error('API error');
      mockGraphql.mockRejectedValue(error);

      await expect(provider.getRateLimitInfo()).rejects.toThrow('API error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error },
        'Failed to fetch rate limit info'
      );
    });
  });

  describe('platform property', () => {
    it('should have platform set to github', () => {
      expect(provider.platform).toBe('github');
    });
  });
});
