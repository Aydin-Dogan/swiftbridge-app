/**
 * stapHelpers.js — kleine, pure hulpfuncties voor de KYB-stappen.
 */

const TUSSENVOEGSELS = new Set(['van', 'de', 'der', 'den', 'het', 'ten', 'ter', 'te', 'op', 'in', "'t", 'la', 'le', 'du', 'da', 'von', 'el', 'al']);

/** Splitst "Voornaam van der Achternaam" in voornamen / tussenvoegsel / achternaam. */
export function splitsNaam(naam) {
  const delen = String(naam || '').trim().split(/\s+/).filter(Boolean);
  if (delen.length === 0) return { voornamen: '', tussenvoegsel: '', achternaam: '' };
  if (delen.length === 1) return { voornamen: delen[0], tussenvoegsel: '', achternaam: '' };
  const voornamen = [delen[0]];
  let i = 1;
  // Meerdere voornamen: alles tot het eerste tussenvoegsel of de laatste twee tokens
  while (i < delen.length - 1 && !TUSSENVOEGSELS.has(delen[i].toLowerCase()) && delen.length - i > 2) {
    voornamen.push(delen[i]);
    i += 1;
  }
  const tussen = [];
  while (i < delen.length - 1 && TUSSENVOEGSELS.has(delen[i].toLowerCase())) {
    tussen.push(delen[i].toLowerCase());
    i += 1;
  }
  return { voornamen: voornamen.join(' '), tussenvoegsel: tussen.join(' '), achternaam: delen.slice(i).join(' ') };
}

/** Normaliseert een mobiel nummer naar E.164 (+31612345678). Onbekend formaat -> ongewijzigd. */
export function naarE164(invoer, landcode = '31') {
  let s = String(invoer || '').replace(/[\s\-().]/g, '');
  if (!s) return '';
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  else if (s.startsWith('0')) s = `+${landcode}${s.slice(1)}`;
  else if (!s.startsWith('+')) s = `+${s}`;
  return s;
}

export const E164_RE = /^\+[1-9]\d{6,14}$/;

/** Voegt https:// toe als het schema ontbreekt. */
export function naarUrl(invoer) {
  const s = String(invoer || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export function isUrl(s) {
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Verwijdert lege waarden (undefined, null, '') voor een gedeeltelijke PUT,
 * zodat `schema.partial()` alleen ingevulde velden valideert. Arrays en
 * booleans blijven staan; geneste objecten worden recursief opgeschoond.
 */
export function compactBody(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') return body;
  const uit = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      const sub = compactBody(v);
      if (Object.keys(sub).length > 0) uit[k] = sub;
      continue;
    }
    uit[k] = v;
  }
  return uit;
}

/** Datumnotatie voor de klant (nl-NL, bv. "21 september 2026"). */
export function fmtDatum(waarde, taal = 'nl') {
  if (!waarde) return '';
  const d = typeof waarde === 'number' || /^\d+$/.test(String(waarde)) ? new Date(Number(waarde)) : new Date(waarde);
  if (Number.isNaN(d.getTime())) return String(waarde);
  const locale = { nl: 'nl-NL', en: 'en-GB', tr: 'tr-TR', ru: 'ru-RU', az: 'az-AZ' }[taal] || 'nl-NL';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Detecteert een telefoon/tablet (grove aanraking + smal scherm). */
export function isTelefoon() {
  if (typeof window === 'undefined') return false;
  try {
    return !!(window.matchMedia && window.matchMedia('(pointer:coarse)').matches) && window.innerWidth < 768;
  } catch {
    return false;
  }
}
