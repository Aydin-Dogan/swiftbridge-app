/**
 * welkomstactieClaims.test.js — bewaakt wat de app over de welkomstactie zegt.
 *
 * AANLEIDING (5-10-2026)
 * De welkomstactie laat de vaste kosten van 4,95 euro vervallen op de eerste
 * overboeking tot en met 800 euro. De koersopslag van 1,2 procent wordt gewoon
 * ingehouden — bij de actie zelfs over het VOLLEDIGE bedrag, want er gaat geen
 * fee meer vanaf, dus in euro's iets meer dan bij een gewone overboeking van
 * hetzelfde bedrag (services/kosten.js).
 *
 * De app beweerde op zes plekken iets anders:
 *   - "Verstuur je eerste overboeking gratis" in alle vijf de talen
 *   - "Welkomst-deal: 1e transactie GRATIS!" op het beginscherm
 *   - "GRATIS" bij Servicekosten op de kwitantie, zonder dat daar ergens de
 *     ingehouden marge stond — op dat document was dat dus de enige
 *     kostenmededeling
 *   - "Familie kan ook gratis ontvangen", waar niets voor bestaat
 *   - "Geldig 30 dagen", terwijl er in de hele API geen enkele vervaldatum
 *     bestaat: welkomstDealActief kijkt alleen naar de vlag en het bedrag
 *   - een promocode "WELKOM800" met het label "Promo code", terwijl de backend
 *     geen enkele promocode-afhandeling kent
 *
 * Er waren op dat moment 17 gebruikers en 0 transacties, dus er is niemand mee
 * benadeeld. Deze test houdt het zo.
 *
 * WAAROM OOK DE JSX-BESTANDEN WORDEN GESCAND
 * Twee van de ergste treffers stonden niet in de taalbestanden maar hardgecodeerd
 * in een component. Een test die alleen i18n bekijkt, geeft een vals gevoel van
 * veiligheid.
 */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nl } from '../i18n/nl';
import { en } from '../i18n/en';
import { tr } from '../i18n/tr';
import { ru } from '../i18n/ru';
import { az } from '../i18n/az';

const TALEN = { nl, en, tr, ru, az };

// De sleutels die over de welkomstactie gaan. Een nieuwe sleutel over de actie
// hoort hier bij te komen.
const DEAL_SLEUTELS = [
  'onb_label_deal',
  'onb_welkom_punt_3',
  'onb_bevestig_subtitel',
  'onb_bevestig_promo_label',
  'onb_bevestig_promo_titel',
  'onb_bevestig_promo_uitleg',
  'onb_klaar_tip_deel_tekst',
];

/**
 * WAAROM HIER GEEN \b STAAT
 * De eerste versie van dit bestand gebruikte \b als woordgrens. In JavaScript is
 * \b gedefinieerd op [A-Za-z0-9_], dus een letter als u-umlaut of een Cyrillisch
 * teken telt als NIET-woord. Een patroon van de vorm \b + ucretsiz + \b sloeg
 * daardoor niet aan op "transferin ücretsiz", en hetzelfde gold voor het
 * Russische besplatno in "Первый перевод бесплатно": voor de u-umlaut stond een
 * spatie, ook een niet-woordteken, dus er was helemaal geen grens. Het vangnet
 * stond groen terwijl de bewering in het Turks en het Russisch gewoon in de app
 * stond. Dat is erger dan geen vangnet.
 *
 * Nu: een lookbehind op "geen letter" met de u-vlag, die wél alle alfabetten
 * kent. Aan het eind staat met opzet meestal géén grens, want Turks en
 * Azerbeidzjaans plakken achtervoegsels aan het woord (ücretsizdir, pulsuzdur)
 * en die moeten ook worden gezien. Waar een woord zonder grens te veel zou
 * vangen (free in freelance) staat die grens er wel.
 *
 * De test "het vangnet ziet de teksten die de aanleiding waren" hieronder bewijst
 * dat elk patroon doet wat het belooft. Verander hier niets zonder die test.
 */
