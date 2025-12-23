# Maintenance Badge Usage Guide

Complete guide for open source maintainers to add funding progress badges to their projects.

## Table of Contents

- [Quick Start](#quick-start)
- [Customization](#customization)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Ensure You Have GitHub Sponsors Enabled

Before using Maintenance Badge, make sure you have:
- An active GitHub Sponsors profile at `https://github.com/sponsors/YOUR_USERNAME`
- At least one active sponsor (or $0 will be shown)

### 2. Choose Your Goal

Decide on a monthly funding goal. Common examples:
- `$500` - Part-time maintenance
- `$1,000` - Full-time development
- `$5,000` - Team expansion

### 3. Add Badge to README

The basic syntax is:

```markdown
![Maintenance Fund](https://maintenancebadges.com/badge/github/YOUR_USERNAME/YOUR_GOAL)
```

**Example:**

```markdown
![Maintenance Fund](https://maintenancebadges.com/badge/github/sindresorhus/5000)
```

This will display a badge showing current funding progress towards $5,000/month.

### 4. Make It Clickable (Recommended)

Link the badge to your sponsors page:

```markdown
[![Maintenance](https://maintenancebadges.com/badge/github/sindresorhus/5000)](https://github.com/sponsors/sindresorhus)
```

## Customization

### Badge Styles

Choose from three styles using the `style` parameter:

**Flat (Default)**
```markdown
![Maintenance](https://maintenancebadges.com/badge/github/username/1000?style=flat)
```

**Flat Square**
```markdown
![Maintenance](https://maintenancebadges.com/badge/github/username/1000?style=flat-square)
```

**For The Badge**
```markdown
![Maintenance](https://maintenancebadges.com/badge/github/username/1000?style=for-the-badge)
```

### Custom Label

Change the label text with `label`:

```markdown
![Support](https://maintenancebadges.com/badge/github/username/1000?label=Support%20Us)
```

Note: URL-encode spaces as `%20` or `+`.

### Custom Colors

Override the color scheme with `color` (hex without `#`):

```markdown
![Maintenance](https://maintenancebadges.com/badge/github/username/1000?color=ff69b4)
```

Note: By default, colors are dynamic based on progress:
- 0-30%: Red
- 30-70%: Yellow
- 70-100%: Green
- 100%+: Bright Green

### Force Refresh

Bypass cache to get the latest data with `refresh=true`:

```markdown
![Maintenance](https://maintenancebadges.com/badge/github/username/1000?refresh=true)
```

Note: Use sparingly to avoid rate limits.

### Combine Parameters

Combine multiple parameters with `&`:

```markdown
![Support](https://maintenancebadges.com/badge/github/username/1000?style=for-the-badge&label=Support&color=ff5733)
```

## Examples

### Basic Implementation

```markdown
## Support This Project

![Maintenance Fund](https://maintenancebadges.com/badge/github/yourusername/1000)

Help us reach our goal of $1,000/month for full-time development!

[Become a Sponsor](https://github.com/sponsors/yourusername)
```

### Multiple Milestones

```markdown
## Funding Goals

| Milestone | Progress | Description |
|-----------|----------|-------------|
| **Tier 1** | ![](https://maintenancebadges.com/badge/github/yourusername/500) | Part-time maintenance |
| **Tier 2** | ![](https://maintenancebadges.com/badge/github/yourusername/2000) | Full-time development |
| **Tier 3** | ![](https://maintenancebadges.com/badge/github/yourusername/5000) | Hire core contributor |
```

### Styled Badge Section

```markdown
## 🎯 Current Campaign: Q1 2025

[![Maintenance](https://maintenancebadges.com/badge/github/yourusername/1000?style=for-the-badge&label=Monthly%20Goal)](https://github.com/sponsors/yourusername)

**Unlocked at $1,000/month:**
- ✅ Weekly office hours
- ✅ Priority issue triage
- ✅ Monthly roadmap updates

[💰 Become a Sponsor](https://github.com/sponsors/yourusername)
```

### Header Badge

```markdown
# My Awesome Project

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/github/workflow/status/user/repo/CI)
[![Maintenance](https://maintenancebadges.com/badge/github/yourusername/1000)](https://github.com/sponsors/yourusername)

> A brief description of your project
```

### Sidebar Badge (in docs)

```markdown
<!-- In your docs sidebar -->

---

### 💖 Sponsor

[![Support](https://maintenancebadges.com/badge/github/yourusername/500?style=flat-square&label=Sponsor)](https://github.com/sponsors/yourusername)

Your support helps maintain this project!

---
```

## Best Practices

### Setting Realistic Goals

- **Start small**: Begin with an achievable goal (e.g., $100-500/month)
- **Be transparent**: Explain what the funding enables
- **Update goals**: As you reach milestones, set new ones

### Badge Placement

**Recommended locations:**
1. Top of README (high visibility)
2. After project description
3. In a dedicated "Support" or "Sponsors" section
4. Documentation sidebar

**Avoid:**
- Hiding in the middle of long READMEs
- Placing after installation instructions (less visible)

### Messaging

Good messaging examples:

```markdown
## Support This Project

This project is developed and maintained by volunteers. Your sponsorship helps us:
- 🚀 Release updates faster
- 🐛 Fix bugs promptly
- 📚 Improve documentation
- 💬 Provide community support

[![Maintenance](https://maintenancebadges.com/badge/github/yourusername/1000)](https://github.com/sponsors/yourusername)
```

### Update Frequency

- Badges update every 5 minutes automatically
- No need to manually refresh or update the URL
- Data is cached to respect GitHub API rate limits

## Troubleshooting

### Badge Shows "User Not Found"

**Causes:**
- Username is misspelled
- User doesn't exist on GitHub
- Privacy settings prevent API access

**Solution:**
- Verify username at `https://github.com/YOUR_USERNAME`
- Check that your profile is public

### Badge Shows $0

**Causes:**
- No active sponsors
- GitHub Sponsors not enabled
- All sponsorships are one-time (not recurring)

**Solution:**
- Enable GitHub Sponsors at `https://github.com/sponsors`
- Ask sponsors to use monthly recurring sponsorships
- Note: One-time sponsorships don't count toward MRR

### Badge Shows "Rate Limited"

**Causes:**
- GitHub API rate limit exceeded (rare)
- Too many refresh requests

**Solution:**
- Wait a few minutes for the rate limit to reset
- Don't use `refresh=true` excessively
- Badge will automatically recover

### Badge Not Updating

**Causes:**
- Cache hasn't expired yet (5-minute TTL)
- Browser caching the image

**Solution:**
- Wait up to 5 minutes for automatic refresh
- Hard refresh your browser (Ctrl+Shift+R)
- Use `refresh=true` parameter once to force update

### Badge Looks Wrong

**Causes:**
- Invalid parameters
- Typo in URL
- Special characters not URL-encoded

**Solution:**
- Verify URL syntax
- URL-encode special characters (spaces = `%20`, etc.)
- Test URL in browser first

## Advanced Usage

### Dynamic Goals Based on Context

```markdown
## Funding Status

<!-- Show different goals in different contexts -->

<!-- In README: -->
[![Main Goal](https://maintenancebadges.com/badge/github/username/1000?label=Main%20Goal)](...)

<!-- In ROADMAP.md: -->
[![Feature Goal](https://maintenancebadges.com/badge/github/username/5000?label=Feature%20Development)](...)
```

### Analytics Tracking

Wrap badges in links with UTM parameters:

```markdown
[![Maintenance](https://maintenancebadges.com/badge/github/username/1000)](https://github.com/sponsors/username?utm_source=readme&utm_medium=badge&utm_campaign=funding)
```

### A/B Testing Different Goals

Test different messaging by showing different goals in different projects:

```markdown
<!-- Project A: Conservative goal -->
![Maintenance](https://maintenancebadges.com/badge/github/username/500)

<!-- Project B: Ambitious goal -->
![Maintenance](https://maintenancebadges.com/badge/github/username/2000)
```

## Need Help?

- **Issues**: [GitHub Issues](https://github.com/yourusername/maintenance-badge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/maintenance-badge/discussions)
- **Email**: support@maintenancebadges.com

---

**Happy funding! 🎉**
