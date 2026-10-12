/**
 * geenLiveClaim.test.js — bewaakt dat de website niets belooft wat (nog) niet waar is.
 *
 * Achtergrond (12-10-2026). De live homepage zei op 11 plekken "Onder toezicht van
 * DNB via onze EMI-partner", terwijl er nog geen EMI-partner is (AGENT_GEREGISTREERD
 * staat op false). Daarnaast: "binnen 5 minuten op de rekening" terwijl er nog geen
 * uitbetaalpartner is, iDIN als werkende identificatie terwijl de koppeling alleen
 * als proefversie draait (de controle gebeurt met de hand), "Gratis account openen"
 * (het woord gratis gebruiken we nooit), "45+ landen" en keurmerken als
 * "Wwft-conform" die niet bestaan. Banken en partners die wij per mail schreven dat
 * wij geen vergunning hebben, zagen op de site het tegendeel.
 *
 * geenBankclaim.test.js keek naar bankvergelijkingen en een al voltooide
 * inschrijving, niet naar deze claims; daarom deze aparte bewaking over ALLE
 * klantzichtbare bestanden, in alle talen.
 */
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const WORTEL = process.cwd();

// Werk van een andere klus (nooit meecommitten) en interne beheerschermen tellen niet mee.
// De juridische documenten (voorwaarden, privacy, AML) hebben een eigen versiebeheer
// (src/content/juridisch/meta.js); hun correctie volgt als nieuwe versie, niet in
// deze ronde. Zie OPEN_PUNTEN.md.
const UITGESLOTEN = [
  /src[\\/]components[\\/]formulier[\\/]/,
  /src[\\/]components[\\/]KYCFlow\.jsx$/,
  /src[\\/]components[\\/]admin[\\/]/,
  /src[\\/]intern[\\/]/,
  /src[\\/]pages[\\/](AlgemeneVoorwaarden|Privacybeleid|AMLBeleid)\.jsx$/,
  /\.test\.[jt]sx?$/,
];
// De iDIN-KNOP in het identiteitsproces zelf (en zijn foutmeldingen) blijft tot het
// besluit over dat proces: in productie weigert de API de proefversie, er wordt dus
// niemand onterecht goedgekeurd. Uitleg en reclame over iDIN mogen nergens meer.
const IDIN_FUNCTIONEEL_BESTAND = /src[\\/]components[\\/](Profiel\.jsx|onboarding[\\/]Stap2KYC\.jsx|kyb[\\/]StapIdentiteit\.jsx|kyc[\\/]DocumentUploadFlow\.jsx)$/;
const IDIN_FUNCTIONELE_SLEUTEL = /^\s*(IDIN_[A-Z_]+|onb_kyc_[a-z0-9_]+|kyc_fallback_[a-z0-9_]+|kyb_id_idin_[a-z0-9_]+|gdpr_modal_li_kyc)\s*:/;

function bestanden() {
  const lijst = ['index.html', 'public/og-image.svg'];
  const loop = (map, filter) => {
    const vol = path.join(WORTEL, map);
    if (!fs.existsSync(vol)) throw new Error(`${map} bestaat niet meer — pas deze test aan`);
    for (const x of fs.readdirSync(vol, { withFileTypes: true })) {
      const rel = path.join(map, x.name);
      if (x.isDirectory()) loop(rel, filter);
      else if (filter.test(x.name)) lijst.push(rel);
    }
  };
  loop('public', /\.html$/);
  loop('src/i18n', /\.js$/);
  loop('src/pages', /\.jsx$/);
  loop('src/components', /\.jsx$/);
  return lijst.filter((p) => !UITGESLOTEN.some((u) => u.test(p)));
}