const GRATIS_WOORDEN = [
  /(?<!\p{L})gratis(?!\p{L})/iu,     // nl
  /(?<!\p{L})kosteloos/iu,           // nl
  /(?<!\p{L})free(?!\p{L})/iu,       // en
  /(?<!\p{L})ücretsiz/iu,            // tr
  /(?<!\p{L})bedava/iu,              // tr
  /(?<!\p{L})parasız/iu,             // tr
  /(?<!\p{L})бесплатн/iu,            // ru
  /(?<!\p{L})даром(?!\p{L})/iu,      // ru
  /(?<!\p{L})pulsuz/iu,              // az
  /(?<!\p{L})ödənişsiz/iu,           // az
];

// De actie verloopt niet. Elke termijn is dus verzonnen.
const TERMIJN_PATRONEN = [
  /\d+\s*dag/iu,                     // nl
  /\d+\s*days?(?!\p{L})/iu,          // en
  /\d+\s*gün/iu,                     // tr
  /\d+\s*дн/iu,                      // ru
  /\d+\s*gün|\d+\s*günlük/iu,        // az
  /geldig\s+\d+/iu,
  /valid\s+for\s+\d+/iu,
];

// Er bestaat geen promocode. Het woord mag dus nergens staan waar het suggereert
// dat de klant er een moet invoeren.
const PROMOCODE_PATRONEN = [
  /WELKOM800/iu,
  /(?<!\p{L})promo\s*code/iu,
  /(?<!\p{L})promo\s*kod/iu,
  /(?<!\p{L})промокод/iu,
];

const JSX_BESTANDEN = [
  'src/components/Dashboard.jsx',
  'src/components/TransactieReceipt.jsx',
  'src/components/PaymentFlow.jsx',
  'src/components/onboarding/Stap3Bevestig.jsx',
];

function leesBestand(pad) {
  return readFileSync(resolve(process.cwd(), pad), 'utf8');
}

/**
 * Commentaar onzichtbaar maken zonder de regelnummering te verstoren: de inhoud
 * wordt door spaties vervangen, de regeleindes blijven staan.
 *
 * Nodig omdat een toelichting die uitlegt waarom "gratis" hier fout is, het
 * woord "gratis" bevat. Een filter op regels die met een dubbele schuine streep
 * beginnen is niet genoeg: JSX zet blokcommentaar tussen accolades en dat loopt
 * over meerdere regels door, waardoor de vervolgregels alsnog blijven haken.
 */
function zonderCommentaar(bron) {
  return bron
    // blokcommentaar, inclusief de JSX-vorm met accolades eromheen
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, (m) => m.replace(/[^\n]/g, ' '))
    // regelcommentaar, alleen aan het begin van een regel; zo blijft https:// heel
    .replace(/^(\s*)\/\/[^\n]*/gm, (m, witruimte) => witruimte + ' '.repeat(m.length - witruimte.length));
}

/** Alleen de regels die ook echt getoonde tekst kunnen bevatten. */
function tekstRegels(bron) {
  return zonderCommentaar(bron)
    .split('\n')
    .map((regel, i) => ({ nr: i + 1, regel }))
    .filter(({ regel }) => regel.trim() !== '');
}

