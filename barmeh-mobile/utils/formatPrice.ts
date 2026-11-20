import {
  Currency,
  RATES_VS_USD,
  CURRENCY_SYMBOL_AR,
  CURRENCY_SYMBOL_EN,
  SECONDARY_CURRENCY,
} from '../constants/currency';

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
): number {
  if (from === to) return amount;
  const inUsd = amount / RATES_VS_USD[from];
  return inUsd * RATES_VS_USD[to];
}

function roundForDisplay(amount: number, currency: Currency): number {
  if (currency === 'SYP' && amount >= 10000) {
    return Math.round(amount / 1000) * 1000;
  }
  if (currency === 'TRY' && amount >= 1000) {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

export function getCurrencySymbol(currency: Currency, language: string): string {
  const isAr = language === 'ar';
  return (isAr ? CURRENCY_SYMBOL_AR : CURRENCY_SYMBOL_EN)[currency] || currency;
}

export function formatSingle(
  amount: number,
  currency: Currency,
  language: string,
): string {
  const rounded = roundForDisplay(amount, currency);
  const symbol = getCurrencySymbol(currency, language);
  return `${rounded.toLocaleString()} ${symbol}`;
}

export interface DualPriceDisplay {
  primary: string;
  secondary: string;
}

export function formatDual(
  amount: number,
  currency: Currency,
  language: string,
): DualPriceDisplay {
  const primary = formatSingle(amount, currency, language);
  const secondaryCurrency = SECONDARY_CURRENCY[currency];
  const converted = convertCurrency(amount, currency, secondaryCurrency);
  const secondary = `≈ ${formatSingle(converted, secondaryCurrency, language)}`;
  return { primary, secondary };
}
