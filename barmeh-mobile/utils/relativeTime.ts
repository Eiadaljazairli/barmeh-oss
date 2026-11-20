import { formatDistanceToNowStrict } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

export function formatRelativeTime(
  isoString: string | undefined | null,
  language: 'ar' | 'en' | string,
): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';

  const locale = language === 'ar' ? arSA : enUS;
  return formatDistanceToNowStrict(d, { addSuffix: true, locale });
}
