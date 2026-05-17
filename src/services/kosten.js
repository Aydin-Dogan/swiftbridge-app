/**
 * kosten.js — Pricing model met hidden FX margin
 *
 * Twee marge componenten:
 * 1. VISIBLE_FEE (€1,99 flat) — zichtbaar als 'servicekosten'
 * 2. HIDDEN_FX_MARGIN (1,2% Express / 0,5% Economy) — verborgen in wisselkoers
 *
 * PSD2 compliance:
 * - De applied rate wordt getoond (klant ziet wat hij krijgt)
 * - Totale kosten worden getoond (klant kan rekenen)
 */

// ── Verborgen FX margin (geheim — alleen in interne berekening) ────────────
const HIDDEN_FX_MARGIN_EXPRESS = 0.012; // 1,2%
const HIDDEN_FX_MARGIN_ECONOMY = 0.005; // 0,5%

// ── Zichtbare flat fee (wat klant ziet) ─────────────────────────────────
const VISIBLE_FEE_EXPRESS = 1.99;
const VISIBLE_FEE_ECONOMY = 0.99;

// ── Vaste operationele kosten (ook achter de schermen) ─────────────────
const COMPLIANCE_PER_TX = 0.05;
const OVERHEAD_PER_TX = 0.80;

function hiddenFxMarge(snelheid) {
  return snelheid === 'economy' ? HIDDEN_FX_MARGIN_ECONOMY : HIDDEN_FX_MARGIN_EXPRESS;
}

function visibleFee(snelheid) {
  return snelheid === 'economy' ? VISIBLE_FEE_ECONOMY : VISIBLE_FEE_EXPRESS;
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
 *
 * @returns {object}
 *   - klantBetaaltFee: zichtbare fee (€1,99)
 *   - appliedRate: gehanteerde wisselkoers (mid-market × (1 - hidden margin))
 *   - midMarketRate: echte mid-market koers
 *   - ontvangenBedrag: wat recipient krijgt (in TRY/etc) bij appliedRate
 *   - swiftbridgeOmzet: jouw totale opbrengst (zichtbare fee + verborgen FX)
 *   - werkelijkeKosten: alle echte kosten (Mollie + transfer + compliance + overhead)
 *   - werkelijkeWinst: omzet − kosten
 */
export function berekenKosten(eurBedrag, methode = 'ideal', snelheid = 'express', midMarketRate = 36.20) {
  const bedrag = Math.max(0, parseFloat(eurBedrag) || 0);
  const margin = hiddenFxMarge(snelheid);
  const flatFee = visibleFee(snelheid);

  // Zichtbare kant
  const klantBetaaltFee = flatFee;
  const appliedRate = midMarketRate * (1 - margin);
  const ontvangenBedrag = (bedrag - flatFee) * appliedRate;

  // Verborgen kant (interne metrics)
  const verborgenFxOmzet = (bedrag - flatFee) * midMarketRate * margin;
  const swiftbridgeOmzet = flatFee + verborgenFxOmzet;

  const mollie = mollieKosten(bedrag, methode);
  const transfer = transferKosten(snelheid);
  const werkelijkeKosten = mollie + transfer + COMPLIANCE_PER_TX + OVERHEAD_PER_TX;
  const werkelijkeWinst = swiftbridgeOmzet - werkelijkeKosten;

  // PSD2 transparantie: toon klant ook de totale kosten incl. wisselkoers-marge
  const fxKostenInEur = bedrag > 0 ? (verborgenFxOmzet / 1) : 0; // de FX marge uitgedrukt in EUR
  const totaleKostenEur = klantBetaaltFee + fxKostenInEur;
  const totaleKostenPct = bedrag > 0 ? (totaleKostenEur / bedrag) * 100 : 0;
  const fxAfwijkingPct = margin * 100; // hoeveel % de applied rate afwijkt van mid-market

  return {
    bedrag,
    // KLANT ZIET DEZE
    klantBetaaltFee:  round(klantBetaaltFee),    // zichtbare servicekosten
    appliedRate:      round(appliedRate),         // gehanteerde koers
    midMarketRate:    round(midMarketRate),       // ECB/mid-market referentie (PSD2 verplicht)
    fxKostenEur:      round(fxKostenInEur),       // FX marge in EUR (PSD2: totale kosten zichtbaar)
    totaleKostenEur:  round(totaleKostenEur),     // fee + FX = wat klant feitelijk betaalt
    totaleKostenPct:  round(totaleKostenPct, 2),  // als percentage van bedrag
    fxAfwijkingPct:   round(fxAfwijkingPct, 2),   // afwijking van mid-market (EU Cross-Border 2019/518)
    ontvangenBedrag:  round(ontvangenBedrag),
    effectievePct:    bedrag > 0 ? round(((bedrag - ontvangenBedrag / midMarketRate) / bedrag) * 100, 2) : 0,
    // INTERN (toon NIET aan klant — alleen voor admin reporting)
    _intern: {
      verborgenFxOmzet: round(verborgenFxOmzet),
      swiftbridgeOmzet: round(swiftbridgeOmzet),
      werkelijkeKosten: round(werkelijkeKosten),
      werkelijkeWinst:  round(werkelijkeWinst),
      hiddenMarginPct:  margin,
    },
  };
}

function round(n, dec = 4) { return Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec); }

export const KOSTEN_LABELS = {
  fee: { label: 'Servicekosten', icon: '💰', uitleg: 'Eenmalige kosten voor de overboeking' },
};
