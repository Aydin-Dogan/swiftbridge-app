/**
 * kosten.js — Transparante kostenberekening (à la Wise)
 *
 * Klant ziet alle componenten apart:
 *   Mollie kosten + Transfer kosten + FX spread + Compliance/overhead + SwiftBridge marge
 *
 * Model: kosten + 0,3% marge van transactie bedrag
 */

const MARGE_PCT = 0.010; // 1,0% SwiftBridge winst
const FX_SPREAD_PCT = 0.003; // 0,3% wisselkoers marge (FX provider neemt dit)
const COMPLIANCE_PER_TX = 0.05; // sanctielijst + screening
const OVERHEAD_PER_TX = 0.80; // hosting + database + monitoring (verdeeld over ~1000 tx/mnd)

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

/**
 * Transfer kosten NL → TR (afhankelijk van snelheid)
 */
export function transferKosten(snelheid) {
  return snelheid === 'economy' ? 0.50 : 2.50;
}

/**
 * Volledige kostenstructuur — toont alle componenten
 *
 * @returns {object} Met alle deelposten + totaal + marge + klant fee
 */
export function berekenKosten(eurBedrag, methode = 'ideal', snelheid = 'express') {
  const bedrag = Math.max(0, parseFloat(eurBedrag) || 0);

  const mollie     = mollieKosten(bedrag, methode);
  const transfer   = transferKosten(snelheid);
  const fxSpread   = bedrag * FX_SPREAD_PCT;
  const compliance = COMPLIANCE_PER_TX;
  const overhead   = OVERHEAD_PER_TX;
  const marge      = bedrag * MARGE_PCT;

  const totaalKosten     = mollie + transfer + fxSpread + compliance + overhead;
  const klantBetaaltFee  = totaalKosten + marge;
  const effectievePct    = bedrag > 0 ? (klantBetaaltFee / bedrag) * 100 : 0;

  return {
    bedrag,
    mollie:     round(mollie),
    transfer:   round(transfer),
    fxSpread:   round(fxSpread),
    compliance: round(compliance),
    overhead:   round(overhead),
    marge:      round(marge),
    totaalKosten:    round(totaalKosten),
    klantBetaaltFee: round(klantBetaaltFee),
    effectievePct:   parseFloat(effectievePct.toFixed(2)),
  };
}

function round(n) { return Math.round(n * 100) / 100; }

/**
 * Vergelijk met Wise (referentiepunt voor klant)
 */
export function wiseTarief(eurBedrag) {
  const b = parseFloat(eurBedrag) || 0;
  // Wise: ~0,5% all-in voor EUR/TRY
  return round(b * 0.005);
}

/**
 * Vergelijk met Remitly — echte remittance concurrent
 * Express: €2,99 vast + ~1,5% FX markup (verborgen)
 * Economy: €0 fee + ~1% FX markup
 */
export function remitlyTarief(eurBedrag, snelheid = 'express') {
  const b = parseFloat(eurBedrag) || 0;
  if (snelheid === 'economy') {
    return round(b * 0.010); // 1% all-in
  }
  return round(2.99 + b * 0.015); // €2,99 fee + 1,5% FX markup
}

export const KOSTEN_LABELS = {
  mollie: { label: 'Betalingsverwerking', icon: '💳', uitleg: 'Mollie kosten voor jouw betaalmethode' },
  transfer: { label: 'Transfer NL → TR', icon: '🌍', uitleg: 'Geld doorsturen naar Turkse bank' },
  fxSpread: { label: 'Wisselkoers marge', icon: '💱', uitleg: '0,3% bovenop mid-market koers' },
  compliance: { label: 'Compliance & screening', icon: '🛡️', uitleg: 'Anti-fraud + sanctielijst check' },
  overhead: { label: 'Operationele kosten', icon: '⚙️', uitleg: 'Hosting + monitoring + support' },
  marge: { label: 'SwiftBridge marge', icon: '🌉', uitleg: '1,0% winst voor SwiftBridge' },
};

function round2(n) { return Math.round(n * 100) / 100; }