const CLAIMS = [
  { soort: 'toezicht via een partner die er nog niet is', re: /onze EMI-partner|geregistreerde EMI-partner|DNB-toezicht via|Onder DNB-toezicht|Onder toezicht van DNB|our EMI partner|registered EMI partner|DNB supervision via|under DNB supervision/i },
  { soort: '"gereguleerd" als keurmerk', re: /\bgereguleerd\b|\bRegulated\b/ },
  // (?<!\d): "15 minuten" (geldigheid van een QR-link of koers) is geen levertijd.
  { soort: 'snelheidsbelofte', re: /binnen 5 minuten|doorgaans binnen|<\s*5\s*min|within 5 minutes|under 5 minutes|(?<!\d)5 dakika|(?<!\d)5 минут|(?<!\d)5 dəqiqə/i },
  { soort: '"gratis"', re: /\bgratis\b|free account|ücretsiz|бесплатн|\bpulsuz\b/i },
  { soort: 'landen of banken die niet geregeld zijn', re: /45\+\s*(landen|countries|ülke|стран|ölkə)|Centraal-Aziatische banken|100\+ Turkse banken/i },
  { soort: 'keurmerk dat niet bestaat', re: /Wwft-conform|Wwft compliance|Wwft compliant|Wwft uyumlu/i },
  // Varianten die op 12-10 in de andere talen (en, tr, de, fr, ar) en buiten de eerste zoekslag stonden.
  { soort: 'toezicht via een partner die er nog niet is (andere talen)', re: /gelicentieerde EMI-partner|Supervised by DNB|operates via a registered EMI partner|via an authorised EMI partner|Strict supervision|EMI ortağımız|EMI ortağı ile DNB|Kayıtlı EMI ortağı|DNB denetimi altında|über unseren EMI-Partner|DNB-Aufsicht via|notre partenaire EMI|Supervision DNB via|عبر شريكنا|خاضع للرقابة/i },
  { soort: '"gereguleerd" als keurmerk (andere talen)', re: /\bDüzenlenmiş\b|Hollanda'da düzenlenmiş|\bReguliert\b|\bRéglementé\b/ },
  { soort: 'snelheidsbelofte (andere talen)', re: /5 dakikadan kısa|genellikle 5 dakika|<5 dk|&lt;5 dk|&lt;\s*5\s*min|sneller dan de bank|faster than the bank|snellere uitbetaling|faster payout|daha hızlı ödeme|schnellere Auszahlung|versement plus rapide|دفع أسرع/i },
  { soort: '"gratis" (andere talen)', re: /\bfor free\b|free to download|kostenlos|gratuit|مجاني/i },
  { soort: 'limiet die niet bestaat', re: /25\.000 per transac|25,000 per transac|25\.000\\?'e kadar|до €25\.000|€25\.000-ə/i },
];

function vind(pad) {
  const treffers = [];
  fs.readFileSync(path.join(WORTEL, pad), 'utf8').split('\n').forEach((regel, i) => {
    // Codecommentaar ziet geen klant.
    if (/^\s*(\/\/|\*|\/\*)/.test(regel)) return;
    for (const c of CLAIMS) if (c.re.test(regel)) treffers.push(`${pad}:${i + 1} — ${c.soort}`);
    if (!IDIN_FUNCTIONEEL_BESTAND.test(pad) && !IDIN_FUNCTIONELE_SLEUTEL.test(regel) && /\biDIN\b/.test(regel)) {
      treffers.push(`${pad}:${i + 1} — iDIN als werkende identificatie`);
    }
  });
  return treffers;
}

describe('de website belooft niets wat nog niet waar is', () => {
  test('AGENT_GEREGISTREERD staat nog op false — deze bewaking hangt daarvan af', async () => {
    const meta = await import('../content/juridisch/meta');
    expect(meta.AGENT_GEREGISTREERD).toBe(false);
  });

  test('de bewaking kijkt echt naar de klantzichtbare bestanden', () => {
    const lijst = bestanden();
    // Valt een map weg of wordt hij hernoemd, dan mag deze test niet stil groen worden.
    expect(lijst).toContain('index.html');
    expect(lijst).toContain(path.join('public', 'landing', 'particulier.html'));
    expect(lijst).toContain(path.join('src', 'i18n', 'tr.js'));
    expect(lijst.length).toBeGreaterThan(40);
  });

  test('geen enkele klantzichtbare tekst bevat zo\'n claim', () => {
    const alles = bestanden().flatMap(vind);
    expect(alles, `${alles.length} claims:\n${alles.slice(0, 60).join('\n')}`).toEqual([]);
  });
});
