const ARABIC_DIGITS_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

export function normalizeDigits(text: string): string {
  return Array.from(text)
    .map((c) => ARABIC_DIGITS_MAP[c] ?? c)
    .join('');
}

export const SYRIAN_PHONE_REGEX =
  /(\+?963|00963)?[\s\-.]*0?9[\s\-.]*\d[\s\-.]*\d[\s\-.]*\d[\s\-.]*\d[\s\-.]*\d[\s\-.]*\d[\s\-.]*\d[\s\-.]*\d/g;

export const EXTERNAL_PLATFORM_PATTERNS: Array<{
  name: string;
  regex: RegExp;
}> = [
  { name: 'whatsapp', regex: /\b(whats?app|whtsap|واتس\s*اب|واتساب|واتس)\b/gi },
  { name: 'telegram', regex: /\b(telegram|tg|تلجرام|تليجرام|تلغرام)\b/gi },
  { name: 'viber', regex: /\b(viber|فايبر)\b/gi },
  { name: 'signal', regex: /\bsignal\s*(app|messenger)?\b/gi },
  {
    name: 'instagram_dm',
    regex: /\b(insta(gram)?|انستا(غرام)?)\s*(dm|message|رسالة)\b/gi,
  },
  {
    name: 'whatsapp_link',
    regex: /(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\/\S+/gi,
  },
  { name: 'telegram_link', regex: /t\.me\/\S+/gi },
];

export function containsPhoneNumber(text: string): boolean {
  const normalized = normalizeDigits(text);
  return SYRIAN_PHONE_REGEX.test(normalized);
}

export function findExternalPlatformMention(text: string): string | null {
  for (const pattern of EXTERNAL_PLATFORM_PATTERNS) {
    if (pattern.regex.test(text)) {
      return pattern.name;
    }
  }
  return null;
}

export const URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s]+/gi;

export function containsExternalUrl(
  text: string,
  allowedDomains: string[] = ['example.com'],
): boolean {
  const matches = text.match(URL_REGEX);
  if (!matches) return false;
  return matches.some((url) => {
    const lower = url.toLowerCase();
    return !allowedDomains.some((d) => lower.includes(d));
  });
}