describe('het vangnet zelf', () => {
  // De teksten die er op 5-10-2026 echt stonden, letterlijk overgenomen. Een
  // patroon dat deze niet ziet, bewaakt niets.
  const MOET_AANSLAAN = [
    ['nl gratis', 'Verstuur je eerste overboeking gratis (tot €800)', GRATIS_WOORDEN],
    ['nl familie', 'Familie kan ook gratis ontvangen — deel SwiftBridge.', GRATIS_WOORDEN],
    ['en free', 'Send your first transfer for free (up to €800)', GRATIS_WOORDEN],
    ['tr ücretsiz', "İlk transferin ücretsiz (€800'e kadar)", GRATIS_WOORDEN],
    ['ru бесплатно', 'Первый перевод бесплатно (до €800)', GRATIS_WOORDEN],
    ['az pulsuz', 'İlk köçürmə pulsuz (€800-a qədər)', GRATIS_WOORDEN],
    ['nl termijn', 'Wordt automatisch toegepast op je eerste overboeking. Geldig 30 dagen.', TERMIJN_PATRONEN],
    ['en termijn', 'Automatically applied to your first transfer. Valid for 30 days.', TERMIJN_PATRONEN],
    ['tr termijn', 'İlk transferine otomatik uygulanır. 30 gün geçerli.', TERMIJN_PATRONEN],
    ['ru termijn', 'Автоматически применяется к первому переводу. Действителен 30 дней.', TERMIJN_PATRONEN],
    ['az termijn', 'İlk köçürmənizə avtomatik tətbiq olunur. 30 gün etibarlıdır.', TERMIJN_PATRONEN],
    ['nl promocode', 'Promo code', PROMOCODE_PATRONEN],
    ['ru promocode', 'Промокод', PROMOCODE_PATRONEN],
    ['tr promocode', 'Promo kod', PROMOCODE_PATRONEN],
    ['de nepcode zelf', "const PROMO_CODE = 'WELKOM800';", PROMOCODE_PATRONEN],
  ];

  test.each(MOET_AANSLAAN)('%s wordt gezien', (_naam, zin, patronen) => {
    expect(
      patronen.some((p) => p.test(zin)),
      `Geen enkel patroon ziet "${zin}". Dit is een tekst die er echt heeft `
      + `gestaan; als het vangnet hem mist, staat het groen terwijl de bewering `
      + `in de app blijft staan.`
    ).toBe(true);
  });

  // En wat er juist WEL mag staan, zodat het vangnet niet de correcte tekst
  // tegenhoudt en iemand het daarom uitzet.
  const MOET_DOORLATEN = [
    ['nl, correct', 'Op je eerste overboeking t/m €800 vervallen de vaste kosten.'],
    ['tr, correct', 'İlk havaleniz en çok 800 euroysa sabit ücret ödemezsiniz.'],
    ['ru, correct', 'За первый перевод до €800 включительно нет фиксированной комиссии.'],
    ['az, correct', 'Ən çox €800 olan ilk köçürmənizdə sabit komissiya tutulmur.'],
    ['en, correct', 'On your first transfer of €800 or less the fixed fee is waived.'],
    ['het woord vrij in een andere betekenis', 'Kies vrij welke ontvanger je toevoegt.'],
  ];

  test.each(MOET_DOORLATEN)('%s wordt doorgelaten', (_naam, zin) => {
    const alle = [...GRATIS_WOORDEN, ...TERMIJN_PATRONEN, ...PROMOCODE_PATRONEN];
    const haakt = alle.filter((p) => p.test(zin)).map(String);
    expect(haakt, `Deze tekst is juist goed, maar blijft haken op ${haakt.join(', ')}`).toEqual([]);
  });
});

