/**
 * kosten.js — Pricing model met hidden FX margin
 *
 * MODEL (18 mei 2026):
 * 1. Zichtbare fee = percentage uit TARIEF_MATRIX (bedrag × methode-kolom).
 * Gebaseerd op tariefkaart §4.4 uit KOSTEN_TARIEF_OVERZICHT.md.
 * Minimum fee = €1,99 (express) / €0,99 (economy) — voor micro-bedragen.
 * 2. HIDDEN_FX_MARGIN — ALTIJD aan, klant ziet alleen applied rate.
 * Express 1,2%, Economy 0,5%.
 *
 * PSD2 compliance:
 * - De applied rate wordt getoond (klant ziet wat hij krijgt)
 * - Totale kosten worden getoond (klant kan rekenen)
 * - Mid-market rate wordt getoond als referentie
 */

// ── Verborgen FX margin (geheim — alleen in interne berekening) ────────────
const HIDDEN_FX_MARGIN_EXPRESS = 0.012; // 1,2%
const HIDDEN_FX_MARGIN_ECONOMY = 0.005; // 0,5%

// ── Minimum zichtbare fee (kickt in bij micro-bedragen) ─────────────────
const MIN_FEE_EXPRESS = 1.99;
const MIN_FEE_ECONOMY = 0.99;

// ── Tariefkaart §4.4 — zichtbare percentages per bedrag×methode-kolom ──
// Tier-grenzen (bovengrens incl): €200, €500, €1.000, €2.500, >€2.500
export const TARIEF_TIER_GRENZEN = [200, 500, 1000, 2500];

export const TARIEF_MATRIX = {
  ideal: [0.020, 0.015, 0.012, 0.010, 0.008], // iDEAL / Wero / Bancontact
  card: [0.035, 0.035, 0.032, 0.030, 0.028], // Card / Apple Pay
  klarna: [0.050, 0.050, 0.045, 0.040, 0.035],
  sepa: [0.012, 0.009, 0.007, 0.005, 0.004], // SEPA economy
};

// ── Vaste operationele kosten (ook achter de schermen) ─────────────────
const COMPLIANCE_PER_TX = 0.05;
const OVERHEAD_PER_TX = 0.80;

function hiddenFxMarge(snelheid) {
  return snelheid === 'economy' ? HIDDEN_FX_MARGIN_ECONOMY : HIDDEN_FX_MARGIN_EXPRESS;
}

export function methodeNaarTariefKolom(methode) {
  switch (methode) {
    case 'ideal':
    case 'wero':
    case 'bancontact': return 'ideal';
    case 'card':
    case 'creditcard':
    case 'applepay': return 'card';
    case 'klarna': return 'klarna';
    case 'sepa': return 'sepa';
    default: return 'ideal';
  }
}

export function tariefTier(eurBedrag) {
  const b = parseFloat(eurBedrag) || 0;
  for (let i = 0; i < TARIEF_TIER_GRENZEN.length; i++) {
    if (b <= TARIEF_TIER_GRENZEN[i]) return i;
  }
  return TARIEF_TIER_GRENZEN.length; // tier 4 voor €2.500+
}

export function zichtbarePercentage(eurBedrag, methode) {
  const kolom = methodeNaarTariefKolom(methode);
  const tier = tariefTier(eurBedrag);
  return TARIEF_MATRIX[kolom][tier];
}

/**
 * Zichtbare fee = max(bedrag × percentage, minimum fee).
 * Backward-compat met oude visibleFee(snelheid)-signature behouden.
 */
function visibleFee(eurBedrag, methode = 'ideal', snelheid = 'express') {
  if (eurBedrag === 'express' || eurBedrag === 'economy') {
    snelheid = eurBedrag;
    return snelheid === 'economy' ? MIN_FEE_ECONOMY : MIN_FEE_EXPRESS;
  }
  const bedrag = parseFloat(eurBedrag) || 0;
  const pct = zichtbarePercentage(bedrag, methode);
  const berekendeFee = bedrag * pct;
  const minimum = snelheid === 'economy' ? MIN_FEE_ECONOMY : MIN_FEE_EXPRESS;
  return Math.max(minimum, berekendeFee);
}

