/**
 * geenNepReviews.test.js — bewaakt dat er nergens verzonnen klantverhalen, reviewscores
 * of levertijden in de app of op de landingspagina's staan, in geen enkele taal.
 *
 * Achtergrond (14-10-2026). De testimonials op de homepage waren al uitgezet, maar de
 * teksten zaten nog in de bundel: drie verzonnen klanten ("mijn moeder had het geld in
 * 4 minuten"), en in het Turks, Russisch en Azerbeidzjaans "4,8 — 1.240 yorum" als
 * vertrouwensregel, terwijl er nog geen enkele klant is en geen Trustpilot-pagina.
 * Daarnaast stonden er labels voor statistieken die we niet hebben (verwerkte
 * overboekingen, totaal overgemaakt, actieve gebruikers, banken, levertijd). Alleen
 * "talen" en "vaste fee" zijn echt en worden in SocialProof.jsx opgebouwd als
 * `landing_stat_${key}`.
 *
 * Terloops (zelfde ronde): de e-mailschakelaar in de meldingsvoorkeuren beloofde een
 * "maandelijkse samenvatting". Die bestaat niet: de API kent geen job of mailtemplate
 * daarvoor (alleen transactieVoltooid per overboeking).
 *
 * Wat BEWUST is toegestaan:
 * - "minuten" zonder getal in de vergelijkingstabel ("Revolut→Revolut: minuten") gaat
 *   over concurrenten, niet over ons;
 * - minuten die geen levertijd zijn (duur van het aanmaken van een account, de termijn
 *   om iDEAL af te ronden, de termijn om support te mailen), zie MINUTEN_GEEN_LEVERTIJD;
 * - de voorbeeldtabel met namen in zakelijk.html (een voorbeeld van een bulkbestand,
 *   geen klantverhaal); daar beslist Aydin nog over.
 */
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { nl } from '../i18n/nl';
import { en } from '../i18n/en';
import { tr } from '../i18n/tr';
import { ru } from '../i18n/ru';
import { az } from '../i18n/az';

const WORTEL = process.cwd();
const TALEN = { nl, en, tr, ru, az };
const TAALBESTANDEN = Object.keys(TALEN).map((code) => path.join('src', 'i18n', `${code}.js`));

function landingBestanden() {
  const map = path.join(WORTEL, 'public', 'landing');
  if (!fs.existsSync(map)) throw new Error('public/landing bestaat niet meer — pas deze test aan');
  const html = fs.readdirSync(map).filter((f) => f.endsWith('.html')).map((f) => path.join('public', 'landing', f));
  // premiumLanding.js is dezelfde landingstekst in zes talen, als JS-woordenboek.
  return [...html, path.join('src', 'i18n', 'premiumLanding.js')];
}

// Een reviewaantal: een getal met "yorum", "отзыв", "rəy" of "review" erachter ("1.240 yorum", "1 240 отзывов").
const REVIEWAANTAL = /\d[\d.,\s]*\s*(yorum|отзыв|rəy|reviews?\b|recensies?\b|Bewertungen)/iu;
const TRUSTPILOT = /trustpilot/i;
const TESTIMONIAL_SLEUTEL = /landing_testimonial_/;
// Een getal met minuten erachter, in alle talen van de landingspagina's.
const MINUTEN = /\d+\s*(minu|dakika|dk\b|минут|мин(?!\p{L})|dəqiq)/iu;

/**
 * Teksten met minuten die geen levertijd zijn. Komt er een nieuwe bij, dan moet hij
 * hier bewust worden toegevoegd, met de reden.
 */
const MINUTEN_GEEN_LEVERTIJD = new Set([
  'landing_step_account_tekst', // duur van het aanmaken van een account
  'landing_cta_subtitel', // idem
  'cta_band_sub', // idem, op de landingspagina's
  'landing_faq_koers_wijzigt_antwoord', // termijn om de iDEAL-betaling af te ronden
  'landing_faq_annuleren_antwoord', // termijn om na betaling support te mailen
]);

