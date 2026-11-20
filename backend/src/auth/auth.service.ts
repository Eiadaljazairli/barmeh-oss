import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isValidRealName, sanitize } from '../common/utils/validation';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import { TelegramService } from '../telegram/telegram.service';
import { MailService } from '../mail/mail.service';
import { AIService } from '../ai/ai.service';
import { ChatGateway } from '../chat/chat.gateway';
import { SessionsService } from './sessions.service';
import { AnalyticsService } from '../common/analytics/analytics.service';
import { v4 as uuidv4 } from 'uuid';
import {
  RequestEmailOtpDto,
  VerifyOtpDto,
  SocialLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { OAuth2Client } from 'google-auth-library';

async function generateUniqueUsername(tx: any): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const hex = crypto.randomBytes(4).toString('hex');
    const candidate = `user_${hex}`;
    const existing = await tx.user.findUnique({
      where: { username: candidate },
    });
    if (!existing) return candidate;
  }
  return `user_${crypto.randomBytes(6).toString('hex')}`;
}

const appGoogleClientIds = (): string[] =>
  [
    process.env.GOOGLE_CLIENT_ID_WEB,
    process.env.GOOGLE_CLIENT_ID_ANDROID,
    process.env.GOOGLE_CLIENT_ID_IOS,
  ].filter((id): id is string => !!id);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;
  private readonly googleAudiences: string[];

  private readonly OTP_TTL_SEC = 120;
  private readonly RESEND_COOLDOWN_SEC = 60;
  private readonly MAX_ATTEMPTS = 5;
  private readonly REQUEST_RATE_LIMIT_PER_HOUR = 10;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private telegram: TelegramService,
    private mail: MailService,
    private ai: AIService,
    private configService: ConfigService,
    private chatGateway: ChatGateway,
    private sessionsService: SessionsService,
    private analytics: AnalyticsService,
  ) {
    this.googleAudiences = Array.from(
      new Set(
        [
          this.configService.get<string>('GOOGLE_CLIENT_ID'),
          ...(this.configService.get<string>('GOOGLE_CLIENT_IDS')?.split(',') ??
            []),
          ...appGoogleClientIds(),
        ]
          .map((id) => id?.trim())
          .filter((id): id is string => !!id),
      ),
    );
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID') ??
        appGoogleClientIds()[0],
    );
  }

  private emailOtpKey(email: string) {
    return `otp:email:code:${email}`;
  }
  private emailCooldownKey(email: string) {
    return `otp:email:cooldown:${email}`;
  }
  private emailAttemptsKey(email: string) {
    return `otp:email:attempts:${email}`;
  }
  private emailHourlyKey(email: string) {
    return `otp:email:hourly:${email}`;
  }
  private loginAttemptsKey(email: string) {
    return `auth:login:attempts:${email}`;
  }
  private loginLockoutKey(email: string) {
    return `auth:login:lockout:${email}`;
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private async consumeOtpAttempt(
    otpKey: string,
    attemptsKey: string,
    provided: string,
  ): Promise<void> {
    const r = this.redis.client;
    const stored = await r.get(otpKey);
    if (!stored)
      throw new UnauthorizedException('انتهت صلاحية الرمز أو لم يتم طلبه');

    const attempts = await r.incr(attemptsKey);
    if (attempts === 1) await r.expire(attemptsKey, this.OTP_TTL_SEC);
    if (attempts > this.MAX_ATTEMPTS) {
      await r.del(otpKey);
      throw new UnauthorizedException(
        'تم تجاوز عدد المحاولات، الرجاء طلب رمز جديد',
      );
    }

    if (!this.compareOtp(stored, provided))
      throw new UnauthorizedException('رمز التحقق غير صحيح');
  }

  private compareOtp(stored: string, provided: string): boolean {
    try {
      return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(provided));
    } catch {
      return false;
    }
  }

  async requestEmailOtp(dto: RequestEmailOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const { isLogin } = dto;

    if (isLogin) {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user)
        throw new BadRequestException(
          'هذا البريد غير مسجل، يرجى إنشاء حساب أولاً',
        );
    } else {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user)
        throw new BadRequestException('الحساب موجود بالفعل يرجى تسجيل الدخول');
    }

    const r = this.redis.client;

    const hourly = await r.incr(this.emailHourlyKey(email));
    if (hourly === 1) await r.expire(this.emailHourlyKey(email), 3600);
    if (hourly > this.REQUEST_RATE_LIMIT_PER_HOUR) {
      throw new BadRequestException('تجاوزت عدد الطلبات المسموح، حاول لاحقاً');
    }

    const cooldownTtl = await r.ttl(this.emailCooldownKey(email));
    if (cooldownTtl > 0) {
      throw new BadRequestException(
        `الرجاء الانتظار ${cooldownTtl} ثانية قبل طلب رمز جديد`,
      );
    }

    const otp = this.generateOtp();
    await r.set(this.emailOtpKey(email), otp, 'EX', this.OTP_TTL_SEC);
    await r.set(
      this.emailCooldownKey(email),
      '1',
      'EX',
      this.RESEND_COOLDOWN_SEC,
    );
    await r.del(this.emailAttemptsKey(email));

    try {
      await this.mail.sendOtp(email, otp);
    } catch (mailError: any) {
      this.logger.error(
        `❌ Mail service failed for ${email}: ${mailError?.message}`,
      );
      await r.del(this.emailCooldownKey(email)).catch(() => {});
      throw new ServiceUnavailableException(
        'تعذّر إرسال البريد الإلكتروني الآن، يرجى المحاولة بعد دقيقة.',
      );
    }

    return {
      message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح',
      expiresInSeconds: this.OTP_TTL_SEC,
    };
  }

  async preVerifyEmailOtp(emailRaw: string, otp: string) {
    const r = this.redis.client;
    const email = emailRaw.trim().toLowerCase();
    await this.consumeOtpAttempt(
      this.emailOtpKey(email),
      this.emailAttemptsKey(email),
      otp,
    );
    await r.del(this.emailAttemptsKey(email));

    return { success: true };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('البريد الإلكتروني مطلوب');
    }
    const { otp, firstName, lastName, age, gender, governorate, userType } =
      dto;
    const r = this.redis.client;

    const key = this.emailOtpKey(email);
    const attemptsKey = this.emailAttemptsKey(email);

    const stored = await r.get(key);
    if (!stored)
      throw new UnauthorizedException('انتهت صلاحية الرمز أو لم يتم طلبه');

    const attempts = await r.incr(attemptsKey);
    if (attempts === 1) await r.expire(attemptsKey, this.OTP_TTL_SEC);

    if (attempts > this.MAX_ATTEMPTS) {
      await r.del(key);
      throw new UnauthorizedException(
        'تم تجاوز عدد المحاولات، الرجاء طلب رمز جديد',
      );
    }

    if (!this.compareOtp(stored, otp))
      throw new UnauthorizedException('رمز التحقق غير صحيح');

    const isRegistering = !!(firstName && firstName.trim().length > 0);

    const cleanFirstName = sanitize(firstName);
    const cleanLastName = sanitize(lastName);

    if (cleanFirstName && !isValidRealName(cleanFirstName)) {
      throw new BadRequestException(
        'الاسم الأول غير صالح، يرجى استخدام اسم حقيقي',
      );
    }
    if (cleanLastName && !isValidRealName(cleanLastName)) {
      throw new BadRequestException('الكنية غير صالحة، يرجى استخدام اسم حقيقي');
    }

    if (cleanFirstName || cleanLastName) {
      try {
        const nameToModerate = `${cleanFirstName || ''} ${cleanLastName || ''}`;
        const moderation = await this.ai.moderateText(nameToModerate);
        if (!moderation.isSafe) {
          this.logger.warn(
            `Name moderation flagged (fail-open): ${moderation.reason}`,
          );
        }
      } catch (err) {
        this.logger.error(`AI Name moderation failed: ${err.message}`);
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (isRegistering && existingUser && existingUser.password) {
      throw new BadRequestException('الحساب موجود بالفعل يرجى تسجيل الدخول');
    }

    if (!isRegistering && !existingUser) {
      throw new UnauthorizedException(
        'هذا الحساب غير موجود، يرجى إنشاء حساب أولاً',
      );
    }

    if (existingUser || firstName) {
      await Promise.all([r.del(key), r.del(attemptsKey)]);
    }

    const passwordHash = dto.password
      ? await argon2.hash(dto.password)
      : undefined;

    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.upsert({
        where: { email },
        update: {
          ...(cleanFirstName && { firstName: cleanFirstName }),
          ...(cleanLastName && { lastName: cleanLastName }),
          ...(age && { age: parseInt(age.toString(), 10) }),
          ...(gender && { gender }),
          ...(governorate && { governorate }),
          ...(userType && { userType }),
          ...(passwordHash && { password: passwordHash }),
        },
        create: {
          email,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          age: age ? parseInt(age.toString(), 10) : undefined,
          gender,
          governorate,
          userType: userType || 'CONSUMER',
          isEmailVerified: true,
          password: passwordHash,
          username: await generateUniqueUsername(tx),
        },
      });

      if (userType === 'MERCHANT' && (dto.storeName || dto.storeAddress)) {
        await tx.merchantProfile.upsert({
          where: { userId: u.id },
          update: {
            storeName: dto.storeName || undefined,
            storeAddress: dto.storeAddress || undefined,
          },
          create: {
            userId: u.id,
            storeName: dto.storeName || 'متجر جديد',
            storeAddress: dto.storeAddress || '',
            businessHours: {},
          },
        });
      }

      return u;
    });

    if (!existingUser) {
      this.chatGateway.emitToAdmins('new_user_registered', {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        createdAt: user.createdAt,
      });
    }

    const tokens = await this.getTokens(user.id, user.isAdmin);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.analytics.captureEvent(user.id, 'user_authenticated', {
      method: 'otp',
      userType: user.userType,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        trustScore: user.trustScore,
        isAdmin: user.isAdmin,
        userType: user.userType,
        trustLevel: user.trustLevel,
      },
    };
  }

  async passwordLogin(emailRaw: string, password: string) {
    const email = emailRaw.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      throw new UnauthorizedException(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    if (!user.password)
      throw new UnauthorizedException(
        'لم يتم تعيين كلمة سر لهذا الحساب بعد. يرجى تسجيل الدخول عبر الرمز المرسل للإيميل أولاً.',
      );

    const r = this.redis.client;
    const lockout = await r.get(this.loginLockoutKey(email));
    if (lockout)
      throw new UnauthorizedException(
        'تم حظر المحاولات مؤقتاً بسبب كثرة الأخطاء. حاول مجدداً بعد 15 دقيقة.',
      );

    let isMatch = false;
    try {
      if (
        user.password.startsWith('$2b$') ||
        user.password.startsWith('$2a$')
      ) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = await argon2.verify(user.password, password);
      }
    } catch (err) {
      this.logger.error(
        `Password verification failed for ${email}: ${err.message}`,
      );
      throw new UnauthorizedException('فشل التحقق من كلمة المرور');
    }

    if (!isMatch) {
      const attempts = await r.incr(this.loginAttemptsKey(email));
      if (attempts === 1) await r.expire(this.loginAttemptsKey(email), 3600);
      if (attempts >= 5) {
        await r.set(this.loginLockoutKey(email), '1', 'EX', 900);
        await r.del(this.loginAttemptsKey(email));
        throw new UnauthorizedException(
          'تجاوزت عدد المحاولات المسموح بها، تم حظر الحساب مؤقتاً لمدة 15 دقيقة.',
        );
      }
      throw new UnauthorizedException(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }

    await r.del(this.loginAttemptsKey(email));

    if (user.isAdmin && process.env.NODE_ENV === 'production') {
      const otp = this.generateOtp();
      const r = this.redis.client;
      await r.set(`2fa:admin:${user.id}`, otp, 'EX', 300);
      await this.telegram.sendMessage(
        `🔐 رمز التحقق الخاص بدخول لوحة التحكم هو: ${otp}\nهذا الرمز صالح لمدة 5 دقائق فقط.`,
      );
      return {
        requires2fa: true,
        userId: user.id,
        message: 'تم إرسال رمز التحقق إلى تيلجرام',
      };
    }

    const tokens = await this.getTokens(user.id, user.isAdmin);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.analytics.captureEvent(user.id, 'user_authenticated', {
      method: 'password',
      userType: user.userType,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        trustScore: user.trustScore,
        isAdmin: user.isAdmin,
        userType: user.userType,
      },
    };
  }

  async verify2fa(userId: string, code: string) {
    const r = this.redis.client;
    const otpKey = `2fa:admin:${userId}`;
    const attemptsKey = `2fa:admin:attempts:${userId}`;
    await this.consumeOtpAttempt(otpKey, attemptsKey, code);

    await Promise.all([r.del(otpKey), r.del(attemptsKey)]);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');

    const tokens = await this.getTokens(user.id, user.isAdmin);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        trustScore: user.trustScore,
        isAdmin: user.isAdmin,
        userType: user.userType,
      },
    };
  }

  async googleLogin(dto: SocialLoginDto) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: this.googleAudiences,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email || payload.email_verified !== true)
        throw new UnauthorizedException('فشل التحقق من حساب جوجل');

      const { email, sub: googleId, name, picture: avatarUrl } = payload;

      let user = await this.prisma.user.findFirst({
        where: { OR: [{ googleId }, { email }] },
      });
      const wasNewUser = !user;

      if (!user) {
        if (name) {
          try {
            const moderation = await this.ai.moderateText(name);
            if (!moderation.isSafe) {
              this.logger.warn(
                `Google name moderation flagged (fail-open): ${moderation.reason}`,
              );
            }
          } catch (err: any) {
            this.logger.error(
              `AI Google name moderation failed (fail-open): ${err?.message}`,
            );
          }
        }

        user = await this.prisma.user.create({
          data: {
            email,
            googleId,
            firstName: name?.split(' ')[0] || '',
            lastName: name?.split(' ').slice(1).join(' ') || '',
            avatarUrl,
            isEmailVerified: true,
            trustLevel: 'VERIFIED',
            username: await generateUniqueUsername(this.prisma),
          },
        });
      } else if (!user.googleId) {
        const takeoverRisk = !user.isEmailVerified;
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            isEmailVerified: true,
            ...(takeoverRisk ? { password: null, refreshToken: null } : {}),
          },
        });
        if (takeoverRisk) {
          await this.sessionsService.revokeAllForUser(
            user.id,
            'google_link_unverified_account',
          );
        }
      }

      const tokens = await this.getTokens(user.id, user.isAdmin);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      this.analytics.captureEvent(user.id, 'user_authenticated', {
        method: 'google',
        userType: user.userType,
      });

      return {
        ...tokens,
        isNewUser: wasNewUser,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          trustScore: user.trustScore,
          isAdmin: user.isAdmin,
          userType: user.userType,
          trustLevel: user.trustLevel,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(
        `Google Login Error: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      throw new UnauthorizedException('فشل تسجيل الدخول عبر جوجل');
    }
  }

  async getTokens(
    userId: string,
    isAdmin: boolean,
    deviceInfo?: {
      deviceId?: string;
      deviceName?: string;
      userAgent?: string;
      ip?: string;
    },
  ) {
    const jti = uuidv4();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, isAdmin, jti },
        { expiresIn: '1h' },
      ),
      this.jwtService.signAsync(
        { sub: userId, isAdmin, jti: uuidv4() },
        { expiresIn: '30d' },
      ),
    ]);

    const refreshTokenHash = await argon2.hash(refreshToken);
    this.sessionsService
      .createSession(userId, jti, {
        deviceId: deviceInfo?.deviceId,
        deviceName: deviceInfo?.deviceName,
        userAgent: deviceInfo?.userAgent,
        ip: deviceInfo?.ip,
        refreshTokenHash,
      })
      .catch((err) => {
        this.logger.error(`Failed to create login session: ${err.message}`);
      });

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    if (!refreshToken) return;
    const hashedToken = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    this.logger.log(`🔑 Password reset requested for: ${email}`);
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        this.logger.warn(
          `⚠️ Password reset attempted for non-existent email: ${email}`,
        );
        return {
          message: 'إذا كان البريد مسجلاً، فستصلك رسالة تحتوي رمز التحقق',
        };
      }

      const otp = crypto.randomInt(100000, 999999).toString();
      const r = this.redis.client;
      await r.set(this.emailOtpKey(email), otp, 'EX', this.OTP_TTL_SEC);
      await r.del(this.emailAttemptsKey(email));

      try {
        await this.mail.sendResetOtp(email, otp);
      } catch (mailError: any) {
        this.logger.error(
          `❌ Mail service failed for ${email}: ${mailError.message}`,
        );
      }

      return { message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' };
    } catch (error: any) {
      this.logger.error(
        `💥 Critical error in forgotPassword for ${email}: ${error.message}`,
      );
      throw new ServiceUnavailableException(
        'تعذّر معالجة طلبك حالياً، يرجى المحاولة بعد قليل.',
      );
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const r = this.redis.client;
    await this.consumeOtpAttempt(
      this.emailOtpKey(email),
      this.emailAttemptsKey(email),
      dto.otp,
    );

    const passwordHash = await argon2.hash(dto.newPassword);
    const user = await this.prisma.user.update({
      where: { email },
      data: { password: passwordHash, refreshToken: null },
    });
    await this.sessionsService.revokeAllForUser(user.id, 'password_reset');

    await Promise.all([
      r.del(this.emailOtpKey(email)),
      r.del(this.emailAttemptsKey(email)),
    ]);
    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }
}
