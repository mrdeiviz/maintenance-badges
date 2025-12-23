import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenStorageService } from '../../../src/services/token-storage.service';

// Mock Prisma Client
const mockPrismaClient = {
  userToken: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

// Mock encryption service
const mockEncryptionService = {
  encrypt: vi.fn((text: string) => `encrypted_${text}`),
  decrypt: vi.fn((text: string) => text.replace('encrypted_', '')),
};

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockConfig = {
  database: {
    url: 'postgresql://user:pass@localhost:5432/testdb',
  },
};

const mockPool = {
  connect: vi.fn(),
  end: vi.fn(),
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: vi.fn(() => ({})),
}));

vi.mock('pg', () => ({
  Pool: vi.fn(() => mockPool),
}));

vi.mock('../../../src/services/encryption.service', () => ({
  EncryptionService: vi.fn(() => mockEncryptionService),
}));

vi.mock('../../../src/core/logger', () => ({
  getLogger: () => mockLogger,
}));

vi.mock('../../../src/core/config', () => ({
  getConfig: () => mockConfig,
}));

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TokenStorageService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('saveUserToken', () => {
    it('should encrypt and save new user token', async () => {
      const tokenData = {
        githubUsername: 'testuser',
        githubUserId: '12345',
        accessToken: 'ghp_token123',
        scope: 'read:user,user:email',
        expiresAt: new Date('2025-12-31T23:59:59.000Z'),
      };

      mockPrismaClient.userToken.upsert.mockResolvedValue({
        id: 1,
        ...tokenData,
        accessToken: 'encrypted_ghp_token123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.saveUserToken(tokenData);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('ghp_token123');
      expect(mockPrismaClient.userToken.upsert).toHaveBeenCalledWith({
        where: { githubUsername: 'testuser' },
        update: {
          accessToken: 'encrypted_ghp_token123',
          scope: 'read:user,user:email',
          expiresAt: tokenData.expiresAt,
          updatedAt: expect.any(Date),
        },
        create: {
          githubUsername: 'testuser',
          githubUserId: '12345',
          accessToken: 'encrypted_ghp_token123',
          scope: 'read:user,user:email',
          expiresAt: tokenData.expiresAt,
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        { username: 'testuser' },
        'User token saved'
      );
    });

    it('should update existing user token', async () => {
      const tokenData = {
        githubUsername: 'existinguser',
        githubUserId: '67890',
        accessToken: 'ghp_newtoken456',
        scope: 'read:org',
      };

      mockPrismaClient.userToken.upsert.mockResolvedValue({
        id: 2,
        ...tokenData,
        accessToken: 'encrypted_ghp_newtoken456',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      });

      await service.saveUserToken(tokenData);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('ghp_newtoken456');
      expect(mockPrismaClient.userToken.upsert).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        { username: 'existinguser' },
        'User token saved'
      );
    });

    it('should handle token without expiration date', async () => {
      const tokenData = {
        githubUsername: 'testuser',
        githubUserId: '12345',
        accessToken: 'ghp_token123',
        scope: 'read:user',
      };

      mockPrismaClient.userToken.upsert.mockResolvedValue({
        id: 1,
        ...tokenData,
        accessToken: 'encrypted_ghp_token123',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
      });

      await service.saveUserToken(tokenData);

      expect(mockPrismaClient.userToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            expiresAt: undefined,
          }),
        })
      );
    });
  });

  describe('getUserToken', () => {
    it('should retrieve and decrypt user token', async () => {
      const mockRecord = {
        id: 1,
        githubUsername: 'testuser',
        githubUserId: '12345',
        accessToken: 'encrypted_ghp_token123',
        scope: 'read:user',
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      };

      mockPrismaClient.userToken.findUnique.mockResolvedValue(mockRecord);
      mockPrismaClient.userToken.update.mockResolvedValue(mockRecord);

      const token = await service.getUserToken('testuser');

      expect(token).toBe('ghp_token123');
      expect(mockPrismaClient.userToken.findUnique).toHaveBeenCalledWith({
        where: { githubUsername: 'testuser' },
      });
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted_ghp_token123');
    });

    it('should update lastUsedAt timestamp when retrieving token', async () => {
      const mockRecord = {
        id: 1,
        githubUsername: 'testuser',
        githubUserId: '12345',
        accessToken: 'encrypted_ghp_token123',
        scope: 'read:user',
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      };

      mockPrismaClient.userToken.findUnique.mockResolvedValue(mockRecord);
      mockPrismaClient.userToken.update.mockResolvedValue({
        ...mockRecord,
        lastUsedAt: new Date(),
      });

      await service.getUserToken('testuser');

      expect(mockPrismaClient.userToken.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should return null when user token does not exist', async () => {
      mockPrismaClient.userToken.findUnique.mockResolvedValue(null);

      const token = await service.getUserToken('nonexistent');

      expect(token).toBeNull();
      expect(mockPrismaClient.userToken.update).not.toHaveBeenCalled();
      expect(mockEncryptionService.decrypt).not.toHaveBeenCalled();
    });
  });

  describe('deleteUserToken', () => {
    it('should delete user token', async () => {
      mockPrismaClient.userToken.delete.mockResolvedValue({
        id: 1,
        githubUsername: 'testuser',
        githubUserId: '12345',
        accessToken: 'encrypted_token',
        scope: 'read:user',
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      await service.deleteUserToken('testuser');

      expect(mockPrismaClient.userToken.delete).toHaveBeenCalledWith({
        where: { githubUsername: 'testuser' },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        { username: 'testuser' },
        'User token deleted'
      );
    });

    it('should handle delete errors', async () => {
      mockPrismaClient.userToken.delete.mockRejectedValue(
        new Error('Token not found')
      );

      await expect(service.deleteUserToken('nonexistent')).rejects.toThrow(
        'Token not found'
      );
    });
  });

  describe('hasToken', () => {
    it('should return true when user has a token', async () => {
      mockPrismaClient.userToken.count.mockResolvedValue(1);

      const result = await service.hasToken('testuser');

      expect(result).toBe(true);
      expect(mockPrismaClient.userToken.count).toHaveBeenCalledWith({
        where: { githubUsername: 'testuser' },
      });
    });

    it('should return false when user has no token', async () => {
      mockPrismaClient.userToken.count.mockResolvedValue(0);

      const result = await service.hasToken('nonexistent');

      expect(result).toBe(false);
      expect(mockPrismaClient.userToken.count).toHaveBeenCalledWith({
        where: { githubUsername: 'nonexistent' },
      });
    });
  });
});
