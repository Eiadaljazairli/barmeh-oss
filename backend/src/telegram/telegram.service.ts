import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramService.name);
  private adminChatId: string;

  constructor(private configService: ConfigService) {
    const token =
      this.configService.get<string>('TELEGRAM_BOT_TOKEN') || 'YOUR_BOT_TOKEN';
    this.adminChatId =
      this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID') || '';
    this.bot = new Telegraf(token);
  }

  onModuleInit() {
    this.setupCommands();
    this.bot.launch().catch((err) => {
      this.logger.error('Failed to launch Telegram bot', err);
    });
    this.logger.log('Telegram Bot initialized');
  }

  private setupCommands() {
    this.bot.start(async (ctx) => {
      await ctx.reply(
        `أهلاً بك في نظام إدارة برمة! 🚀\n\nChat ID الخاص بك هو: ${ctx.chat.id}\nاستخدم هذا المعرف في ملف .env لإرسال الإشعارات إليك.`,
      );
    });

    this.bot.command('stats', async (ctx) => {
      await ctx.reply('جاري جلب إحصائيات النظام...');
    });
  }

  async sendMessage(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
    if (!this.adminChatId) {
      this.logger.warn('Admin Chat ID not set, skipping telegram message');
      return;
    }
    try {
      await this.bot.telegram.sendMessage(this.adminChatId, message, {
        parse_mode: parseMode,
      });
    } catch (error) {
      this.logger.error('Failed to send telegram message', error);
    }
  }
}
