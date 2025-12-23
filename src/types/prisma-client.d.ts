declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: Record<string, unknown>);
    [key: string]: unknown;
  }
}
