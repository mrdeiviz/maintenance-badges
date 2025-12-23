# Maintenance Badge 💰

**Show your GitHub Sponsors progress with beautiful, dynamic badges**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<div align="center">

### Example Badges

**Basic Style**
![Funding Badge](https://img.shields.io/badge/Funding-$2,500_/_$5,000_(50%25)-orange?style=flat)

**Flat Square Style**
![Funding Badge](https://img.shields.io/badge/Support_Us-$3,750_/_$5,000_(75%25)-yellow?style=flat-square)

**For The Badge Style**
![Funding Badge](https://img.shields.io/badge/Monthly_Goal-$5,000_/_$5,000_(100%25)-brightgreen?style=for-the-badge)

</div>

---

## 🎯 What is this?

Display your GitHub Sponsors progress directly in your README with automatically updating badges. Perfect for open source projects that want to show their funding goals and progress.

**Why use this?**
- 📊 Show real-time progress towards your funding goals
- 🎨 Looks great with automatic color changes (red → orange → yellow → yellowgreen → brightgreen → blue → purple)
- 🔄 Updates roughly every 5 minutes (longer if API rate limits are low)
- 🆓 Completely free and open source
- 🔒 Secure OAuth - no tokens to manage manually

---

## 🚀 Get Started in 2 Minutes

### 1️⃣ Connect Your GitHub Account

Visit **[your-service-url.com]** and click **"Connect with GitHub"**

<details>
<summary>What permissions do you need?</summary>

We only request permission to read your GitHub Sponsors data. Your token is encrypted and stored securely.

</details>

### 2️⃣ Get Your Badge

After connecting, you'll receive your personal badge URL:

```
https://your-service.com/badge/github/YOUR_USERNAME/YOUR_GOAL
```

Replace `YOUR_GOAL` with your monthly funding goal in USD (e.g., `5000` for $5,000/month)

### 3️⃣ Add to Your README

Copy and paste this into your README.md:

```markdown
[![Maintenance Fund](https://your-service.com/badge/github/YOUR_USERNAME/5000)](https://github.com/sponsors/YOUR_USERNAME)
```

**That's it!** Your badge will now show your current funding progress and update automatically.

---

## 🎨 Customize Your Badge

Make your badge match your project's style by adding URL parameters:

### 🖼️ Change the Style

```markdown
<!-- Flat (default) -->
[![Maintenance Fund](https://your-service.com/badge/github/YOUR_USERNAME/5000?style=flat)](...)

<!-- Flat Square -->
[![Maintenance Fund](https://your-service.com/badge/github/YOUR_USERNAME/5000?style=flat-square)](...)

<!-- For The Badge (big and bold) -->
[![Maintenance Fund](https://your-service.com/badge/github/YOUR_USERNAME/5000?style=for-the-badge)](...)
```

### ✏️ Change the Label

```markdown
<!-- Custom label -->
[![Support](https://your-service.com/badge/github/YOUR_USERNAME/5000?label=Support%20Us)](...)
```

### 🎨 Add an Icon

`logo` is reserved for future support. Today it is accepted but ignored.

### 🌈 Custom Color

Override the automatic color progression with your own color:

```markdown
<!-- Pink badge -->
[![Maintenance](https://your-service.com/badge/github/YOUR_USERNAME/5000?color=ff69b4)](...)
```

### 🔄 Force Refresh

By default, badges are cached for 5 minutes (up to 1 hour if rate limits are low). Force a refresh of the data cache:

```markdown
[![Maintenance](https://your-service.com/badge/github/YOUR_USERNAME/5000?refresh=true)](...)
```

### 🎯 All Options Combined

```markdown
[![Support Us](https://your-service.com/badge/github/YOUR_USERNAME/5000?style=for-the-badge&label=Support%20Us&color=ff69b4)](https://github.com/sponsors/YOUR_USERNAME)
```

---

## ❓ FAQ

<details>
<summary><b>How often does the badge update?</b></summary>

Badges are cached for 5 minutes to protect GitHub's API limits. If rate limits are low, the cache can extend up to 1 hour. This means your funding progress is usually reflected within a few minutes, but can take longer during heavy API usage.

</details>

<details>
<summary><b>Is my GitHub token safe?</b></summary>

Yes! Your OAuth token is encrypted using industry-standard encryption (AES-256-GCM) before being stored in the database. Only you can authorize or revoke access.

</details>

<details>
<summary><b>What if I want to remove my badge?</b></summary>

Simply remove the badge from your README. If you want to revoke access completely, visit the service and click "Disconnect GitHub" or revoke the app from your GitHub settings.

</details>

<details>
<summary><b>Can I use this for multiple repositories?</b></summary>

Yes. Once you've connected your GitHub account, the badge reflects your maintainer-level GitHub Sponsors data, so you can use the same badge URL in any repository.

</details>

<details>
<summary><b>What happens if I don't have GitHub Sponsors enabled?</b></summary>

If your account is not enrolled in GitHub Sponsors, the service may not be able to read sponsorship data and will return an error badge. If you're enrolled but have no sponsors yet, the badge will show $0.

</details>

<details>
<summary><b>How do the colors work?</b></summary>

Colors change automatically based on your progress:
- 🔴 **Red**: 0-25%
- 🟠 **Orange**: 25-50%
- 🟡 **Yellow**: 50-75%
- 🟢 **Yellowgreen**: 75-100%
- ✅ **Brightgreen**: exactly 100%
- 🔵 **Blue**: 100-150%
- 🟣 **Purple**: over 150%

</details>

---

## 🔐 Privacy & Security

- ✅ We only request **read-only** GitHub access (`read:user`, `read:org`)
- ✅ All tokens are **encrypted at rest** using AES-256-GCM
- ✅ We **never** see or store your sponsors' personal information
- ✅ You can **revoke access** anytime from your GitHub settings
- ✅ The service is **open source** - you can review the code

---

## 🤝 Support This Project

If you find this useful, consider sponsoring the development:

[![Sponsor](https://img.shields.io/badge/Sponsor-❤️-ff69b4?style=for-the-badge)](https://github.com/sponsors/mrdeiviz)

---

## 📝 License

MIT © mrdeiviz - Free to use for any purpose

---

## 🛠️ For Developers

<details>
<summary><b>Development Setup & API Documentation</b></summary>

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
- `logo`: Reserved for future support (currently ignored)
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

# Custom label and color
https://your-service.com/badge/github/octocat/1000?label=Support&color=ff69b4
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
        Redis cache check (5min TTL, up to 1hr on low rate limits)
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

### Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Acknowledgments

- [Shields.io](https://shields.io/) - Badge generation inspiration
- [badge-maker](https://www.npmjs.com/package/badge-maker) - SVG badge library
- All the amazing open source maintainers who inspired this project

</details>

---

<div align="center">

**Made with ❤️ for the open source community**

[Report a Bug](https://github.com/mrdeiviz/maintenance-badges/issues) • [Request a Feature](https://github.com/mrdeiviz/maintenance-badges/issues) • [Contribute](CONTRIBUTING.md)

</div>
