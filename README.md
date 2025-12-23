# Maintenance Badge

> Dynamic SVG badges for open source maintenance funds - Twitch-style progress tracking for GitHub Sponsors

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem

Open source projects can display static sponsor logos, but there's no way to show **progress towards maintenance funds** with visual progress bars like Twitch/Kickstarter campaigns.

**Maintenance Badge solves this** by providing dynamic SVG badges that show real-time maintenance fund progress with visual progress bars.

## 🚀 How It Works - OAuth Flow

This service uses **GitHub OAuth** to securely access your sponsors data:

1. **Visit the service** and click "Connect with GitHub"
2. **Authorize** the app to read your sponsors data
3. **Get your badge URL** - we generate a unique badge for your account
4. **Add to README** - paste the markdown into your project

Your GitHub token is encrypted and stored securely. The badge updates automatically every 5 minutes.

## Features

- ✅ Dynamic SVG badges showing maintenance fund progress
- ✅ Visual progress with percentage display
- ✅ Smart color progression (red → orange → yellow → green → purple for exceeded goals)
- ✅ Multiple badge styles (`flat`, `flat-square`, `for-the-badge`)
- ✅ GitHub Sponsors integration with OAuth
- ✅ Zero configuration - just add a URL to your README
- ✅ Free and open source

## Quick Start

### For Users (Add Badge to Your Project)

1. **Visit the service** (e.g., `https://your-badge-service.com`)
2. **Click "Connect with GitHub"** and authorize the app
3. **Copy your badge URL** from the success page
4. **Add to your README.md:**

```markdown
[![Maintenance](https://your-service.com/badge/github/YOUR_USERNAME/5000)](https://github.com/sponsors/YOUR_USERNAME)
```

Replace `5000` with your monthly funding goal in USD.

### Customize Your Badge

Add query parameters to customize appearance:

```markdown
[![Maintenance](https://your-service.com/badge/github/YOUR_USERNAME/5000?style=for-the-badge&label=Support%20Us)](https://github.com/sponsors/YOUR_USERNAME)
```