/**
 * Mollie processing fee per methode
 */
export function mollieKosten(eurBedrag, methode) {
  const b = parseFloat(eurBedrag) || 0;
  switch (methode) {
    case 'ideal':
    case 'wero':
    case 'bancontact':
      return 0.29;
    case 'creditcard':
    case 'card':
    case 'applepay':
      return b * 0.018 + 0.25;
    case 'klarna':
      return b * 0.0299 + 0.35;
    case 'sepa':
      return Math.max(0.29, b * 0.0025);
    default:
      return 0.29;
  }
}

export function transferKosten(snelheid) {
  return snelheid === 'economy' ? 0.50 : 2.50;
}

/**
 * Hoofdberekening — geeft wat klant ziet + wat we werkelijk verdienen
 */
export function berekenKosten(eurBedrag, methode = 'ideal', snelheid = 'express', midMarketRate = 36.20) {
  const bedrag = Math.max(0, parseFloat(eurBedrag) || 0);
  const margin = hiddenFxMarge(snelheid);
  const fee = visibleFee(bedrag, methode, snelheid);
  const zichtPct = zichtbarePercentage(bedrag, methode);

  // Zichtbare kant
  const klantBetaaltFee = fee;
  const appliedRate = midMarketRate * (1 - margin);
  const ontvangenBedrag = (bedrag - fee) * appliedRate;

  // Verborgen kant (interne metrics)
  const verborgenFxOmzet = (bedrag - fee) * midMarketRate * margin;
  const swiftbridgeOmzet = fee + verborgenFxOmzet;

  const mollie = mollieKosten(bedrag, methode);
  const transfer = transferKosten(snelheid);
  const werkelijkeKosten = mollie + transfer + COMPLIANCE_PER_TX + OVERHEAD_PER_TX;
  const werkelijkeWinst = swiftbridgeOmzet - werkelijkeKosten;

  // PSD2 transparantie: toon klant ook de totale kosten incl. wisselkoers-marge
  const fxKostenInEur = bedrag > 0 ? (verborgenFxOmzet / 1) : 0;
  const totaleKostenEur = klantBetaaltFee + fxKostenInEur;
  const totaleKostenPct = bedrag > 0 ? (totaleKostenEur / bedrag) * 100 : 0;
  const fxAfwijkingPct = margin * 100;

  return {
    bedrag,
    // KLANT ZIET DEZE
    klantBetaaltFee: round(klantBetaaltFee, 2),
    zichtbarePct: round(zichtPct * 100, 2), // matrix-percentage (excl. minimum-bumping)
    appliedRate: round(appliedRate),
    midMarketRate: round(midMarketRate),
    fxKostenEur: round(fxKostenInEur, 2),
    totaleKostenEur: round(totaleKostenEur, 2),
    totaleKostenPct: round(totaleKostenPct, 2),
    fxAfwijkingPct: round(fxAfwijkingPct, 2),
    ontvangenBedrag: round(ontvangenBedrag, 2),
    effectievePct: bedrag > 0 ? round(((bedrag - ontvangenBedrag / midMarketRate) / bedrag) * 100, 2) : 0,
    // INTERN (toon NIET aan klant — alleen voor admin reporting)
    _intern: {
      verborgenFxOmzet: round(verborgenFxOmzet, 2),
      swiftbridgeOmzet: round(swiftbridgeOmzet, 2),
      werkelijkeKosten: round(werkelijkeKosten, 2),
      werkelijkeWinst: round(werkelijkeWinst, 2),
      hiddenMarginPct: margin,
      tariefTier: tariefTier(bedrag),
      tariefKolom: methodeNaarTariefKolom(methode),
    },
  };
}

function round(n, dec = 4) { return Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec); }

export const KOSTEN_LABELS = {
  fee: { label: 'Servicekosten', uitleg: 'Variabele kosten gebaseerd op bedrag en methode' },
};
