# Local Development Setup

Quick guide to run Maintenance Badge locally.

## Prerequisites

- Node.js 22+ installed
- Docker (optional, for Redis)
- GitHub account with Personal Access Token

## Step-by-Step Setup

### 1. GitHub Token

1. Go to: https://github.com/settings/tokens/new
2. Token name: `Maintenance Badge Local Dev`
3. Select scopes: `read:org`, `read:user`
4. Generate and **copy the token**

### 2. Redis Setup

**Option A: Docker (Recommended)**

```bash
docker run -d --name maintenance-badge-redis -p 6379:6379 redis:7-alpine
```

Verify it's running:
```bash
docker ps | grep redis
```

**Option B: Upstash (Free, No Install)**

1. Sign up: https://console.upstash.com/
2. Create new Redis database
3. Copy connection URL

### 3. Environment Configuration

Create `.env` file in project root:

```bash
# Copy from template
cp .env.example .env
```

Edit `.env` and update:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=debug

# PASTE YOUR GITHUB TOKEN HERE
GITHUB_TOKEN=ghp_your_token_here

# For Docker:
REDIS_URL=redis://localhost:6379

# OR for Upstash:
# REDIS_URL=rediss://your-upstash-url
# REDIS_PASSWORD=your-upstash-password

CACHE_DEFAULT_TTL=300
CACHE_MAX_TTL=3600

RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

ALLOWED_ORIGINS=*
```

### 4. Install Dependencies (if not done)

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

You should see:
```
[timestamp] INFO: Server started successfully
  port: 3000
  host: "0.0.0.0"
  nodeEnv: "development"
```

### 6. Test Endpoints

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Generate Badge (replace with real GitHub username):**
```bash
# Example with sindresorhus (popular sponsor)
curl http://localhost:3000/badge/github/sindresorhus/5000 -o test-badge.svg

# Open test-badge.svg in your browser to see the result
```

**Test with your own username (if you have sponsors):**
```bash
curl http://localhost:3000/badge/github/YOUR_USERNAME/1000 -o my-badge.svg
```

## Troubleshooting

### Redis Connection Error

**Error:** `Redis connection error ECONNREFUSED`

**Solution:**
```bash
# Check if Redis is running
docker ps | grep redis

# If not running, start it:
docker start maintenance-badge-redis

# Or create new container:
docker run -d --name maintenance-badge-redis -p 6379:6379 redis:7-alpine
```

### GitHub API Error

**Error:** `GitHub user not found`

**Solution:**
- Verify username exists: `https://github.com/USERNAME`
- Check if user has GitHub Sponsors enabled
- Ensure token has correct scopes

**Error:** `GitHub API rate limit exceeded`

**Solution:**
- Verify GITHUB_TOKEN is set correctly
- Check token hasn't expired
- Wait a few minutes for rate limit to reset

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Change PORT in .env to different port:
PORT=3001

# Or kill process using port 3000:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill
```

## Development Tips

### Watch Logs in Real-Time

The dev server uses Pino Pretty for beautiful logs:

```
[12:34:56] INFO: Fetching GitHub Sponsors data
  username: "sindresorhus"
[12:34:56] DEBUG: Cache miss, fetching from provider
```

### Test Different Scenarios

**Test with non-existent user:**
```bash
curl http://localhost:3000/badge/github/nonexistentuser123/1000
# Should return error badge: "User Not Found"
```

**Test cache:**
```bash
# First request (cache miss - slower)
time curl http://localhost:3000/badge/github/sindresorhus/5000 > /dev/null

# Second request (cache hit - much faster)
time curl http://localhost:3000/badge/github/sindresorhus/5000 > /dev/null
```

**Test refresh parameter:**
```bash
# Bypass cache
curl "http://localhost:3000/badge/github/sindresorhus/5000?refresh=true" -o badge.svg
```

**Test different styles:**
```bash
curl "http://localhost:3000/badge/github/sindresorhus/5000?style=flat" -o flat.svg
curl "http://localhost:3000/badge/github/sindresorhus/5000?style=for-the-badge" -o big.svg
```

### View Badge in Browser

Open `http://localhost:3000/badge/github/sindresorhus/5000` directly in your browser!

### Check Cache Metrics

```bash
curl http://localhost:3000/health | json_pp
```

Look for:
```json
"cache": {
  "hits": 10,
  "misses": 2,
  "total": 12,
  "hitRate": "83.33%"
}
```

## Next Steps

Once everything works locally:

1. **Add to your README:** Test the badge in a local markdown file
2. **Deploy to Railway/Fly.io:** Follow deployment guide
3. **Share with community:** Get feedback from other maintainers

## Useful Commands

```bash
# Development
npm run dev          # Start with hot reload

# Build
npm run build        # Compile TypeScript

# Production
npm start           # Run compiled version

# Clean
rm -rf dist/        # Remove compiled files
rm -rf node_modules/ # Remove dependencies
npm install         # Reinstall fresh

# Docker (Redis)
docker start maintenance-badge-redis   # Start Redis
docker stop maintenance-badge-redis    # Stop Redis
docker logs maintenance-badge-redis    # View Redis logs
```
