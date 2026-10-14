/**
 * pricing-consistency.mjs — Bewaakt dat de teksten in alle vijf de talen het
 * HUIDIGE prijsmodel noemen, en geen ander.
 *
 * Het model komt uit src/services/kosten.js; dit script leest het daar, dus bij
 * een besluit over de prijs gaat de maatstaf vanzelf mee:
 *   - vaste fee EUR 4,95 per overboeking
 *   - transparante koersmarge per ledenniveau: 1,2 / 1,0 / 0,8 / 0,6%
 *   - minimaal EUR 50, maximaal EUR 5.000 per overboeking
 *   - welkomstactie: eerste overboeking t/m EUR 800 zonder vaste kosten
 *
 * Een tekst wordt afgekeurd als hij
 *   vaste-fee-bedrag        een ander bedrag dan 4,95 als vaste fee noemt ("vaste fee van €1,99")
 *   bedrag-per-overboeking  een bedrag "per overboeking" noemt dat geen fee of limiet is ("€1,99 per overboeking")
 *   marge-percentage        in een zin over de koersmarge een ander percentage noemt dan de vier niveaus
 *   verborgen-marge         verborgen kosten of een verborgen marge noemt zonder die te ontkennen
 *   gratis                  de overboeking gratis noemt; er wordt altijd koersmarge ingehouden
 *   welkomst-bedrag         in een zin over de eerste overboeking zonder vaste kosten een ander bedrag
 *                           noemt dan 800 euro (de grens) of 4,95 euro (de fee die vervalt)
 *
 * Tot 14-10-2026 verbood dit script de woorden "vaste fee", "sabit ücret" en
 * "%1,2 kur", omdat die bij het oude flat-fee-model hoorden. Het huidige model
 * gebruikt precies die woorden, dus het stond in CI rood op correcte teksten.
 * Nu kijkt het naar de bedragen en percentages zelf. De zelftest staat in
 * src/test/pricingConsistency.test.js.
 *
 * Gebruik:
 *   node scripts/pricing-consistency.mjs            # rapport
 *   node scripts/pricing-consistency.mjs --strict   # idem, en exit 1 bij treffers (CI)
 *
 * Geen hashbang bovenaan: met core.autocrlf staat het bestand op Windows met
 * CRLF op schijf, en dan breekt "#!...\r\n" het importeren in vitest af met
 * "Invalid or unexpected token". Het script wordt altijd via node aangeroepen.
 *
 * Woordgrenzen: \b is in JavaScript ASCII-only en werkt niet naast Turkse of
 * Cyrillische letters (zie src/test/welkomstactieClaims.test.js). Daarom staan
 * hier lookarounds op \p{L} met de u-vlag.
 */

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FEE_VAST, MIN_BEDRAG, MAX_BEDRAG, FX_MARGE_NIVEAUS, WELKOMST_DEAL_MAX } from '../src/services/kosten.js';
import { nl } from '../src/i18n/nl.js';
import { en } from '../src/i18n/en.js';
import { tr } from '../src/i18n/tr.js';
import { ru } from '../src/i18n/ru.js';
import { az } from '../src/i18n/az.js';

const TALEN = { nl, en, tr, ru, az };

const rond = (n) => Math.round(n * 100) / 100;
const MARGES_PCT = Object.values(FX_MARGE_NIVEAUS).map((m) => rond(m * 100));
const BEDRAGEN_PER_OVERBOEKING = [FEE_VAST, MIN_BEDRAG, MAX_BEDRAG];

// --- Bouwstenen --------------------------------------------------------------

