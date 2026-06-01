/**
 * currencies.js — Wereldwijde valuta-database voor SwiftBridge
 *
 * Global herpositionering: volledige wereldwijde dekking (~130 valuta's),
 * van de Amerika's tot Oost-Azië. De live FX-service (/transactions/koersen)
 * levert koersen voor 160+ valuta; deze lijst bevat de metadata
 * (naam, vlag, symbool, decimals, regio) per valuta.
 *
 * STATUS (eerlijk corridor-model):
 *   'live'      = uitbetaling-corridor is geïmplementeerd in de flow
 *   'binnenkort'= koers/calculator beschikbaar, uitbetaling volgt (wachtlijst)
 *
 * `koers` is een INDICATIEVE EUR-koers (mei 2026); live FX overschrijft.
 * `landCode` is ISO 3166-1 alpha-2 (lowercase werkt voor flag-icons).
 * `decimals`: gangbare weergave (0 voor JPY/KRW/etc, 3 voor Golf-dinars).
 */

const C = (code, landCode, symbool, naam, land, koers, regio, decimals = 2, status = 'binnenkort', locale = 'en') =>
  ({ code, landCode, symbool, naam, land, koers, regio, decimals, status, locale, groep: regio });

export const VALUTAS = [
  // ══ EUROPA ══
  C('EUR', 'eu', '€',   'Euro',                 'Eurozone',            1.00,   'Europa', 2, 'live',       'nl-NL'),
  C('GBP', 'gb', '£',   'Britse Pond',          'Verenigd Koninkrijk', 0.85,   'Europa', 2, 'binnenkort', 'en-GB'),
  C('CHF', 'ch', 'CHF', 'Zwitserse Frank',      'Zwitserland',         0.96,   'Europa', 2, 'binnenkort', 'de-CH'),
  C('PLN', 'pl', 'zł',  'Poolse Zloty',         'Polen',               4.28,   'Europa', 2, 'binnenkort', 'pl-PL'),
  C('SEK', 'se', 'kr',  'Zweedse Kroon',        'Zweden',              11.40,  'Europa', 2, 'binnenkort', 'sv-SE'),
  C('NOK', 'no', 'kr',  'Noorse Kroon',         'Noorwegen',           11.80,  'Europa', 2, 'binnenkort', 'nb-NO'),
  C('DKK', 'dk', 'kr',  'Deense Kroon',         'Denemarken',          7.46,   'Europa', 2, 'binnenkort', 'da-DK'),
  C('CZK', 'cz', 'Kč',  'Tsjechische Kroon',    'Tsjechië',            25.10,  'Europa', 2, 'binnenkort', 'cs-CZ'),
  C('HUF', 'hu', 'Ft',  'Hongaarse Forint',     'Hongarije',           398.0,  'Europa', 0, 'binnenkort', 'hu-HU'),
  C('RON', 'ro', 'lei', 'Roemeense Leu',        'Roemenië',            4.98,   'Europa', 2, 'binnenkort', 'ro-RO'),
  C('BGN', 'bg', 'лв',  'Bulgaarse Lev',        'Bulgarije',           1.96,   'Europa', 2, 'binnenkort', 'bg-BG'),
  C('HRK', 'hr', 'kn',  'Kroatische Kuna',      'Kroatië',             7.53,   'Europa', 2, 'binnenkort', 'hr-HR'),
  C('RSD', 'rs', 'дин', 'Servische Dinar',      'Servië',              117.0,  'Europa', 0, 'binnenkort', 'sr-RS'),
  C('UAH', 'ua', '₴',   'Oekraïense Hryvnia',   'Oekraïne',            45.00,  'Europa', 2, 'binnenkort', 'uk-UA'),
  C('RUB', 'ru', '₽',   'Russische Roebel',     'Rusland',             98.00,  'Europa', 2, 'binnenkort', 'ru-RU'),
  C('ISK', 'is', 'kr',  'IJslandse Kroon',      'IJsland',             150.0,  'Europa', 0, 'binnenkort', 'is-IS'),
  C('MDL', 'md', 'L',   'Moldavische Leu',      'Moldavië',            19.30,  'Europa', 2, 'binnenkort', 'ro-MD'),

  // ══ CENTRAAL-AZIË (live corridors) ══
  C('AZN', 'az', '₼',    'Azerbeidzjaanse Manat', 'Azerbeidzjan',  1.84,   'Centraal-Azië', 2, 'live', 'az-AZ'),
  C('KZT', 'kz', '₸',    'Kazachse Tenge',        'Kazachstan',    535.0,  'Centraal-Azië', 0, 'live', 'kk-KZ'),
  C('UZS', 'uz', 'soʻm', 'Oezbeekse Som',         'Oezbekistan',   13600,  'Centraal-Azië', 0, 'live', 'uz-UZ'),
  C('TMT', 'tm', 'm.',   'Turkmeense Manat',      'Turkmenistan',  3.78,   'Centraal-Azië', 2, 'live', 'tk-TM'),
  C('KGS', 'kg', 'с',    'Kirgizische Som',       'Kirgizië',      94.50,  'Centraal-Azië', 0, 'live', 'ky-KG'),
  C('TJS', 'tj', 'ЅМ',   'Tadzjiekse Somoni',     'Tadzjikistan',  11.80,  'Centraal-Azië', 2, 'live', 'tg-TJ'),

  // ══ MIDDEN-OOSTEN ══
  C('TRY', 'tr', '₺',    'Turkse Lira',           'Türkiye',         36.20,  'Midden-Oosten', 0, 'live', 'tr-TR'),
  C('AED', 'ae', 'د.إ',  'VAE Dirham',            'Ver. Arab. Emiraten', 3.97, 'Midden-Oosten', 2, 'binnenkort', 'ar-AE'),
  C('SAR', 'sa', '﷼',    'Saoedische Riyal',      'Saoedi-Arabië',   4.05,   'Midden-Oosten', 2, 'binnenkort', 'ar-SA'),
  C('QAR', 'qa', 'ر.ق',  'Qatarese Riyal',        'Qatar',           3.93,   'Midden-Oosten', 2, 'binnenkort', 'ar-QA'),
  C('KWD', 'kw', 'د.ك',  'Koeweitse Dinar',       'Koeweit',         0.33,   'Midden-Oosten', 3, 'binnenkort', 'ar-KW'),
  C('BHD', 'bh', '.د.ب', 'Bahreinse Dinar',       'Bahrein',         0.41,   'Midden-Oosten', 3, 'binnenkort', 'ar-BH'),
  C('OMR', 'om', 'ر.ع.', 'Omaanse Rial',          'Oman',            0.42,   'Midden-Oosten', 3, 'binnenkort', 'ar-OM'),
  C('JOD', 'jo', 'د.ا',  'Jordaanse Dinar',       'Jordanië',        0.77,   'Midden-Oosten', 3, 'binnenkort', 'ar-JO'),
  C('ILS', 'il', '₪',    'Israëlische Shekel',    'Israël',          3.95,   'Midden-Oosten', 2, 'binnenkort', 'he-IL'),
  C('LBP', 'lb', 'ل.ل',  'Libanese Pond',         'Libanon',         97000,  'Midden-Oosten', 0, 'binnenkort', 'ar-LB'),
  C('IQD', 'iq', 'ع.د',  'Iraakse Dinar',         'Irak',            1420,   'Midden-Oosten', 0, 'binnenkort', 'ar-IQ'),
  C('IRR', 'ir', '﷼',    'Iraanse Rial',          'Iran',            45500,  'Midden-Oosten', 0, 'binnenkort', 'fa-IR'),

  // ══ ZUID-AZIË ══
  C('INR', 'in', '₹',  'Indiase Roepie',       'India',       92.50, 'Zuid-Azië', 0, 'binnenkort', 'en-IN'),
  C('PKR', 'pk', '₨',  'Pakistaanse Roepie',   'Pakistan',    301.0, 'Zuid-Azië', 0, 'binnenkort', 'ur-PK'),
  C('BDT', 'bd', '৳',  'Bengaalse Taka',       'Bangladesh',  129.0, 'Zuid-Azië', 0, 'binnenkort', 'bn-BD'),
  C('LKR', 'lk', 'Rs', 'Sri Lankaanse Roepie', 'Sri Lanka',  325.0, 'Zuid-Azië', 0, 'binnenkort', 'si-LK'),
  C('NPR', 'np', 'रू', 'Nepalese Roepie',      'Nepal',       148.0, 'Zuid-Azië', 0, 'binnenkort', 'ne-NP'),
  C('AFN', 'af', '؋',  'Afghaanse Afghani',    'Afghanistan', 77.0,  'Zuid-Azië', 0, 'binnenkort', 'fa-AF'),
  C('MVR', 'mv', '.ރ', 'Maldivische Rufiyaa',  'Malediven',   16.70, 'Zuid-Azië', 2, 'binnenkort', 'dv-MV'),

  // ══ ZUIDOOST-AZIË ══
  C('PHP', 'ph', '₱',  'Filipijnse Peso',      'Filipijnen',  62.50, 'Zuidoost-Azië', 2, 'binnenkort', 'en-PH'),
  C('IDR', 'id', 'Rp', 'Indonesische Roepiah', 'Indonesië',   17500, 'Zuidoost-Azië', 0, 'binnenkort', 'id-ID'),
  C('VND', 'vn', '₫',  'Vietnamese Dong',      'Vietnam',     27500, 'Zuidoost-Azië', 0, 'binnenkort', 'vi-VN'),
  C('THB', 'th', '฿',  'Thaise Baht',          'Thailand',    39.50, 'Zuidoost-Azië', 2, 'binnenkort', 'th-TH'),
  C('MYR', 'my', 'RM', 'Maleisische Ringgit',  'Maleisië',    5.10,  'Zuidoost-Azië', 2, 'binnenkort', 'ms-MY'),
  C('SGD', 'sg', 'S$', 'Singaporese Dollar',   'Singapore',   1.45,  'Zuidoost-Azië', 2, 'binnenkort', 'en-SG'),
  C('MMK', 'mm', 'K',  'Myanmarese Kyat',      'Myanmar',     2270,  'Zuidoost-Azië', 0, 'binnenkort', 'my-MM'),
  C('KHR', 'kh', '៛',  'Cambodjaanse Riel',    'Cambodja',    4350,  'Zuidoost-Azië', 0, 'binnenkort', 'km-KH'),
  C('LAK', 'la', '₭',  'Laotiaanse Kip',       'Laos',        23500, 'Zuidoost-Azië', 0, 'binnenkort', 'lo-LA'),

  // ══ OOST-AZIË ══
  C('CNY', 'cn', '¥',  'Chinese Yuan',         'China',       7.85,  'Oost-Azië', 2, 'binnenkort', 'zh-CN'),
  C('JPY', 'jp', '¥',  'Japanse Yen',          'Japan',       168.0, 'Oost-Azië', 0, 'binnenkort', 'ja-JP'),
  C('KRW', 'kr', '₩',  'Zuid-Koreaanse Won',   'Zuid-Korea',  1480,  'Oost-Azië', 0, 'binnenkort', 'ko-KR'),
  C('HKD', 'hk', 'HK$','Hongkong Dollar',      'Hongkong',    8.45,  'Oost-Azië', 2, 'binnenkort', 'zh-HK'),
  C('TWD', 'tw', 'NT$','Taiwanese Dollar',     'Taiwan',      34.80, 'Oost-Azië', 2, 'binnenkort', 'zh-TW'),
  C('MNT', 'mn', '₮',  'Mongoolse Tögrög',     'Mongolië',    3680,  'Oost-Azië', 0, 'binnenkort', 'mn-MN'),

  // ══ NOORD-AMERIKA ══
  C('USD', 'us', '$',  'Amerikaanse Dollar',   'Verenigde Staten', 1.08,  'Noord-Amerika', 2, 'binnenkort', 'en-US'),
  C('CAD', 'ca', 'C$', 'Canadese Dollar',      'Canada',           1.48,  'Noord-Amerika', 2, 'binnenkort', 'en-CA'),
  C('MXN', 'mx', '$',  'Mexicaanse Peso',      'Mexico',           20.80, 'Noord-Amerika', 2, 'binnenkort', 'es-MX'),

  // ══ LATIJNS-AMERIKA & CARIBISCH ══
  C('BRL', 'br', 'R$', 'Braziliaanse Real',    'Brazilië',     6.15,  'Latijns-Amerika', 2, 'binnenkort', 'pt-BR'),
  C('ARS', 'ar', '$',  'Argentijnse Peso',     'Argentinië',   1080,  'Latijns-Amerika', 2, 'binnenkort', 'es-AR'),
  C('COP', 'co', '$',  'Colombiaanse Peso',    'Colombia',     4450,  'Latijns-Amerika', 0, 'binnenkort', 'es-CO'),
  C('CLP', 'cl', '$',  'Chileense Peso',       'Chili',        1010,  'Latijns-Amerika', 0, 'binnenkort', 'es-CL'),
  C('PEN', 'pe', 'S/', 'Peruaanse Sol',        'Peru',         4.05,  'Latijns-Amerika', 2, 'binnenkort', 'es-PE'),
  C('UYU', 'uy', '$U', 'Uruguayaanse Peso',    'Uruguay',      43.50, 'Latijns-Amerika', 2, 'binnenkort', 'es-UY'),
  C('BOB', 'bo', 'Bs', 'Boliviaanse Boliviano','Bolivia',      7.45,  'Latijns-Amerika', 2, 'binnenkort', 'es-BO'),
  C('PYG', 'py', '₲',  'Paraguayaanse Guaraní','Paraguay',     8150,  'Latijns-Amerika', 0, 'binnenkort', 'es-PY'),
  C('GTQ', 'gt', 'Q',  'Guatemalteekse Quetzal','Guatemala',   8.35,  'Latijns-Amerika', 2, 'binnenkort', 'es-GT'),
  C('DOP', 'do', 'RD$','Dominicaanse Peso',    'Dominicaanse Rep.', 65.0, 'Latijns-Amerika', 2, 'binnenkort', 'es-DO'),
  C('CRC', 'cr', '₡',  'Costa Ricaanse Colón', 'Costa Rica',   555.0, 'Latijns-Amerika', 0, 'binnenkort', 'es-CR'),
  C('JMD', 'jm', 'J$', 'Jamaicaanse Dollar',   'Jamaica',      170.0, 'Latijns-Amerika', 2, 'binnenkort', 'en-JM'),

  // ══ AFRIKA ══
  C('MAD', 'ma', 'DH', 'Marokkaanse Dirham',   'Marokko',      10.95, 'Afrika', 2, 'binnenkort', 'ar-MA'),
  C('DZD', 'dz', 'دج', 'Algerijnse Dinar',     'Algerije',     145.0, 'Afrika', 2, 'binnenkort', 'ar-DZ'),
  C('TND', 'tn', 'د.ت','Tunesische Dinar',     'Tunesië',      3.38,  'Afrika', 3, 'binnenkort', 'ar-TN'),
  C('EGP', 'eg', 'E£', 'Egyptische Pond',      'Egypte',       53.50, 'Afrika', 2, 'binnenkort', 'ar-EG'),
  C('NGN', 'ng', '₦',  'Nigeriaanse Naira',    'Nigeria',      1720,  'Afrika', 0, 'binnenkort', 'en-NG'),
  C('GHS', 'gh', '₵',  'Ghanese Cedi',         'Ghana',        16.20, 'Afrika', 2, 'binnenkort', 'en-GH'),
  C('KES', 'ke', 'KSh','Keniaanse Shilling',   'Kenia',        139.0, 'Afrika', 0, 'binnenkort', 'en-KE'),
  C('TZS', 'tz', 'TSh','Tanzaniaanse Shilling','Tanzania',     2850,  'Afrika', 0, 'binnenkort', 'sw-TZ'),
  C('UGX', 'ug', 'USh','Oegandese Shilling',   'Oeganda',      4050,  'Afrika', 0, 'binnenkort', 'en-UG'),
  C('ZAR', 'za', 'R',  'Zuid-Afrikaanse Rand', 'Zuid-Afrika',  19.80, 'Afrika', 2, 'binnenkort', 'en-ZA'),
  C('ETB', 'et', 'Br', 'Ethiopische Birr',     'Ethiopië',     135.0, 'Afrika', 2, 'binnenkort', 'am-ET'),
  C('XOF', 'sn', 'CFA','West-Afrikaanse Frank','West-Afrika (CFA)', 656.0, 'Afrika', 0, 'binnenkort', 'fr-SN'),
  C('XAF', 'cm', 'FCFA','Centraal-Afrikaanse Frank','Centraal-Afrika (CFA)', 656.0, 'Afrika', 0, 'binnenkort', 'fr-CM'),
  C('RWF', 'rw', 'FRw','Rwandese Frank',       'Rwanda',       1490,  'Afrika', 0, 'binnenkort', 'rw-RW'),
  C('AOA', 'ao', 'Kz', 'Angolese Kwanza',      'Angola',       990.0, 'Afrika', 2, 'binnenkort', 'pt-AO'),
  C('MZN', 'mz', 'MT', 'Mozambikaanse Metical','Mozambique',   69.0,  'Afrika', 2, 'binnenkort', 'pt-MZ'),
  C('ZMW', 'zm', 'ZK', 'Zambiaanse Kwacha',    'Zambia',       29.50, 'Afrika', 2, 'binnenkort', 'en-ZM'),

  // ══ OCEANIË ══
  C('AUD', 'au', 'A$', 'Australische Dollar',  'Australië',    1.65,  'Oceanië', 2, 'binnenkort', 'en-AU'),
  C('NZD', 'nz', 'NZ$','Nieuw-Zeelandse Dollar','Nieuw-Zeeland',1.79, 'Oceanië', 2, 'binnenkort', 'en-NZ'),
  C('FJD', 'fj', 'FJ$','Fiji Dollar',          'Fiji',         2.45,  'Oceanië', 2, 'binnenkort', 'en-FJ'),
];

