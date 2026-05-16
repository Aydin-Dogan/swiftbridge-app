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

  return {
    bedrag,
    // KLANT ZIET DEZE
    klantBetaaltFee:  round(klantBetaaltFee),
    appliedRate:      round(appliedRate),
    midMarketRate:    round(midMarketRate),
    ontvangenBedrag:  round(ontvangenBedrag),
    effectievePct:    bedrag > 0 ? round(((bedrag - ontvangenBedrag / midMarketRate) / bedrag) * 100, 2) : 0,
    // INTERN (toon NIET aan klant)
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
