/**
 * geenBankclaim.test.js — bewaakt dat SwiftBridge zich nergens als bank of als
 * eigen vergunninghouder presenteert.
 *
 * Achtergrond (29-9-2026). De landingspagina's zeiden op zeven plekken, in zes
 * talen, dat SwiftBridge "zo betrouwbaar als uw bank" is, onder "dezelfde
 * toezichthouder die uw eigen bank bewaakt" staat en "dezelfde standaard" biedt.
 * Dat suggereert gelijkwaardige bescherming, en die is er niet: SwiftBridge werkt
 * als agent onder de vergunning van een EMI, het toezicht is dat op een
 * betaalinstelling en niet op een bank, en tegoeden vallen niet onder het
 * depositogarantiestelsel. Daarnaast stond er "Wwft-gecertificeerd", terwijl er
 * geen instantie bestaat die zo'n certificaat afgeeft.
 *
 * Wat BEWUST is toegestaan: de kostenvergelijking met een bank ("Vergelijk met
 * uw bank", "Bank: 1-2 werkdagen", "Eigen bank" als kolomkop). Dat is een
 * feitelijke vergelijking van tarieven en snelheid, geen claim over veiligheid
 * of toezicht.
 */
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const WORTEL = process.cwd();

/**
 * Formuleringen die gelijkwaardigheid met een bank suggereren, of een
 * certificaat claimen dat niet bestaat. Per taal, want de claim stond in alle zes.
 */
const VERBODEN = [
  // "zo betrouwbaar als uw bank"
  'betrouwbaar als uw bank', 'betrouwbaar als je bank',
  'trustworthy as your bank', 'reliable as your bank',
  'kadar güvenilir', 'vertrauenswürdig wie Ihre Bank',
  'fiable que votre banque', 'موثوق كبنكك',
  'как ваш банк', 'qədər etibarlı',
  // "dezelfde toezichthouder / dezelfde standaard als uw bank"
  'dezelfde toezichthouder', 'dezelfde standaard als uw eigen bank',
  'same regulator that oversees your own bank', 'same standard as your own bank',
  'denetleyen aynı', 'aynı standart',
  'dieselbe Behörde, die Ihre eigene Bank', 'dieselbe Regulierungsbehörde',
  'derselbe Standard wie', 'même régulateur qui surveille',
  'même standard que votre propre banque', 'بنفس معيار بنكك',
  'المعيار ذاته المطبَّق على بنككم',
  // "bankwaardig / op bankniveau" — geen bestaande norm
  'Bankwaardige', 'bankwaardig', 'Bank-grade', 'bank-grade',
  'Banka düzeyinde', 'Bankniveau', 'bankniveau',
  "digne d'une banque", 'niveau bancaire', 'بمستوى البنوك',
  // "net als uw eigen bank"
  'net als uw eigen bank', 'just like your bank', 'Bankanız gibi',
  'genau wie Ihre Bank', 'comme votre banque', 'تمامًا كبنكك',
  // Een certificaat dat niet bestaat
  'Wwft-gecertificeerd', 'Wwft gecertificeerd', 'Wwft certified',
  'Wwft sertifikalı', 'Wwft-zertifiziert', 'Certifié Wwft',
  'مُعتمَد وفق Wwft', 'معتمد وفق Wwft',
];

/**
 * Zolang AGENT_GEREGISTREERD false is, mag nergens staan dat SwiftBridge AL als
 * agent bij DNB is ingeschreven. Dit ging mis bij het opruimen van de
 * bankvergelijking op 29-9-2026: de vervangtekst kwam uit een extern document dat
 * ervan uitging dat de registratie rond was, en kwam zo in zes talen naast het
 * DNB-logo te staan terwijl de footer van dezelfde pagina zei dat de inschrijving
 * nog moest volgen. Een onjuiste mededeling over de toezichthouder is ernstiger
 * dan de claim die werd weggehaald.
 */
