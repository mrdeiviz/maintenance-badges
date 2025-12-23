import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { EncryptionService } from './encryption.service.js';
import { getConfig } from '../core/config.js';
import { getLogger } from '../core/logger.js';

let prismaClient: PrismaClient | null = null;
let prismaPool: Pool | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    const config = getConfig();
    prismaPool = new Pool({ connectionString: config.database.url });
    const adapter = new PrismaPg(prismaPool);
    prismaClient = new PrismaClient({ adapter });
  }

  return prismaClient;
}

export class TokenStorageService {
  private prisma: PrismaClient;
  private encryption: EncryptionService;
  private logger = getLogger();

  constructor() {
    this.prisma = getPrismaClient();
    this.encryption = new EncryptionService();
  }

  async saveUserToken(data: {
    githubUsername: string;
    githubUserId: string;
    accessToken: string;
    scope: string;
    expiresAt?: Date;
  }): Promise<void> {
    const encryptedToken = this.encryption.encrypt(data.accessToken);

    await this.prisma.userToken.upsert({
      where: { githubUsername: data.githubUsername },
      update: {
        accessToken: encryptedToken,
        scope: data.scope,
        expiresAt: data.expiresAt,
        updatedAt: new Date(),
      },
      create: {
        githubUsername: data.githubUsername,
        githubUserId: data.githubUserId,
        accessToken: encryptedToken,
        scope: data.scope,
        expiresAt: data.expiresAt,
      },
    });

    this.logger.info({ username: data.githubUsername }, 'User token saved');
  }

  async getUserToken(githubUsername: string): Promise<string | null> {
    const record = await this.prisma.userToken.findUnique({
      where: { githubUsername },
    });

    if (!record) {
      return null;
    }

    // Update last used timestamp
    await this.prisma.userToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return this.encryption.decrypt(record.accessToken);
  }

  async deleteUserToken(githubUsername: string): Promise<void> {
    await this.prisma.userToken.delete({
      where: { githubUsername },
    });

    this.logger.info({ username: githubUsername }, 'User token deleted');
  }

  async hasToken(githubUsername: string): Promise<boolean> {
    const count = await this.prisma.userToken.count({
      where: { githubUsername },
    });
    return count > 0;
  }
}
