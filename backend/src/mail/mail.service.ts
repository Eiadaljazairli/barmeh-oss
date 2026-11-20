import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.resend.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587', 10),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER') || 'resend',
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    return this.sendMail(
      email,
      'رمز التحقق من منصة برمة',
      `رمز التحقق الخاص بك هو: ${otp}. صالح لمدة 5 دقائق.`,
      otp,
    );
  }

  async sendResetOtp(email: string, otp: string) {
    return this.sendMail(
      email,
      'استعادة كلمة المرور - برمة',
      `كود استعادة كلمة المرور هو: ${otp}. صالح لمدة 5 دقائق.`,
      otp,
    );
  }

  async send2FA(email: string, otp: string) {
    return this.sendMail(
      email,
      'رمز التحقق الثنائي (2FA) - برمة',
      `رمز التحقق الثنائي الخاص بك هو: ${otp}.`,
      otp,
    );
  }

  private async sendMail(
    email: string,
    subject: string,
    text: string,
    otp: string,
  ) {
    const from =
      this.configService.get('SMTP_FROM') ||
      '"Barmeh Security" <noreply@example.com>';

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject,
        text,
        html: `
          <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2d5a27; text-align: center;">منصة برمة</h2>
            <p style="font-size: 16px; color: #333; text-align: center;">${subject}</p>
            <p style="font-size: 16px; color: #333;">الرمز الخاص بك هو:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2d5a27; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">هذا الرمز صالح لمدة 5 دقائق فقط.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">إذا لم تطلب هذا الرمز، يرجى تجاهل هذا الإيميل.</p>
          </div>
        `,
      });
      this.logger.log(`✅ Email sent successfully to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send email to ${email}: ${error.message}`,
      );
      this.logger.warn(`🔑 LOCAL DEV OTP for ${email}: [ ${otp} ]`);

      if (this.configService.get('NODE_ENV') !== 'production') {
        return true;
      }
      throw error;
    }
  }
}
