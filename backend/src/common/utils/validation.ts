export interface ValidationResult {
  score: number;
  isValid: boolean;
  flags: string[];
}

function normalizeText(text: string): string {
  if (!text) return '';

  let n = text.toLowerCase().trim().replace(/\s+/g, ' ');

  n = n.replace(/[\u064B-\u065F]/g, '');

  const leetMap: { [key: string]: string } = {
    '@': 'a',
    '1': 'i',
    '3': 'e',
    '0': 'o',
    $: 's',
    '7': 't',
    '5': 's',
    '!': 'i',
  };
  n = n
    .split('')
    .map((char) => leetMap[char] || char)
    .join('');

  n = n.replace(/[\u200B-\u200D\uFEFF]/g, '');

  n = n.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, '');

  return n;
}

function getFuzzyRatio(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export function validateRealName(
  name: string,
  _email?: string,
): ValidationResult {
  let score = 100;
  const flags: string[] = [];

  if (!name || name.trim().length === 0) {
    return { score: 0, isValid: false, flags: ['قصير جداً'] };
  }

  const raw = name.trim();
  const normalized = normalizeText(raw);
  const words = normalized.split(' ').filter((w) => w.length > 0);

  if (raw.length < 2) {
    score -= 40;
    flags.push('قصير جداً');
  }
  if (raw.length > 40) {
    score -= 40;
    flags.push('طويل جداً');
  }

  for (const word of words) {
    if (word.length < 2 || word.length > 20) {
      if (!flags.includes('مشكلة بنية')) {
        score -= 20;
        flags.push('مشكلة بنية');
      }
      break;
    }
  }

  const hasNumbers = /\d/.test(raw);
  const hasSymbols = /[^\u0600-\u06FFa-zA-Z\s\-'’.ـ]/.test(raw);
  const hasArabic = /[\u0600-\u06FF]/.test(raw);
  const hasLatin = /[a-zA-Z]/.test(raw);

  if (hasNumbers || hasSymbols) {
    score -= 40;
    flags.push('أحرف غير صالحة');
  }

  if (hasArabic && hasLatin) {
    const isMixedIllogically = words.some(
      (w) => /[\u0600-\u06FF]/.test(w) && /[a-zA-Z]/.test(w),
    );
    if (isMixedIllogically) {
      score -= 20;
      flags.push('مشكلة بنية');
    }
  }

  if (words.length > 4) {
    if (!flags.includes('مشكلة بنية')) {
      score -= 20;
      flags.push('مشكلة بنية');
    }
  }
  if (words.some((w) => w.length === 1)) {
    if (!flags.includes('مشكلة بنية')) {
      score -= 20;
      flags.push('مشكلة بنية');
    }
  }

  if (/(.)\1{3,}/.test(normalized)) {
    score -= 30;
    flags.push('تكرار');
  }
  const wordSet = new Set(words);
  if (wordSet.size < words.length) {
    score -= 30;
    flags.push('تكرار');
  }

  const keyboardPatterns = [
    'qwerty',
    'asdfgh',
    'zxcvbn',
    '123456',
    'ضصثقفغ',
    'asdf',
  ];
  if (keyboardPatterns.some((p) => normalized.includes(p))) {
    score -= 30;
    flags.push('تكرار');
  }

  const isRandom =
    /^[bcdfghjklmnpqrstvwxyz]{4,}$/.test(normalized) ||
    (hasLatin && !/[aeiouy]/.test(normalized) && normalized.length > 4);
  if (isRandom) {
    score -= 50;
    flags.push('اسم عشوائي');
  }

  const slurs = [
    'sharmouta',
    'sharmout',
    '7mar',
    'kalb',
    'عرص',
    'شرموط',
    'قحبة',
    'كس',
    'طيز',
    'منيوك',
  ];
  const criminals = ['adolf hitler', 'osama bin laden', 'pablo escobar'];
  const political = [
    'bashar al-assad',
    'hafez al-assad',
    'maher al-assad',
    'بشار الاسد',
    'بشار الأسد',
    'حافظ الاسد',
    'حافظ الأسد',
    'ماهر الاسد',
    'ماهر الأسد',
  ];
  const suspicious = ['user123', 'test', 'admin', 'root'];

  const checkBlacklist = (list: string[], penalty: number, flag: string) => {
    for (const item of list) {
      if (normalized.includes(item) || getFuzzyRatio(normalized, item) >= 0.8) {
        score -= penalty;
        if (!flags.includes(flag)) flags.push(flag);
        return true;
      }
    }
    return false;
  };

  checkBlacklist(slurs, 100, 'شتيمة');
  checkBlacklist(criminals, 80, 'اسم محظور');
  checkBlacklist(political, 80, 'اسم سياسي محظور');
  checkBlacklist(suspicious, 30, 'نمط مشبوه');

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    isValid: score >= 70,
    flags,
  };
}

export function isValidRealName(name: string): boolean {
  return validateRealName(name).isValid;
}

export function sanitize(str?: string): string {
  if (!str) return '';
  return (
    str
      .replace(/<[^>]*>?/gm, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim()
  );
}

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('00963')) cleaned = cleaned.substring(5);
  else if (cleaned.startsWith('963')) cleaned = cleaned.substring(3);
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  return `+963${cleaned}`;
}