const AL_GEREGISTREERD = [
  'is als agent geregistreerd', 'staat als agent geregistreerd',
  'is bij DNB geregistreerd', 'geregistreerd bij De Nederlandsche Bank',
  'is registered as an agent', 'registered with De Nederlandsche Bank',
  'acente olarak kayıtlıdır', 'مسجَّلة كوكيل',
  'ist als Agent bei der De Nederlandsche Bank registriert',
  'est enregistrée comme agent',
];

/**
 * Een eigen DNB-vergunning claimen mag nooit. Maar de tekst "wij beschikken NIET
 * over een eigen DNB-vergunning" is juist wat er hoort te staan, en die bevat
 * precies dezelfde woorden. Daarom kijken we hier of de vergunning wordt
 * TOEGEKEND: een regel die over een eigen vergunning gaat zonder ontkenning.
 */
const EIGEN_VERGUNNING = /(eigen (DNB-)?(bank)?vergunning|own DNB (licence|license)|eigene DNB-Lizenz)/i;
const ONTKENNING = /\b(niet|geen|nooit|zonder|not|no|does not|doesn't|non|nicht|keine)\b/i;

/**
 * Leest een bestand en FAALT als het er niet is.
 *
 * Eerst gaf deze functie stilletjes null terug bij een ontbrekend bestand,
 * waardoor de hele test groen bleef zodra iemand een pagina hernoemde of
 * verplaatste. Een bewaking die verdwijnt zonder dat iemand het merkt is erger
 * dan geen bewaking.
 */
function leesAls(relatiefPad) {
  const p = path.resolve(WORTEL, relatiefPad);
  if (!fs.existsSync(p)) {
    throw new Error(`${relatiefPad} bestaat niet meer — pas deze test aan of herstel het bestand`);
  }
  return fs.readFileSync(p, 'utf8');
}

/** Zoekt elke verboden formulering en geeft "bestand:regel — formulering" terug. */
function vindClaims(relatiefPad) {
  const inhoud = leesAls(relatiefPad);
  const treffers = [];
  inhoud.split('\n').forEach((regel, i) => {
    for (const v of VERBODEN) {
      if (regel.includes(v)) treffers.push(`${relatiefPad}:${i + 1} — "${v}"`);
    }
    // Een eigen vergunning mag alleen worden genoemd om hem te ONTKENNEN.
    if (EIGEN_VERGUNNING.test(regel) && !ONTKENNING.test(regel)) {
      treffers.push(`${relatiefPad}:${i + 1} — claimt een eigen vergunning`);
    }
  });
  return treffers;
}

describe('SwiftBridge presenteert zich nergens als bank', () => {
  test('de particuliere landingspagina bevat geen bankvergelijking', () => {
    expect(vindClaims('public/landing/particulier.html')).toEqual([]);
  });

  test('de zakelijke landingspagina bevat geen bankvergelijking', () => {
    expect(vindClaims('public/landing/zakelijk.html')).toEqual([]);
  });

  test('de app-teksten in alle vijf talen bevatten geen bankvergelijking', () => {
    const alles = ['nl', 'en', 'tr', 'ru', 'az'].flatMap((taal) => vindClaims(`src/i18n/${taal}.js`));
    expect(alles).toEqual([]);
  });

  test('de schermen zelf bevatten geen bankvergelijking', () => {
    const alles = [
      'src/pages/Login.jsx',
      'src/pages/VerifyEmail.jsx',
      'src/App.jsx',
      'src/pages/OverOns.jsx',
      // De Veiligheid-pagina stond er eerst niet bij, en juist daar bleef de
      // zin "dezelfde toezichthouder die uw eigen bank bewaakt" staan terwijl
      // deze test groen meldde dat alles opgeruimd was.
      'src/pages/Veiligheid.jsx',
      'src/components/landing/Footer.jsx',
      // Wordt nu niet geïmporteerd, maar bevat wel volledige teksten in zes
      // talen. Zodra iemand dit bestand weer aansluit, staan de claims er weer.
      'src/i18n/premiumLanding.js',
    ].flatMap(vindClaims);
    expect(alles).toEqual([]);
  });

  test('de meta-teksten claimen het ook niet — die worden buiten de pagina om gelezen', () => {
    const html = leesAls('public/landing/particulier.html');
    expect(html).not.toBeNull();
    const metas = html.split('\n').filter((r) => /<meta\s+(name|property)="(description|og:description|twitter:description)"/.test(r));
    // Er hoort een beschrijving te staan, anders test dit niets.
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      for (const v of VERBODEN) expect(m).not.toContain(v);
    }
  });
});

