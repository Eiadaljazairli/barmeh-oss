import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });
    } else {
      this.logger.warn(
        'GEMINI_API_KEY not found in environment variables. AI Moderation will be disabled.',
      );
    }
  }

  async moderateText(
    text: string,
  ): Promise<{ isSafe: boolean; reason?: string }> {
    if (!this.model || !text) {
      this.logger.warn(
        'Moderation service unavailable - skipping AI check (Fail-Open)',
      );
      return { isSafe: true };
    }

    try {
      const prompt = `
أنت مشرف محتوى لسوق إعلانات سوري عربي. فحص النص أدناه بعناية. تعامل مع:

أ) الشتائم والسباب — بالعربية الفصحى، العامية السورية (الشامية، الحلبية، الساحلية، الحوارانية، الجزراوية)، اللبنانية، الأردنية، الفلسطينية، المصرية، الخليجية، والمغاربية. اعتبر أيضاً:
   - الشتائم بالعكس (مثل "ير ك" "5را" "كس م ك")
   - استبدال الحروف بأرقام (3=ع، 7=ح، 5=خ، 2=ء، 6=ط، 9=ص، 8=ق) وبرموز (@ # *)
   - الشتائم المخفية بمسافات أو نقاط أو شُرط
   - التلميحات الجنسية حتى لو ما فيها كلمة سيئة صريحة
   - الإهانات الطائفية والعنصرية والمناطقية

ب) المحتوى الجنسي الصريح أو الإيحاءات الجنسية أو طلب علاقات.

ج) السلع/الخدمات الممنوعة في سوريا:
   - مخدرات (حشيش، كبتاغون، كريستال، كوكايين، حبوب، أفيون، بانجو…)
   - أسلحة نارية، ذخيرة، متفجرات، ألعاب نارية احترافية
   - خمور وكحول (مع أن البيع المشروط مسموح في بعض المناطق، اعتبره مشبوهاً)
   - حيوانات مفترسة أو محمية
   - أعضاء بشرية، دم، تبرع مدفوع
   - وثائق مزورة، شهادات مزورة، عملة مزورة
   - خدمات قرصنة، اختراق، حسابات مسروقة
   - خدمات جنسية، دعارة، مرافقة
   - تجنيد مسلح أو دعوات تجنيد فصائلية

د) المحتالات والاحتيال:
   - وعود "ربح سريع" أو "استثمار مضمون"
   - طلب رسوم تحويل قبل الإرسال (Advance-fee fraud)
   - أرقام تواصل خارج التطبيق فقط (واتساب/تيليجرام بدون أي تفاصيل)
   - عروض مغرية جداً (سيارة بسعر دراجة، آيفون جديد بـ 20$ …)

النص للفحص: """${text}"""

أجب فقط بـ JSON (بدون أي شرح إضافي قبله أو بعده):
{
  "isSafe": boolean,
  "category": "profanity" | "sexual" | "prohibited_item" | "scam" | "hate_speech" | "safe",
  "reason": "تفسير موجز بالعربية إذا غير آمن، وإلا فارغ"
}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonResponse = this.parseJsonResponse(response.text());

      return jsonResponse;
    } catch (error) {
      this.logger.error('Error moderating text with AI:', error);
      return { isSafe: true };
    }
  }

  async moderateImage(
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ isSafe: boolean; reason?: string }> {
    if (!this.model) return { isSafe: true };

    try {
      const prompt = `
        Analyze this image for:
        1. Nudity or sexually explicit content.
        2. Violence or blood.
        3. Prohibited items (drugs, weapons, alcohol if context is illegal).
        4. Sensitive political content that might cause trouble.

        Respond ONLY in JSON format:
        {
          "isSafe": boolean,
          "reason": "string (brief explanation in Arabic if not safe, else empty)"
        }
      `;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType,
          },
        },
      ]);

      const response = await result.response;
      return this.parseJsonResponse(response.text());
    } catch (error) {
      this.logger.error('Error moderating image with AI:', error);
      return { isSafe: true };
    }
  }

  private parseJsonResponse(text: string): any {
    try {
      const cleanText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (_error) {
      this.logger.error('Failed to parse AI JSON response:', text);
      return { isSafe: true };
    }
  }
}
