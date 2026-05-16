/**
 * currencies.js — Ondersteunde valuta's voor SwiftBridge
 * Indicatieve EUR-koersen (mei 2026). Voor live trading vervang door ECB/exchangerate-api.
 */

export const VALUTAS = [
  // Turkije
  { code: 'TRY', symbool: '₺',  vlag: '🇹🇷', naam: 'Turkse Lira',          land: 'Turkije',      koers: 36.20,  locale: 'tr-TR', decimals: 0, groep: 'turkije' },
  // Turkstalige landen
  { code: 'AZN', symbool: '₼',  vlag: '🇦🇿', naam: 'Azerbeidzjaanse Manat', land: 'Azerbeidzjan', koers: 1.84,   locale: 'az-AZ', decimals: 2, groep: 'turks' },
  { code: 'KZT', symbool: '₸',  vlag: '🇰🇿', naam: 'Kazachse Tenge',         land: 'Kazachstan',   koers: 535.00, locale: 'kk-KZ', decimals: 0, groep: 'turks' },
  { code: 'UZS', symbool: 'soʻm', vlag: '🇺🇿', naam: 'Oezbeekse Som',       land: 'Oezbekistan',  koers: 13600,  locale: 'uz-UZ', decimals: 0, groep: 'turks' },
  { code: 'TMT', symbool: 'm.', vlag: '🇹🇲', naam: 'Turkmeense Manat',       land: 'Turkmenistan', koers: 3.78,   locale: 'tk-TM', decimals: 2, groep: 'turks' },
  { code: 'KGS', symbool: 'с',  vlag: '🇰🇬', naam: 'Kirgizische Som',        land: 'Kirgizië',     koers: 94.50,  locale: 'ky-KG', decimals: 0, groep: 'turks' },
  // Westerse valuta's
  { code: 'USD', symbool: '$',  vlag: '🇺🇸', naam: 'Amerikaanse Dollar',     land: 'VS',           koers: 1.08,   locale: 'en-US', decimals: 2, groep: 'westers' },
  { code: 'GBP', symbool: '£',  vlag: '🇬🇧', naam: 'Britse Pond',            land: 'VK',           koers: 0.85,   locale: 'en-GB', decimals: 2, groep: 'westers' },
  { code: 'EUR', symbool: '€',  vlag: '🇪🇺', naam: 'Euro',                   land: 'EU',           koers: 1.00,   locale: 'nl-NL', decimals: 2, groep: 'westers' },
  { code: 'MAD', symbool: 'DH', vlag: '🇲🇦', naam: 'Marokkaanse Dirham',     land: 'Marokko',      koers: 10.95,  locale: 'ar-MA', decimals: 2, groep: 'westers' },
];

export const VALUTA_MAP = Object.fromEntries(VALUTAS.map(v => [v.code, v]));

export function getValuta(code) {
  return VALUTA_MAP[code] ?? VALUTAS[0];
}

export function formatBedrag(bedrag, code) {
  const v = getValuta(code);
  const fmt = bedrag.toLocaleString(v.locale, {
    minimumFractionDigits: v.decimals,
    maximumFractionDigits: v.decimals,
  });
  return `${v.symbool}${fmt}`;
}

export function berekenOntvangen(eurBedrag, code, marge = 0.0225) {
  const v = getValuta(code);
  return Math.max(0, Number(eurBedrag) || 0) * v.koers * (1 - marge);
}

export const VALUTAS_TURKIJE = VALUTAS.filter(v => v.groep === 'turkije');
export const VALUTAS_TURKS = VALUTAS.filter(v => v.groep === 'turks');
export const VALUTAS_WESTERS = VALUTAS.filter(v => v.groep === 'westers');