describe('de registratie bij DNB wordt niet geclaimd voordat hij er is', () => {
  test('AGENT_GEREGISTREERD staat nog op false — deze hele groep hangt daarvan af', async () => {
    const meta = await import('../content/juridisch/meta');
    // Is de registratie rond, dan MAG de claim en moet deze groep herzien worden.
    expect(typeof meta.AGENT_GEREGISTREERD).toBe('boolean');
    if (meta.AGENT_GEREGISTREERD) {
      console.warn('AGENT_GEREGISTREERD staat op true — pas deze test aan, de claim mag nu wel.');
    }
  });

  test('geen enkele pagina zegt dat de inschrijving al gedaan is', async () => {
    const meta = await import('../content/juridisch/meta');
    if (meta.AGENT_GEREGISTREERD) return; // dan is de claim juist

    const bestanden = [
      'public/landing/particulier.html',
      'public/landing/zakelijk.html',
      'src/pages/Veiligheid.jsx',
      'src/pages/OverOns.jsx',
      'src/i18n/nl.js',
      'src/i18n/en.js',
      'src/i18n/premiumLanding.js',
    ];
    const treffers = [];
    for (const pad of bestanden) {
      leesAls(pad).split('\n').forEach((regel, i) => {
        for (const z of AL_GEREGISTREERD) {
          if (regel.includes(z)) treffers.push(`${pad}:${i + 1} — "${z}"`);
        }
      });
    }
    expect(treffers).toEqual([]);
  });

  test('de landingspagina zegt juist dat de inschrijving nog volgt', () => {
    const html = leesAls('public/landing/particulier.html');
    expect(html).toMatch(/inschrijving als agent bij DNB volgt/);
  });
});

describe('wat er juist WEL moet staan', () => {
  test('beide pagina\'s zeggen uitdrukkelijk dat SwiftBridge geen bank is', () => {
    for (const pad of ['public/landing/particulier.html', 'public/landing/zakelijk.html']) {
      const html = leesAls(pad);
      if (html === null) continue;
      expect(html.toLowerCase()).toContain('geen bank');
    }
  });

  test('beide pagina\'s noemen dat tegoeden niet onder het depositogarantiestelsel vallen', () => {
    for (const pad of ['public/landing/particulier.html', 'public/landing/zakelijk.html']) {
      const html = leesAls(pad);
      if (html === null) continue;
      expect(html.toLowerCase()).toContain('depositogarantiestelsel');
    }
  });

  test('de app-teksten ontkennen uitdrukkelijk een eigen DNB-vergunning', () => {
    // Deze regel is de kern van de positionering: agent onder de vergunning van
    // een EMI. Verdwijnt hij, dan blijft alleen "onder DNB-toezicht" over en dat
    // leest een klant als een eigen vergunning.
    const nl = leesAls('src/i18n/nl.js');
    expect(nl).not.toBeNull();
    expect(nl).toMatch(/niet over een eigen DNB-vergunning|geen eigen DNB-vergunning/);
  });

  test('de kostenvergelijking met een bank mag blijven — die is feitelijk', () => {
    const html = leesAls('public/landing/zakelijk.html');
    expect(html).not.toBeNull();
    // Als deze vergelijking per ongeluk mee zou zijn opgeruimd, verliest de
    // pagina haar belangrijkste argument. Daarom leggen we vast dat hij er is.
    expect(html).toMatch(/Bank: 1–2 werkdagen|Eigen bank/);
  });
});
