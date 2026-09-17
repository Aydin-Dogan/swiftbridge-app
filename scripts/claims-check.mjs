#!/usr/bin/env node
/**
 * claims-check.mjs — Bewaakt de KYB-teksten ("Zakelijk SwiftBridge-profiel aanvragen")
 * op verboden claims. SwiftBridge is geen bank: geen rekening/IBAN/pas/spaar-claims,
 * geen NFC/liveness-beloftes, geen "automatisch goedgekeurd", geen "gratis", geen emoji
 * en nooit "DNB-vergunning" zonder "EMI-partner" in dezelfde tekst.
 *
 * Gebruik:
 *   node scripts/claims-check.mjs            # rapport; exit 1 bij treffers
 *   node scripts/claims-check.mjs --strict   # idem, en faalt ook als een verplichte bron ontbreekt (CI)
 *
 * Bronnen:
 *   1. kyb_*-keys (+ errors.KYB_* / errors.EMAIL_TOKEN_ONGELDIG) in src/i18n/{nl,en,tr,ru,az}.js.
 *      Een taalbestand zonder kyb_-keys wordt overgeslagen zonder te falen (WP3 levert de keys).
 *   2. public/landing/zakelijk.html: alle tekstsegmenten in KYB-context (inline woordenboek + HTML-fallback
 *      met data-i18n) — d.w.z. segmenten die "KYB" noemen of tot de aanvraag-CTA's/FAQ horen.
 *      Emoji- en DNB-vergunning-regel gelden voor het hele bestand.
 *   3. swiftbridge-api/src/services/email/templates/kyb*.js (brontekst zonder commentaar).
 *      Ontbrekende templates worden gemeld en overgeslagen.
 *
 * Contextregel: "bankrekening", "betaalrekening" en "IBAN" zijn toegestaan als ze ontkend worden of over
 * de eigen rekening van de klant gaan ("geen IBAN", "vanaf je eigen zakelijke bankrekening", "IBAN yok").
 * De overige woorden zijn altijd verboden.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STRICT = process.argv.includes('--strict');
const HIER = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(HIER, '..');
const API_ROOT = path.resolve(APP_ROOT, '..', 'swiftbridge-api');

const HARD_RE = /\b(betaalpas|spaarrekening|deposito|liveness|NFC|automatisch goedgekeurd|gratis)\b/gi;
const CONTEXT_RE = /\b(bankrekening|betaalrekening|IBAN)\b/gi;
// Negatie of eigendom vlak vóór het woord (NL/EN/TR/RU/AZ) ...
// Let op: \b is in JS ASCII-only en werkt niet naast Cyrillisch/Turkse letters; daarom Unicode-lookarounds.
const NEGATIE_VOOR_RE = /(?<![\p{L}\p{N}_])(geen|zonder|niet|no|not|without|non|own|eigen|kendi|değil|yok|нет|без|не|собствен\p{L}*|öz|yox\p{L}*|deyil)(?![\p{L}\p{N}_])[^.]{0,40}$/iu;
// ... of erna (Turks/Azerbeidzjaans zetten de ontkenning achter het zelfstandig naamwoord).
const NEGATIE_NA_RE = /^[^.]{0,25}(?<![\p{L}\p{N}_])(yok|yoxdur|değil|deyil)(?![\p{L}\p{N}_])/iu;
// Basis-symbolen die technisch Extended_Pictographic zijn maar geen emoji (copyright etc.).
const EMOJI_RE = /(?![©®™])\p{Extended_Pictographic}/u;
const DNB_RE = /DNB-vergunning/i;
const EMI_RE = /EMI-partner/i;

// Landing-keys die tot de aanvraagflow horen, ook als de tekst zelf "KYB" niet noemt.
const LANDING_KYB_KEYS = new Set([
  'z_hero_btn_account', 'z_cta_account', 'z_footer_request', 'z_trust_kyb_verified', 'z_cta_micro',
  'z_hiw2_title', 'z_hiw2_body', 'z_faq_q2', 'z_faq_a2', 'z_faq_q6', 'z_faq_a6', 'corridor_waitlist_cta',
]);

const treffers = [];
const meldingen = [];

function meld(bron, id, regel, fragment) {
  treffers.push({ bron, id, regel, fragment: String(fragment).replace(/\s+/g, ' ').slice(0, 140) });
}

/** Controleert één tekstsegment op alle regels. */
function controleerSegment(bron, id, tekst) {
  if (typeof tekst !== 'string' || !tekst) return;

  for (const m of tekst.matchAll(HARD_RE)) {
    meld(bron, id, `verboden woord "${m[1]}"`, tekst);
  }
  for (const m of tekst.matchAll(CONTEXT_RE)) {
    const voor = tekst.slice(0, m.index);
    const na = tekst.slice(m.index + m[0].length);
    const ontkend = NEGATIE_VOOR_RE.test(voor) || NEGATIE_NA_RE.test(na);
    if (!ontkend) meld(bron, id, `rekening/IBAN-claim "${m[1]}" zonder ontkenning`, tekst);
  }
  if (EMOJI_RE.test(tekst)) {
    meld(bron, id, 'emoji', tekst);
  }
  if (DNB_RE.test(tekst) && !EMI_RE.test(tekst)) {
    meld(bron, id, '"DNB-vergunning" zonder "EMI-partner" in dezelfde tekst', tekst);
  }
}

