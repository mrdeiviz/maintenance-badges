# Deployment

This project runs a Fastify server with PostgreSQL and Redis. You can deploy on any platform that supports Node.js 22+.

## Required Environment Variables

Set these for production (values from `.env.example`):

- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `GITHUB_OAUTH_CALLBACK_URL`
- `DATABASE_URL`
- `ENCRYPTION_SECRET`
- `SESSION_SECRET`
- `REDIS_URL`
- `GITHUB_TOKEN`
- `NODE_ENV=production`

## Railway (Recommended)

1. Connect your GitHub repo to Railway.
2. Add PostgreSQL and Redis services.
3. Set environment variables from the list above.
4. Build command: `npm run build`
5. Start command: `npm run start`
6. Run migrations in production:

```bash
npx prisma migrate deploy
```

## Fly.io

1. Install `flyctl` and run `flyctl launch`.
2. Provision Postgres and Redis (Fly Postgres + Upstash or external Redis).
3. Set secrets:

```bash
flyctl secrets set GITHUB_OAUTH_CLIENT_ID=... \
  GITHUB_OAUTH_CLIENT_SECRET=... \
  GITHUB_OAUTH_CALLBACK_URL=... \
  DATABASE_URL=... \
  ENCRYPTION_SECRET=... \
  SESSION_SECRET=... \
  REDIS_URL=... \
  GITHUB_TOKEN=...
```

4. Deploy:

```bash
flyctl deploy
```

## Notes

- `GITHUB_OAUTH_CALLBACK_URL` must match the OAuth app settings.
- Redis is required for caching; Postgres is required for token storage.
- Use `prisma migrate deploy` in production (not `migrate dev`).
