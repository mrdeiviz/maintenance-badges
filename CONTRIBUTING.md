# Contributing

Thanks for your interest in contributing! This project is small and focused, so keeping changes tight and well-scoped helps a lot.

## Quick Start

1. Fork the repo and create a feature branch.
2. Install dependencies:

```bash
npm install
```

3. Copy env file and fill values:

```bash
cp .env.example .env
```

4. Run the dev server:

```bash
npm run dev
```

## Development Workflow

- Keep PRs focused on a single change.
- Add or update tests when behavior changes.
- Run checks before pushing:

```bash
npm run test
npm run lint
npm run format
```

## Code Style

- TypeScript only in `src/`.
- Prefer clear, explicit naming.
- Keep routes thin; move logic into services.

## Reporting Issues

If you find a bug, open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Logs or screenshots if relevant

## Security

Please do not open public issues for security vulnerabilities. Contact the maintainer directly.