// ── 1. i18n-bestanden ────────────────────────────────────────────────────────
const TALEN = ['nl', 'en', 'tr', 'ru', 'az'];
let i18nGecontroleerd = 0;
for (const code of TALEN) {
  const bestand = path.join(APP_ROOT, 'src', 'i18n', `${code}.js`);
  if (!fs.existsSync(bestand)) { meldingen.push(`i18n ${code}: bestand ontbreekt, overgeslagen`); continue; }
  let dict;
  try {
    const mod = await import(pathToFileURL(bestand).href);
    dict = mod[code] || mod.default;
  } catch (e) {
    meldingen.push(`i18n ${code}: kan niet laden (${e.message}), overgeslagen`);
    continue;
  }
  if (!dict || typeof dict !== 'object') { meldingen.push(`i18n ${code}: geen export gevonden, overgeslagen`); continue; }

  const kybKeys = Object.keys(dict).filter((k) => k.startsWith('kyb_'));
  const errorKeys = Object.keys(dict.errors || {}).filter((k) => k.startsWith('KYB_') || k === 'EMAIL_TOKEN_ONGELDIG');
  if (kybKeys.length === 0 && errorKeys.length === 0) {
    meldingen.push(`i18n ${code}: nog geen kyb_-keys, overgeslagen`);
    continue;
  }
  for (const k of kybKeys) controleerSegment(`i18n/${code}.js`, k, dict[k]);
  for (const k of errorKeys) controleerSegment(`i18n/${code}.js`, `errors.${k}`, dict.errors[k]);
  i18nGecontroleerd++;
  meldingen.push(`i18n ${code}: ${kybKeys.length + errorKeys.length} keys gecontroleerd`);
}

// ── 2. Landing zakelijk.html ────────────────────────────────────────────────
function decodeer(html) {
  return html
    .replace(/&middot;/g, '·').replace(/&rarr;/g, '→').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, ' ');
}

