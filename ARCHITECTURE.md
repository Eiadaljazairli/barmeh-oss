# Architecture · بنية المشروع

## نظرة عامة

Barmeh منصة إعلانات مبوبة للسوق السوري/الشامي. 

```
┌─────────────────────────────────────────────────────────────┐
│                    barmeh-mobile (Expo)                     │
│              React Native + TypeScript + i18n               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────▼──────────────────────────────────┐
│                 Nginx (Reverse Proxy + SSL)                  │
│                     your API domain                         │
└────────────┬─────────────────────────────┬──────────────────┘
             │                             │
┌────────────▼────────────┐  ┌────────────▼────────────┐
│   backend (NestJS)      │  │  barmeh-admin (Next.js) │
│   Port 3000             │  │  Port 3001              │
│   TypeScript + Prisma   │  │  App Router + TypeScript│
└────┬────────────────────┘  └─────────────────────────┘
     │
     ├── PostgreSQL (Primary DB)
     ├── Redis (Cache + Pub/Sub + Rate Limiting + BullMQ)
     └── Elasticsearch (Full-text Arabic Search + Fallback PG)
```

## مكوّنات Backend

### Modules

| Module | المسؤولية |
|--------|-----------|
| `auth` | OTP (SMS+Email), JWT, Google OAuth, 2FA Admin, Refresh Rotation |
| `listings` | إنشاء/تعديل/حذف/بحث الإعلانات |
| `categories` | شجرة الأقسام (parent/children) |
| `images` | رفع + Sharp (thumb/medium webp) + pHash + AI moderation |
| `chat` | WebSocket (Socket.IO + Redis Adapter) |
| `search` | Elasticsearch + Arabic Analyzer + PG fallback |
| `abuse` | velocity check + AI moderation + shadow ban |
| `reports` | بلاغات المستخدمين |
| `users` | الملف الشخصي + دعم + الحذف |
| `notifications` | إشعارات push + in-app |
| `mail` | SMTP (Nodemailer + Resend) |
| `sms` | SMS OTP (MOCK / Twilio / Unifonic) |
| `telegram` | إشعارات الإدارة |
| `ai` | Gemini Vision/Text للـ moderation |
| `health` | health checks |
| `redis` | shared Redis client (pub/sub + regular) |
| `prisma` | ORM shared service |

### قرارات تصميمية مهمة

1. **Soft Delete**: كل Listing وMessage لها `deletedAt` — لا حذف نهائي للأمان القانوني
2. **ES + PG Fallback**: البحث يستخدم Elasticsearch، يعود لـ Postgres تلقائياً عند الفشل
3. **Redis Adapter**: Socket.IO يدعم multi-instance من البداية
4. **Argon2**: كلمات السر وـ refresh tokens (أكثر أماناً من bcrypt)
5. **pHash**: كشف الصور المكررة عبر الإعلانات
6. **Trust Levels**: NEWBIE → VERIFIED → TRUSTED → VIP (مبني على KYC + سلوك)
7. **Arabic Analyzer**: Elasticsearch مع stemmer + normalization للعربية

## مسارات البيانات الحرجة

### نشر إعلان جديد:
```
POST /v1/listings
  → ValidationPipe (whitelist)
  → JwtAuthGuard (jti check)
  → sanitize(title, desc)
  → findForbiddenKeyword()
  → checkDuplicateListing() [48h window]
  → abuseService.evaluateListing() [velocity + price + AI]
  → prisma.listing.create()
  → [Queue] searchService.indexListing() → Elasticsearch
  → [Queue] telegramService.sendNotification()
```

### تسجيل الدخول (Email OTP):
```
POST /v1/auth/request-email-otp
  → ThrottlerGuard [100 req/min global]
  → rate limit per email [10/hour in Redis]
  → generate 6-digit OTP → Redis [TTL: 5min]
  → mail.sendOtp()

POST /v1/auth/verify-otp
  → timingSafeEqual(stored, submitted)
  → upsert User
  → getTokens(userId, jti)
  → SessionsService.createSession()
  → return {accessToken, refreshToken, user}
```

## متغيرات البيئة الحرجة

راجع `/backend/.env.example` للقائمة الكاملة.

| المتغير | الوصف | مطلوب في |
|---------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | جميع البيئات |
| `JWT_SECRET` | ≥ 64 حرف عشوائي | جميع البيئات |
| `REDIS_HOST` | عنوان Redis | جميع البيئات |
| `GEMINI_API_KEY` | للـ AI moderation | الإنتاج |
| `TELEGRAM_BOT_TOKEN` | لإشعارات الإدارة | الإنتاج |
| `SMTP_PASS` | API key لإرسال الإيميلات | الإنتاج |

