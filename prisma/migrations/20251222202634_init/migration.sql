-- CreateTable
CREATE TABLE "user_tokens" (
    "id" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'bearer',
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_githubUsername_key" ON "user_tokens"("githubUsername");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_githubUserId_key" ON "user_tokens"("githubUserId");

-- CreateIndex
CREATE INDEX "user_tokens_githubUsername_idx" ON "user_tokens"("githubUsername");

-- CreateIndex
CREATE INDEX "user_tokens_lastUsedAt_idx" ON "user_tokens"("lastUsedAt");