**Parameters:**
- `style`: `flat`, `flat-square`, `for-the-badge` (default: `flat`)
- `label`: Custom label text (default: `Funding`)
- `logo`: Icon from [simple-icons](https://simpleicons.org/)
- `color`: Custom color (hex without `#`)
- `refresh`: Force cache refresh (`true`/`false`)

## API Documentation

### Authentication Endpoints

#### Connect GitHub
```
GET /auth/github
```
Redirects to GitHub OAuth authorization page.

#### OAuth Callback
```
GET /auth/github/callback?code=xxx&state=xxx
```
Handles GitHub OAuth callback (automatically called by GitHub).

#### Check Authorization Status
```
GET /auth/status/:username
```
Returns whether a user has authorized the service.

**Response:**
```json
{
  "username": "octocat",
  "authorized": true
}
```

#### Revoke Access
```
POST /auth/revoke
Content-Type: application/json

{
  "username": "octocat"
}
```

### Badge Endpoint

```
GET /badge/:platform/:username/:goal
```

**Parameters:**
- `platform`: Platform name (`github`)
- `username`: GitHub username (must be authorized)
- `goal`: Monthly goal amount in USD

**Query Parameters:**
- `style`: Badge style: `flat`, `flat-square`, `for-the-badge` (default: `flat`)
- `label`: Custom label text (default: `Funding`)
- `logo`: Icon from [simple-icons](https://simpleicons.org/)
- `color`: Custom color (hex without `#`, overrides automatic color)
- `refresh`: Force cache refresh (`true`/`false`)

**Examples:**

```
# Basic badge
https://your-service.com/badge/github/octocat/5000

# Custom style (flat-square)
https://your-service.com/badge/github/octocat/5000?style=flat-square

# Big badge style
https://your-service.com/badge/github/octocat/5000?style=for-the-badge

# Custom label, logo and color
https://your-service.com/badge/github/octocat/1000?label=Support&logo=heart&color=ff69b4
```

**Error States:**
- `Not Authorized - Connect GitHub`: User hasn't authorized the service
- `Access Denied`: Token doesn't have permission
- `User Not Found`: GitHub user doesn't exist
- `Rate Limited`: GitHub API rate limit exceeded

### Health Check

```
GET /health
```

Returns server health, cache metrics, and rate limit info.

## Development Setup

### Prerequisites

- Node.js 22+
- PostgreSQL (for user tokens)
- Redis (for caching)
- GitHub OAuth App

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/maintenance-badges.git
cd maintenance-badges
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up PostgreSQL:**

```bash
# Create database
createdb maintenance_badges

# Or using Docker
docker run -d \
  --name maintenance-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=maintenance_badges \
  -p 5432:5432 \
  postgres:16-alpine
```

4. **Create GitHub OAuth App:**

   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Fill in:
     - **Application name**: Maintenance Badge (Local Dev)
     - **Homepage URL**: `http://localhost:3000`
     - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
   - Save the **Client ID** and **Client Secret**

5. **Create `.env` file:**

```bash
cp .env.example .env
```

Then update with your values:

```env
# GitHub OAuth App (from step 4)
GITHUB_OAUTH_CLIENT_ID=Iv1.your_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret
GITHUB_OAUTH_CALLBACK_URL=http://localhost:3000/auth/github/callback

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/maintenance_badges

# Encryption & Session (generate with: openssl rand -base64 32)
ENCRYPTION_SECRET=your_32_char_secret_here
SESSION_SECRET=your_32_char_secret_here

# Redis
REDIS_URL=redis://localhost:6379

# Legacy (for backwards compatibility, can use any token)
GITHUB_TOKEN=ghp_any_valid_token
```

6. **Run database migrations:**

```bash
npx prisma migrate dev --name init
```

7. **Start Redis:**

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or use Upstash: https://console.upstash.com/
```

8. **Start the development server:**

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Testing the OAuth Flow

1. Visit `http://localhost:3000`
2. Click "Connect with GitHub"
3. Authorize the app
4. You'll receive your badge URL
5. Test it: `http://localhost:3000/badge/github/YOUR_USERNAME/5000`

### Testing

```bash
# Check health
curl http://localhost:3000/health

# Check auth status
curl http://localhost:3000/auth/status/YOUR_USERNAME

# Generate a badge (after authorizing)
curl http://localhost:3000/badge/github/YOUR_USERNAME/5000
```

## Project Structure

```
maintenance-badges/
├── src/
│   ├── core/           # Core configuration and setup
│   │   ├── server.ts   # Fastify server setup
│   │   ├── config.ts   # Environment configuration
│   │   └── logger.ts   # Pino logger setup
│   ├── providers/      # Platform integrations
│   │   ├── base.provider.ts
│   │   └── github-sponsors.provider.ts
│   ├── services/       # Business logic
│   │   ├── badge-generator.service.ts
│   │   ├── cache.service.ts
│   │   └── funding-data.service.ts
│   ├── routes/         # API routes
│   │   ├── badge.routes.ts
│   │   └── health.routes.ts
│   ├── schemas/        # Zod validation schemas
│   └── types/          # TypeScript types
└── tests/              # Unit and E2E tests
```

## Architecture

### Flow

```
User views README → Badge URL loaded
                  ↓
          /badge/github/username/goal
                  ↓
        Redis cache check (5min TTL)
            ↓           ↓
        HIT: →      MISS: GitHub API
      Return SVG        ↓
                   totalRecurringMonthlyPriceInCents
                        ↓
                  Generate SVG with progress bar
                        ↓
                  Cache + Return
```

### Key Design Decisions

- **On-demand generation**: No webhooks needed, simpler architecture
- **5-minute cache**: Balances freshness with API rate limits
- **ETag support**: Efficient 304 responses for repeated requests
- **Error badges**: Always return valid SVG, even on errors

## Deployment

### Railway (Recommended for MVP)

1. Connect your GitHub repo to Railway
2. Add Redis service (1-click)
3. Set environment variables in dashboard:
   - `GITHUB_TOKEN`
   - Other vars from `.env.example`
4. Deploy automatically on push to `main`

**Cost:** ~$5/month

### Fly.io

```bash
flyctl launch
flyctl secrets set GITHUB_TOKEN=xxx
flyctl deploy
```

See `docs/DEPLOYMENT.md` for detailed deployment guides.

## Roadmap

### Phase 1: MVP (Current)
- [x] GitHub Sponsors integration
- [x] Dynamic SVG badge generation
- [x] Progress bar visualization
- [x] Redis caching
- [x] Basic customization

### Phase 2: Customization
- [ ] Multiple badge styles (thermometer, compact, milestone)
- [ ] Custom color schemes
- [ ] Save goals in database
- [ ] Dashboard for configuration

### Phase 3: Multi-Platform
- [ ] Patreon integration
- [ ] Open Collective integration
- [ ] Combined badges (multiple platforms)
- [ ] Webhooks for cache invalidation

### Phase 4: Advanced Features
- [ ] JavaScript widget (not just SVG)
- [ ] Goal milestone notifications
- [ ] Analytics dashboard
- [ ] Dark mode support

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## License

MIT © mrdeiviz

## Acknowledgments

- [Shields.io](https://shields.io/) - Badge generation inspiration
- [badge-maker](https://www.npmjs.com/package/badge-maker) - SVG badge library
- All the amazing open source maintainers who inspired this project

---

**Made with ❤️ for the open source community**
