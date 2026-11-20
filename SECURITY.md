# Security policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private reporting instead: **Security → Report a vulnerability** on this repository.

Include a description, steps to reproduce, and the impact you expect.

## What the code already does

- **Auth:** JWT access + refresh tokens with rotation and per-session revocation; Argon2 for hashing; OTP codes compared with `crypto.timingSafeEqual`, short TTL and attempt limits.
- **Authorization:** every endpoint is guarded by `JwtAuthGuard` or explicitly marked `@Public()`; admin routes add `AdminGuard`; WebSocket connections verify the JWT.
- **Input:** global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`; user text is sanitized; forbidden-keyword and optional AI moderation.
- **Privacy:** phone numbers are never exposed by public endpoints; processed images are re-encoded without EXIF; account deletion anonymizes the user.
- **Transport:** Helmet headers, global rate limiting plus per-identifier limits in Redis.

## Deploying safely

- Generate fresh `JWT_SECRET` and `ENCRYPTION_KEY` values (64+ random bytes each).
- Change every default password in `.env` before exposing Postgres, Redis, Elasticsearch or Grafana.
- Set `CORS_ORIGINS` and `WEBSOCKET_CORS_ORIGIN` in production; an empty value allows all origins.