describe('welkomstactie: de app mag niet meer beloven dan de actie doet', () => {
  test('geen enkele taal noemt de overboeking gratis', () => {
    const treffers = [];
    for (const [code, dict] of Object.entries(TALEN)) {
      for (const sleutel of DEAL_SLEUTELS) {
        const waarde = dict[sleutel];
        if (typeof waarde !== 'string') continue;
        for (const patroon of GRATIS_WOORDEN) {
          if (patroon.test(waarde)) treffers.push(`${code}.${sleutel}: "${waarde}"`);
        }
      }
    }
    expect(
      treffers,
      `De actie laat alleen de VASTE KOSTEN vervallen; de koersopslag wordt gewoon `
      + `ingehouden. Schrijf "geen vaste kosten", niet "gratis".\n${treffers.join('\n')}`
    ).toEqual([]);
  });

  test('geen enkele taal beweert dat de actie verloopt', () => {
    const treffers = [];
    for (const [code, dict] of Object.entries(TALEN)) {
      for (const sleutel of DEAL_SLEUTELS) {
        const waarde = dict[sleutel];
        if (typeof waarde !== 'string') continue;
        for (const patroon of TERMIJN_PATRONEN) {
          if (patroon.test(waarde)) treffers.push(`${code}.${sleutel}: "${waarde}"`);
        }
      }
    }
    expect(
      treffers,
      `welkomstDealActief in de API kijkt alleen naar de vlag en het bedrag. Er `
      + `bestaat geen vervaldatum, dus elke termijn is verzonnen.\n${treffers.join('\n')}`
    ).toEqual([]);
  });

  test('geen enkele taal suggereert een promocode', () => {
    const treffers = [];
    for (const [code, dict] of Object.entries(TALEN)) {
      for (const [sleutel, waarde] of Object.entries(dict)) {
        if (typeof waarde !== 'string') continue;
        for (const patroon of PROMOCODE_PATRONEN) {
          if (patroon.test(waarde)) treffers.push(`${code}.${sleutel}: "${waarde}"`);
        }
      }
    }
    expect(
      treffers,
      `De actie staat automatisch aan (gratis_eerste_tx DEFAULT 1). De backend `
      + `kent geen promocodes; een code tonen is een belofte die nergens op slaat.`
      + `\n${treffers.join('\n')}`
    ).toEqual([]);
  });

  test('de schermen zelf noemen de overboeking nergens gratis', () => {
    const treffers = [];
    for (const bestand of JSX_BESTANDEN) {
      for (const { nr, regel } of tekstRegels(leesBestand(bestand))) {
        for (const patroon of GRATIS_WOORDEN) {
          if (patroon.test(regel)) treffers.push(`${bestand}:${nr}: ${regel.trim()}`);
        }
        for (const patroon of PROMOCODE_PATRONEN) {
          if (patroon.test(regel)) treffers.push(`${bestand}:${nr}: ${regel.trim()}`);
        }
      }
    }
    expect(
      treffers,
      `Hardgecodeerde tekst in een component ontsnapt aan een i18n-controle. `
      + `Twee van de ergste beweringen stonden juist hier.\n${treffers.join('\n')}`
    ).toEqual([]);
  });

  test('geen enkele tekst bevat een ontsnappingsteken dat de klant zou zien', () => {
    // Deze teksten zijn in vijf talen tegelijk geschreven met een script. Een
    // apostrof in het Turks ("€800'ü") moet in de bron ontsnapt worden, en bij
    // die vertaalslag is hij een keer dubbel ontsnapt: in de app stond toen
    // letterlijk "€800\\'ü" op het scherm. Dat valt in een taal die je niet
    // leest niet op, dus controleert een test het.
    const treffers = [];
    for (const [code, dict] of Object.entries(TALEN)) {
      for (const sleutel of DEAL_SLEUTELS) {
        const waarde = dict[sleutel];
        if (typeof waarde !== 'string') continue;
        if (waarde.includes('\\')) treffers.push(`${code}.${sleutel}: "${waarde}"`);
      }
    }
    expect(
      treffers,
      `Een backslash in de waarde betekent dat er te vaak is ontsnapt; de klant `
      + `ziet hem staan.\n${treffers.join('\n')}`
    ).toEqual([]);
  });

  test('de kwitantie toont de ingehouden koersopslag', () => {
    // Zonder deze regel is "0,00" bij Servicekosten de enige kostenmededeling op
    // het document dat de klant bewaart, terwijl er 1,2 procent is ingehouden.
    const bon = leesBestand('src/components/TransactieReceipt.jsx');
    const noemtMarge = /fxMarge|fx_marge/.test(bon);
    expect(
      noemtMarge,
      'TransactieReceipt.jsx toont geen koersopslag. De kwitantie is dan '
      + 'misleidend bij een welkomstactie: servicekosten 0,00 en nergens de '
      + 'ingehouden marge. De lijst-route doet SELECT *, dus fx_marge_eur is '
      + 'beschikbaar.'
    ).toBe(true);
  });
});