// 4,95 / 4.95 / 5.000 / 5,000 / 5 000. Duizendtallen hebben precies drie cijfers;
// \s dekt ook de (smalle) harde spatie die het Russisch tussen duizendtallen zet.
const GETAL = String.raw`\d+(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?`;
const BEDRAG_RE = new RegExp(
  String.raw`(?:€|(?<!\p{L})EUR)\s?(${GETAL})|(?<![\p{L}\p{N}.,])(${GETAL})\s?(?:€|(?:EUR|euro)(?!\p{L}))`,
  'giu',
);
// Turks zet het procentteken vóór het getal (%1,2), de andere talen erachter.
const PROCENT_RE = /(?<![\p{L}\p{N}])%\s?(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s?%/gu;

// Woorden die een bedrag tot vaste fee maken als ze er direct naast staan.
const VASTE_FEE = [
  // nl
  String.raw`vaste\s+(?:transactie|service)?(?:fee|kosten)`, String.raw`vaste?\s+tarief`,
  String.raw`(?:transactie|service)?fees?`, String.raw`(?:service|transactie)kosten`, String.raw`vaste?`,
  // en
  String.raw`(?:fixed|flat)(?:\s+(?:transaction|service))?\s+(?:fee|charge|price)`, String.raw`set\s+amount`,
  String.raw`(?:service|transaction)\s+fee`, String.raw`fixed`, String.raw`flat`,
  // tr (sabit ook az)
  String.raw`sabit\s+(?:işlem\s+)?ücret\p{L}*`, String.raw`(?:(?:işlem|hizmet)\s+)?ücret\p{L}*`,
  String.raw`değişmeyen\s+(?:bir\s+)?bedel\p{L}*`, String.raw`sabit`,
  // ru
  String.raw`фиксированн\p{L}*(?:\s+(?:комисси|плат|сбор|сумм)\p{L}*)?`, String.raw`комисси\p{L}*`,
  String.raw`неизменн\p{L}*\s+сумм\p{L}*`, String.raw`фикс`,
  // az
  String.raw`sabit\s+(?:əməliyyat\s+)?(?:komissiya|haqq)\p{L}*`, String.raw`(?:əməliyyat|xidmət)\s+(?:komissiya|haqq)\p{L}*`,
  String.raw`komissiya\p{L}*`, String.raw`dəyişməz\s+məbləğ\p{L}*`,
].join('|');

const PER_OVERBOEKING = String.raw`per\s+(?:overboeking|transactie|transfer|transaction)|за\s+(?:один\s+|каждый\s+)?перевод|(?:transfer|köçürmə)\s+başına`;

// Fee-woord, dan hooguit een paar verbindingswoorden, dan het bedrag: "vaste fee van €4,95", "Fee: €4,95".
const FEE_ERVOOR_RE = new RegExp(
  String.raw`(?<!\p{L})(?:${VASTE_FEE})(?:\s+(?:${PER_OVERBOEKING}))?\s*:?\s*`
  + String.raw`(?:(?:van|of|is|bedraagt|à|slechts|only|just|в\s+размере|размером|всего)\s+){0,2}(?:(?:ca\.?|~|±)\s*)?$`,
  'iu',
);
// Bedrag, dan het fee-woord: "€4,95 vast", "€4,95 sabit ücret", "EUR 4,95 tutarında değişmeyen bir bedel".
const FEE_ERNA_RE = new RegExp(String.raw`^\s*(?:(?:tutarında|məbləğində)\s+)?(?:${VASTE_FEE})(?!\p{L})`, 'iu');

const PER_OVERBOEKING_ERNA_RE = new RegExp(String.raw`^\s*(?:${PER_OVERBOEKING})(?!\p{L})`, 'iu');
const PER_OVERBOEKING_ERVOOR_RE = /(?<!\p{L})(?:(?:transfer|köçürmə)\s+başına|hər\s+köçürmə\s+üçün)\s*:?\s*$/iu;

const MARGE_RE = /marge|margin|marj|марж|наценк|надбавк|markup|koersopslag|kur\s+farkı/iu;

const VERBORGEN_RE = /(?<!\p{L})(?:verborgen|verstopt\p{L}*|hidden|concealed|gizli(?!\p{L})|скрыт\p{L}*)/giu;
const KOSTEN = String.raw`(?:kosten|marge|opslag|toeslag|fees?(?!\p{L})|cost|charge|margin|markup|maliyet|masraf|ücret|marj|komisyon|плат[её]ж|расход|комисси|марж|наценк|надбавк|сбор|xərc|komissiya|haqq|ödəniş)`;
// "verborgen FX-marges", "gizli bir marj", "hidden exchange-rate margin"
const KOSTEN_ERNA_RE = new RegExp(String.raw`^\s+(?:[\p{L}-]+\s+){0,2}?[\p{L}-]*?${KOSTEN}`, 'iu');
// "de marge zit verborgen", "the margin is hidden", "наценка скрыта"
const KOSTEN_ERVOOR_RE = new RegExp(String.raw`${KOSTEN}[\p{L}-]*\s+(?:[\p{L}-]+\s+){0,3}$`, 'iu');
// Ontkenning ervoor, zonder "maar"/"but" ertussen: "geen verborgen kosten", "Без подписки и скрытых расходов".
const ONTKENNING_ERVOOR_RE = new RegExp(
  String.raw`(?<!\p{L})(?:geen|zonder|niet|nooit|nergens|no|not|without|never|zero|nowhere|hiçbir|без|никаких|нет|ни|не|heç\s+bir)(?!\p{L})`
  + String.raw`(?:(?!(?<!\p{L})(?:maar|wel|but|however|ama|fakat|ancak|но|однако|amma|lakin)(?!\p{L}))[^])*$`,
  'iu',
);
// Turks en Azerbeidzjaans zetten de ontkenning erachter: "gizli maliyet yok", "gizli xərc yoxdur".
const ONTKENNING_ERNA_RE = /^[^.;]{0,30}?(?<!\p{L})(?:yok|yoktur|yoxdur|yox|olmadan|değil|değildir|deyil|deyildir)(?!\p{L})/iu;

const GRATIS_RE = [
  /(?<!\p{L})gratis(?!\p{L})/iu,
  /(?<!\p{L})kosteloos/iu,
  /(?<!\p{L})(?:zonder|geen)\s+kosten(?!\p{L})/iu,
  /(?<!\p{L})(?<!feel\s+)free(?!\p{L})/iu,
  /(?<!\p{L})(?:no|zero)\s+(?:fees?|costs?|charges?)(?!\p{L})/iu,
  /(?<!\p{L})(?:ücretsiz|bedava|parasız|masrafsız)/iu,
  /(?<!(?:sabit|gizli|ek|ekstra)\s+)(?<!\p{L})ücret\p{L}*\s+(?:yok|alınmaz|alınmıyor)(?!\p{L})/iu,
  /(?<!\p{L})(?:бесплатн|даром(?!\p{L}))/iu,
  /(?<!\p{L})без\s+(?:комисси|платы)/iu,
  /(?<!\p{L})(?:pulsuz|ödənişsiz|komissiyasız)/iu,
  /(?<!(?:sabit|gizli|əlavə)\s+)(?<!\p{L})komissiya\s+(?:yoxdur|tutulmur)(?!\p{L})/iu,
];

const EERSTE_OVERBOEKING_RE = /(?<!\p{L})(?:eerste\s+overboeking|first\s+transfer|ilk\s+transfer|перв\p{L}*\s+перевод|ilk\s+köçürmə)/iu;
const GEEN_VASTE_KOSTEN_RE = /(?<!\p{L})(?:vaste\s+(?:kosten|fee)|fixed\s+fee|sabit\s+(?:işlem\s+)?ücret|sabit\s+komissiya|фиксированн\p{L}*\s+комисси)/iu;

// --- Hulpjes -----------------------------------------------------------------

/** "4,95" → 4.95, "5.000" → 5000, "5 000" → 5000, "1,2" → 1.2 */
function getal(tekst) {
  const t = tekst.replace(/\s/g, '');
  const m = t.match(/^(\d+(?:[.,]\d{3})*)(?:[.,](\d{1,2}))?$/);
  if (!m) return NaN;
  return Number(m[1].replace(/[.,]/g, '') + (m[2] ? `.${m[2]}` : ''));
}

const nlGetal = (n) => n.toLocaleString('nl-NL');
const euro = (n) => `€${nlGetal(n)}`;
const MARGES_TEKST = `${MARGES_PCT.map(nlGetal).join(' / ')}%`;

/**
 * Knipt een tekst in zinnen. Een punt na ca/min/max is een afkorting, geen
 * zinseinde; een opsommingsregel ("• Basis: 1,2%") hoort bij de zin erboven.
 */
function zinnen(tekst) {
  return tekst.split(/(?<!(?:^|\P{L})(?:ca|min|max|maks|incl|excl|bijv|resp|vs|nr))[.!?](?=\s|$)|;|\n(?![ \t]*[•·*-])/iu);
}

function isOntkend(zin, begin, eind) {
  return ONTKENNING_ERVOOR_RE.test(zin.slice(Math.max(0, begin - 40), begin))
    || ONTKENNING_ERNA_RE.test(zin.slice(eind));
}

// --- De controle -------------------------------------------------------------

/**
 * Controleert één tekst tegen het prijsmodel.
 * @returns {{ regel: string, detail: string }[]} leeg als de tekst in orde is
 */
export function controleerTekst(invoer) {
  if (typeof invoer !== 'string' || !invoer) return [];
  // De Turkse hoofdletter İ valt onder de i-vlag NIET samen met i, dus /ilk/iu
  // ziet "İlk transfer" aan het begin van een zin niet. Daarom eerst omzetten.
  const tekst = invoer.replace(/İ/g, 'i');
  const treffers = [];
  const meld = (regel, detail) => treffers.push({ regel, detail });

  for (const zin of zinnen(tekst)) {
    const bedragen = [...zin.matchAll(BEDRAG_RE)].map((m) => ({
      waarde: getal(m[1] ?? m[2]),
      ervoor: zin.slice(0, m.index),
      erna: zin.slice(m.index + m[0].length),
    }));

    for (const { waarde, ervoor, erna } of bedragen) {
      if (Number.isNaN(waarde)) continue;
      if (FEE_ERVOOR_RE.test(ervoor) || FEE_ERNA_RE.test(erna)) {
        if (waarde !== FEE_VAST) meld('vaste-fee-bedrag', `vaste fee ${euro(waarde)}; het model is ${euro(FEE_VAST)}`);
      } else if (PER_OVERBOEKING_ERNA_RE.test(erna) || PER_OVERBOEKING_ERVOOR_RE.test(ervoor)) {
        if (!BEDRAGEN_PER_OVERBOEKING.includes(waarde)) {
          meld('bedrag-per-overboeking', `${euro(waarde)} per overboeking is geen fee (${euro(FEE_VAST)}) en geen limiet (${euro(MIN_BEDRAG)} / ${euro(MAX_BEDRAG)})`);
        }
      }
    }

    if (MARGE_RE.test(zin)) {
      for (const m of zin.matchAll(PROCENT_RE)) {
        const pct = getal(m[1] ?? m[2]);
        if (!MARGES_PCT.includes(pct)) {
          meld('marge-percentage', `koersmarge ${nlGetal(pct)}%; het model kent alleen ${MARGES_TEKST}`);
        }
      }
    }

    for (const m of zin.matchAll(VERBORGEN_RE)) {
      const begin = m.index;
      const eind = begin + m[0].length;
      const overKosten = KOSTEN_ERNA_RE.test(zin.slice(eind)) || KOSTEN_ERVOOR_RE.test(zin.slice(0, begin));
      if (overKosten && !isOntkend(zin, begin, eind)) {
        meld('verborgen-marge', `"${m[0]}" bij kosten of marge; de marge wordt juist getoond`);
      }
    }

    if (EERSTE_OVERBOEKING_RE.test(zin) && GEEN_VASTE_KOSTEN_RE.test(zin)) {
      for (const { waarde } of bedragen) {
        if (waarde !== WELKOMST_DEAL_MAX && waarde !== FEE_VAST) {
          meld('welkomst-bedrag', `${euro(waarde)} bij de welkomstactie; de grens is ${euro(WELKOMST_DEAL_MAX)}`);
        }
      }
    }
  }

  for (const patroon of GRATIS_RE) {
    const m = tekst.match(patroon);
    if (m) meld('gratis', `"${m[0]}"; er wordt altijd koersmarge ingehouden`);
  }

  return treffers;
}

/**
 * Controleert alle teksten van één taal, ook geneste (errors.*).
 * @returns {{ sleutel: string, regel: string, detail: string, tekst: string }[]}
 */
export function controleerWoordenboek(dict, voorvoegsel = '') {
  const treffers = [];
  for (const [sleutel, waarde] of Object.entries(dict)) {
    const pad = voorvoegsel + sleutel;
    if (waarde && typeof waarde === 'object') {
      treffers.push(...controleerWoordenboek(waarde, `${pad}.`));
    } else if (typeof waarde === 'string') {
      for (const t of controleerTekst(waarde)) treffers.push({ sleutel: pad, ...t, tekst: waarde });
    }
  }
  return treffers;
}

// --- Rapport (alleen als script, niet bij importeren in de test) --------------

// realpath aan beide kanten: anders draait het rapport stil niet bij een symlink
// of een korte Windows-padnaam (GEBRUI~1), en staat CI groen zonder te controleren.
function zelfdeBestand(a, b) {
  try {
    return fs.realpathSync.native(a) === fs.realpathSync.native(b);
  } catch {
    return false;
  }
}
const alsScript = Boolean(process.argv[1]) && zelfdeBestand(process.argv[1], fileURLToPath(import.meta.url));

if (alsScript) {
  let problemen = 0;
  console.log('\n🔍 Pricing-consistency check');
  console.log(`   model: vaste fee ${euro(FEE_VAST)}, koersmarge ${MARGES_TEKST}, `
    + `${euro(MIN_BEDRAG)} – ${euro(MAX_BEDRAG)}, welkomstactie t/m ${euro(WELKOMST_DEAL_MAX)}\n`);

  for (const [code, dict] of Object.entries(TALEN)) {
    const issues = controleerWoordenboek(dict);
    if (issues.length === 0) {
      console.log(`✅ ${code.toUpperCase()}: alle prijsteksten volgen het model`);
    } else {
      console.log(`⚠️ ${code.toUpperCase()}: ${issues.length} probleem(en):`);
      for (const i of issues) {
        console.log(`   - ${i.sleutel} [${i.regel}]: ${i.detail}`);
        console.log(`     → "${i.tekst.replace(/\s+/g, ' ').slice(0, 100)}..."`);
      }
      problemen += issues.length;
    }
  }

  console.log();
  if (problemen === 0) {
    console.log('🎉 Alle pricing-strings consistent met het prijsmodel in src/services/kosten.js.\n');
    process.exit(0);
  } else {
    console.log(`Totaal ${problemen} afwijking(en) van het prijsmodel.\n`);
    if (process.argv.includes('--strict')) process.exit(1);
  }
}