/** De sleutel waar de tekst op `index` bij hoort: `sleutel:'…'`, `sleutel: "…"` of `data-i18n="sleutel">…`. */
function sleutelVoor(regel, index) {
  const voor = regel.slice(0, index);
  const gevonden = [...voor.matchAll(/data-i18n="([a-z0-9_]+)"|(?:^|[\s,{])([a-z0-9_]+):\s*["']/g)];
  if (gevonden.length === 0) return null;
  const laatste = gevonden[gevonden.length - 1];
  return laatste[1] || laatste[2];
}

function vind(pad, { minutenAlleenVoorLanding }) {
  const treffers = [];
  fs.readFileSync(path.join(WORTEL, pad), 'utf8').split('\n').forEach((regel, i) => {
    // Codecommentaar ziet geen klant.
    if (/^\s*(\/\/|\*|\/\*)/.test(regel)) return;
    const waar = `${pad}:${i + 1}`;
    if (REVIEWAANTAL.test(regel)) treffers.push(`${waar} — reviewaantal`);
    if (TRUSTPILOT.test(regel)) treffers.push(`${waar} — Trustpilot`);
    if (TESTIMONIAL_SLEUTEL.test(regel)) treffers.push(`${waar} — verzonnen klantverhaal (landing_testimonial_)`);
    const m = regel.match(MINUTEN);
    if (m) {
      const sleutel = sleutelVoor(regel, m.index);
      const isLanding = !minutenAlleenVoorLanding || (sleutel || '').startsWith('landing_');
      if (isLanding && !MINUTEN_GEEN_LEVERTIJD.has(sleutel)) {
        treffers.push(`${waar} — levertijd in minuten (${sleutel || 'zonder sleutel'})`);
      }
    }
  });
  return treffers;
}

describe('geen verzonnen klantverhalen, reviews of levertijden', () => {
  test('de bewaking kijkt echt naar de taalbestanden en de landingspagina\'s', () => {
    const lijst = landingBestanden();
    // Valt een map weg of wordt hij hernoemd, dan mag deze test niet stil groen worden.
    expect(lijst).toContain(path.join('public', 'landing', 'particulier.html'));
    expect(lijst).toContain(path.join('public', 'landing', 'zakelijk.html'));
    for (const pad of TAALBESTANDEN) expect(fs.existsSync(path.join(WORTEL, pad)), pad).toBe(true);
  });

  test('de bewaking zelf herkent wat er op 14-10 stond', () => {
    expect(REVIEWAANTAL.test("landing_trust_reviews:'4,8 — 1.240 yorum',")).toBe(true);
    expect(REVIEWAANTAL.test("landing_reviews_aantal:'1 240 отзывов',")).toBe(true);
    expect(REVIEWAANTAL.test("landing_reviews_aantal:'1 240 rəy',")).toBe(true);
    expect(MINUTEN.test('annem parayı 4 dakikada aldı')).toBe(true);
    expect(MINUTEN.test('мама получила деньги за 4 минуты')).toBe(true);
    expect(MINUTEN.test('Revolut→Revolut: minuten')).toBe(false);
    // Twee sleutels op één regel: de minuten horen bij de tweede.
    const regel = '    hiw_step4_title: "x", hiw_step4_body: "in 5 minuten"';
    expect(sleutelVoor(regel, regel.match(MINUTEN).index)).toBe('hiw_step4_body');
  });

  test('de taalbestanden bevatten geen reviewaantal, Trustpilot, testimonial of levertijd in minuten', () => {
    const alles = TAALBESTANDEN.flatMap((pad) => vind(pad, { minutenAlleenVoorLanding: true }));
    expect(alles, `${alles.length} treffers:\n${alles.slice(0, 60).join('\n')}`).toEqual([]);
  });

  test('de landingspagina\'s bevatten geen reviewaantal, Trustpilot, testimonial of levertijd in minuten', () => {
    const alles = landingBestanden().flatMap((pad) => vind(pad, { minutenAlleenVoorLanding: false }));
    expect(alles, `${alles.length} treffers:\n${alles.slice(0, 60).join('\n')}`).toEqual([]);
  });

  test('het onderdeel SocialProof vraagt geen testimonial-teksten meer op', () => {
    const pad = path.join('src', 'components', 'landing', 'SocialProof.jsx');
    const bron = fs.readFileSync(path.join(WORTEL, pad), 'utf8');
    expect(bron).not.toMatch(/landing_testimonial_|landing_reviews_|TESTIMONIALS|StarRating/);
  });

  test.each(Object.keys(TALEN))('%s: alleen echte statistieken, geen review-sleutels', (code) => {
    const sleutels = Object.keys(TALEN[code]);
    // Alleen deze twee zijn echt: 5 talen en de vaste fee (SocialProof.jsx, STATS).
    expect(sleutels.filter((k) => k.startsWith('landing_stat_')).sort()).toEqual(['landing_stat_fee', 'landing_stat_talen']);
    expect(sleutels.filter((k) => /^landing_(reviews_|trust_reviews|testimonial_)/.test(k))).toEqual([]);
  });

  test.each(Object.keys(TALEN))('%s: de e-mailvoorkeur belooft geen maandelijkse samenvatting', (code) => {
    expect(TALEN[code].notif_email_uitleg).toBeTruthy();
    expect(TALEN[code].notif_email_uitleg).not.toMatch(/maand|month|aylık|месяч|aylıq/i);
  });
});
