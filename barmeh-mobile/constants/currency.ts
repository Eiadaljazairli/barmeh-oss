export type Currency = 'SYP' | 'USD' | 'TRY' | 'EUR';

export const RATES_VS_USD: Record<Currency, number> = {
  USD: 1,
  SYP: 13000,
  TRY: 32,
  EUR: 0.92,
};

export const CURRENCY_SYMBOL_AR: Record<Currency, string> = {
  SYP: 'ل.س',
  USD: '$',
  TRY: '₺',
  EUR: '€',
};

export const CURRENCY_SYMBOL_EN: Record<Currency, string> = {
  SYP: 'SYP',
  USD: '$',
  TRY: '₺',
  EUR: '€',
};

export const SECONDARY_CURRENCY: Record<Currency, Currency> = {
  SYP: 'USD',
  USD: 'SYP',
  TRY: 'SYP',
  EUR: 'SYP',
};