export const VALUTA_MAP = Object.fromEntries(VALUTAS.map(v => [v.code, v]));

export function getValuta(code) {
  return VALUTA_MAP[code] ?? VALUTA_MAP.TRY ?? VALUTAS[0];
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

// ── Helpers voor de wereldwijde selector ────────────────────────────────────
export const VALUTAS_LIVE = VALUTAS.filter(v => v.status === 'live');
export const VALUTAS_BINNENKORT = VALUTAS.filter(v => v.status === 'binnenkort');

// Volgorde van regio's in de selector (live-corridor-regio's eerst)
export const REGIO_VOLGORDE = [
  'Centraal-Azië', 'Midden-Oosten', 'Europa', 'Zuid-Azië', 'Zuidoost-Azië',
  'Oost-Azië', 'Afrika', 'Noord-Amerika', 'Latijns-Amerika', 'Oceanië',
];

/** Groepeer valuta's per regio, live-valuta's binnen elke regio eerst. */
export function valutasPerRegio(lijst = VALUTAS) {
  const map = {};
  for (const v of lijst) (map[v.regio] ||= []).push(v);
  return REGIO_VOLGORDE
    .filter(r => map[r]?.length)
    .map(r => ({
      regio: r,
      valutas: map[r].sort((a, b) =>
        (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1) || a.naam.localeCompare(b.naam)),
    }));
}

/** Fuzzy zoeken op code, naam of land. */
export function zoekValuta(query, lijst = VALUTAS) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return lijst;
  return lijst.filter(v =>
    v.code.toLowerCase().includes(q) ||
    v.naam.toLowerCase().includes(q) ||
    v.land.toLowerCase().includes(q),
  );
}

// Backward-compat exports (oudere componenten)
export const VALUTAS_TURKIJE = VALUTAS.filter(v => v.code === 'TRY');
export const VALUTAS_TURKS = VALUTAS.filter(v => v.regio === 'Centraal-Azië');
export const VALUTAS_WESTERS = VALUTAS.filter(v => ['EUR', 'USD', 'GBP', 'CHF'].includes(v.code));
