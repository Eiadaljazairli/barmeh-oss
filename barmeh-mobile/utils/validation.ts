export interface ValidationResult {
  score: number;
  isValid: boolean;
  flags: string[];
}

function normalizeText(text: string): string {
  if (!text) return '';

  let n = text.trim().toLowerCase();

  n = n.replace(/\s+/g, ' ');

  n = n.replace(/[\u064B-\u065F]/g, '');

  const leetMap: { [key: string]: string } = {
    '@': 'a', '1': 'i', '3': 'e', '0': 'o', '$': 's', '7': 't', '5': 's', '!': 'i'
  };
  n = n.split('').map(char => leetMap[char] || char).join('');

  n = n.replace(/[^\w\s\u0600-\u06FF.-]/gi, '');

  return n;
}

export function validateRealName(name: string, email?: string): ValidationResult {
  let score = 100;
  const flags: string[] = [];

  if (!name || name.trim().length === 0) {
    return { score: 0, isValid: false, flags: ['قصير جداً'] };
  }

  const raw = name.trim();
  const normalized = normalizeText(raw);
  const words = normalized.split(' ').filter(w => w.length > 0);

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
      score -= 20;
      flags.push('مشكلة بنية');
      break;
    }
  }

  const allowedRegex = /^[a-zA-Z\u0600-\u06FF\s\-'’.ـ]+$/;
  if (!allowedRegex.test(raw)) {
    score -= 40;
    flags.push('أحرف غير صالحة');
  }

  if (/\d/.test(raw)) {
    score -= 40;
    flags.push('يحتوي أرقام');
  }

  if (words.length > 4) {
    score -= 20;
    flags.push('مشكلة بنية');
  }
  if (words.some(w => w.length === 1)) {
    score -= 20;
    flags.push('مشكلة بنية');
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

  const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', '123456', 'ضصثقفغ'];
  if (keyboardPatterns.some(p => normalized.includes(p))) {
    score -= 50;
    flags.push('نمط مشبوه');
  }

  if (/^[bcdfghjklmnpqrstvwxyz]{4,}$/.test(normalized)) {
    score -= 50;
    flags.push('اسم عشوائي');
  }

  const politicalKeywords = [
    'assad', 'الأسد', 'الاسد', 'al-assad', 'al assad', 'alassad', 'elassad', 'el assad', 'el-assad'
  ];
  const genericBlacklist = [
    'admin', 'root', 'test', 'tester', 'system', 'user', 'guest', 'null', 'undefined',
    'adolf hitler', 'osama bin laden', 'pablo escobar'
  ];
  const politicalPhrases = [
    'بشار الاسد', 'بشار الأسد',
    'حافظ الاسد', 'حافظ الأسد',
    'ماهر الاسد', 'ماهر الأسد',
    'bashar al-assad', 'bashar alassad',
    'hafez al-assad', 'hafez alassad',
    'maher al-assad', 'maher alassad',
  ];

  if (
    genericBlacklist.some(b => normalized.includes(b)) ||
    words.some(w => politicalKeywords.includes(w)) ||
    politicalPhrases.some(p => normalized.includes(p))
  ) {
    score = 0;
    flags.push('اسم محظور');
  }

  if (email && email.includes('@')) {
    const emailPrefix = email.split('@')[0].toLowerCase();
    if (normalized.length > 3 && emailPrefix.includes(normalized)) {
      score += 5;
    }
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    isValid: score >= 70,
    flags
  };
}

export function isValidRealName(name: string): boolean {
  return validateRealName(name).isValid;
}

export function formatErrorMessage(error: any, fallback: string = 'حدث خطأ ما'): string {
  const msg = error?.response?.data?.message || error?.message || fallback;
  if (Array.isArray(msg)) {
    return msg.join('\n');
  }
  return typeof msg === 'string' ? msg : fallback;
}
