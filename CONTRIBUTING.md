# Contributing

Thanks for helping. Arabic or English issues and PRs are both fine.

## Setup

Follow [Quick start](README.md#quick-start) in the README. You need Node.js 20+ and Docker.

## Before opening a PR

Run in the package you changed:

```bash
npm run lint
npx tsc --noEmit
npm test            # backend
npx prisma validate # if you touched backend/prisma/schema.prisma
```

- Keep secrets out of the code. Everything is read from environment variables.
- New backend services come with a `.spec.ts`; new endpoints declare an explicit guard or `@Public()`.
- User-facing strings go through i18n (`barmeh-mobile/i18n/ar.json` and `en.json`).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) are enforced by commitlint:

```
feat(listings): add price-range filter
fix(chat): keep scroll position after sending
```

Allowed types: `feat`, `fix`, `security`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `migration`.

## Workflow

1. Open an issue describing the bug or feature (skip for small fixes).
2. Branch from `main`, make the change with tests.
3. Open a PR; CI must pass.

## Good first contributions

- Translations and RTL/LTR layout fixes
- Seed data and sample images
- Docs: deployment guides for your favourite host