const landingPad = path.join(APP_ROOT, 'public', 'landing', 'zakelijk.html');
if (!fs.existsSync(landingPad)) {
  meldingen.push('landing: public/landing/zakelijk.html ontbreekt');
  if (STRICT) treffers.push({ bron: 'landing', id: '-', regel: 'verplichte bron ontbreekt', fragment: landingPad });
} else {
  const html = fs.readFileSync(landingPad, 'utf8');
  let segmenten = 0;

  // Inline woordenboek: key: "waarde" (ook meerdere per regel). Taalcode = laatst geziene "  xx: {"-blok.
  let taal = '?';
  const regels = html.split('\n');
  regels.forEach((regel, i) => {
    const blok = regel.match(/^\s{2}([a-z]{2}):\s*\{\s*$/);
    if (blok) taal = blok[1];
    for (const m of regel.matchAll(/(?:^|[\s,{])([a-z0-9_]+):\s*"((?:[^"\\]|\\.)*)"/g)) {
      const [, key, ruw] = m;
      const waarde = ruw.replace(/\\"/g, '"').replace(/\\n/g, ' ');
      const inScope = LANDING_KYB_KEYS.has(key) || /\bKYB\b/i.test(waarde);
      if (inScope) { controleerSegment('landing/zakelijk.html', `${taal}.${key} (r.${i + 1})`, waarde); segmenten++; }
      // Emoji + DNB-regel gelden voor elk segment van het hele bestand.
      if (!inScope) {
        if (EMOJI_RE.test(waarde)) meld('landing/zakelijk.html', `${taal}.${key} (r.${i + 1})`, 'emoji', waarde);
        if (DNB_RE.test(waarde) && !EMI_RE.test(waarde)) meld('landing/zakelijk.html', `${taal}.${key} (r.${i + 1})`, '"DNB-vergunning" zonder "EMI-partner"', waarde);
      }
    }
  });

  // HTML-fallbacks: <el ... data-i18n="key" ...>tekst</el>
  for (const m of html.matchAll(/<[a-z0-9]+[^>]*\bdata-i18n="([a-z0-9_]+)"[^>]*>([^<]*)</g)) {
    const [, key, ruw] = m;
    const tekst = decodeer(ruw).trim();
    if (!tekst) continue;
    const regelNr = html.slice(0, m.index).split('\n').length;
    const inScope = LANDING_KYB_KEYS.has(key) || /\bKYB\b/i.test(tekst);
    if (inScope) { controleerSegment('landing/zakelijk.html', `html.${key} (r.${regelNr})`, tekst); segmenten++; }
    else {
      if (EMOJI_RE.test(tekst)) meld('landing/zakelijk.html', `html.${key} (r.${regelNr})`, 'emoji', tekst);
      if (DNB_RE.test(tekst) && !EMI_RE.test(tekst)) meld('landing/zakelijk.html', `html.${key} (r.${regelNr})`, '"DNB-vergunning" zonder "EMI-partner"', tekst);
    }
  }

  // CTA's naar de aanvraagflow moeten naar de zakelijke registratie wijzen (contract sectie 9, WP4).
  for (const key of ['z_hero_btn_account', 'z_cta_account', 'z_footer_request']) {
    const el = html.match(new RegExp(`<a[^>]*data-i18n="${key}"[^>]*>`));
    if (!el) { meldingen.push(`landing: element ${key} niet gevonden`); continue; }
    const href = (el[0].match(/href="([^"]*)"/) || [])[1] || '';
    if (!/type=zakelijk/.test(href) || !/next=\/app\/zakelijk-aanvraag/.test(href)) {
      meld('landing/zakelijk.html', key, 'CTA wijst niet naar /login?tab=register&type=zakelijk&next=/app/zakelijk-aanvraag', href);
    }
  }
  meldingen.push(`landing: ${segmenten} KYB-segmenten gecontroleerd (emoji/DNB-regel op hele bestand)`);
}

// ── 3. API-mailtemplates kyb*.js ────────────────────────────────────────────
const templateMap = path.join(API_ROOT, 'src', 'services', 'email', 'templates');
let templates = [];
if (fs.existsSync(templateMap)) {
  templates = fs.readdirSync(templateMap).filter((f) => /^kyb.*\.js$/i.test(f));
}
if (templates.length === 0) {
  meldingen.push('mailtemplates: nog geen kyb*.js gevonden, overgeslagen');
} else {
  for (const bestand of templates) {
    let bron;
    try {
      bron = fs.readFileSync(path.join(templateMap, bestand), 'utf8');
    } catch (e) {
      meldingen.push(`mailtemplates: ${bestand} niet leesbaar (${e.message})`);
      if (STRICT) treffers.push({ bron: `templates/${bestand}`, id: '-', regel: 'niet leesbaar', fragment: e.message });
      continue;
    }
    // Commentaar strippen zodat toelichtingen ("geen IBAN in deze mail") niet meetellen.
    const zonderCommentaar = bron.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
    // DNB-regel over het hele bestand (de toezichtzin staat in de footer, de vergunning-ontkenning in de tekst).
    if (DNB_RE.test(zonderCommentaar) && !EMI_RE.test(zonderCommentaar)) {
      meld(`templates/${bestand}`, '-', '"DNB-vergunning" zonder "EMI-partner"', bestand);
    }
    zonderCommentaar.split('\n').forEach((regel, i) => {
      // Emoji + verboden woorden per regel (contextvenster valt binnen de regel).
      const zonderEntities = decodeer(regel);
      for (const m of zonderEntities.matchAll(HARD_RE)) meld(`templates/${bestand}`, `r.${i + 1}`, `verboden woord "${m[1]}"`, regel);
      for (const m of zonderEntities.matchAll(CONTEXT_RE)) {
        const voor = zonderEntities.slice(0, m.index);
        const na = zonderEntities.slice(m.index + m[0].length);
        if (!(NEGATIE_VOOR_RE.test(voor) || NEGATIE_NA_RE.test(na))) {
          meld(`templates/${bestand}`, `r.${i + 1}`, `rekening/IBAN-claim "${m[1]}" zonder ontkenning`, regel);
        }
      }
      if (EMOJI_RE.test(zonderEntities)) meld(`templates/${bestand}`, `r.${i + 1}`, 'emoji', regel);
    });
  }
  meldingen.push(`mailtemplates: ${templates.length} bestand(en) gecontroleerd (${templates.join(', ')})`);
}

// ── Rapport ─────────────────────────────────────────────────────────────────
console.log(`\nClaims-check KYB (${STRICT ? 'strict' : 'rapport'})\n`);
for (const m of meldingen) console.log(`  - ${m}`);
console.log();

if (treffers.length === 0) {
  console.log(`OK: geen verboden claims gevonden (${i18nGecontroleerd} taalbestand(en), landing, ${templates.length} template(s)).\n`);
  process.exit(0);
}

console.log(`${treffers.length} treffer(s):\n`);
for (const t of treffers) {
  console.log(`  [${t.bron}] ${t.id}: ${t.regel}`);
  console.log(`      "${t.fragment}"`);
}
console.log();
process.exit(1);
