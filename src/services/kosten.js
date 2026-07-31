/**
 * kosten.js — Transparant prijsmodel (frontend)
 * Spiegelt swiftbridge-api/src/services/kosten.js — houd beide in sync.
 *
 * MODEL (bouwbrief §8 + SwiftBridge-prijsstrategie-transparant, juli 2026 — BINDEND):
 *  1. Vaste fee €4,95 — zichtbaar, alle privé-niveaus, ongeacht methode/snelheid.
 *  2. Transparante FX-marge t.o.v. de mid-market/ECB-referentiekoers, per
 *     ledenniveau: Basis 1,2% → Plus 1,0% → Premium 0,8% → Black 0,6%.
 *     GEEN verborgen kosten: koers + marge worden getoond (EU CBPR2/PSD2).
 *  3. Minimum overboekbedrag €50, maximum €5.000 (Wwft-weeklimiet).
 */

export const FEE_VAST = 4.95;
export const MIN_BEDRAG = 50;
export const MAX_BEDRAG = 5000;

export const FX_MARGE_NIVEAUS = {
  basis:   0.012,
  plus:    0.010,
  premium: 0.008,
  black:   0.006,
};

export const NIVEAU_LABELS = { basis: 'Basis', plus: 'Plus', premium: 'Premium', black: 'Black' };

function round(n, dec = 4) { return Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec); }

export function fxMarge(niveau = 'basis') {
  return FX_MARGE_NIVEAUS[niveau] ?? FX_MARGE_NIVEAUS.basis;
}

/**
 * Hoofdberekening — transparant model. Zelfde return-shape als voorheen zodat
 * Hero/Pricing/PaymentFlow/Calculator ongewijzigd blijven werken.
 */
export function berekenKosten(eurBedrag, methode = 'ideal', snelheid = 'express', midMarketRate = 36.20, niveau = 'basis') {
  const bedrag = Math.max(0, parseFloat(eurBedrag) || 0);
  const marge = fxMarge(niveau);
  const fee = FEE_VAST;

  // Zichtbare kant — alles transparant
  const appliedRate = midMarketRate * (1 - marge);
  const nettoBedrag = Math.max(0, bedrag - fee);
  const ontvangenBedrag = nettoBedrag * appliedRate;

  // Marge-omzet in EUR (getoond als onderdeel van de totale kosten — PSD2/CBPR2)
  const fxKostenInEur = nettoBedrag * marge;
  const totaleKostenEur = fee + fxKostenInEur;
  const totaleKostenPct = bedrag > 0 ? (totaleKostenEur / bedrag) * 100 : 0;

  return {
    bedrag,
    klantBetaaltFee: round(fee, 2),
    feeVast: round(fee, 2),
    fxMargePct: round(marge * 100, 2),
    niveau,
    zichtbarePct: bedrag > 0 ? round((fee / bedrag) * 100, 2) : 0,
    appliedRate: round(appliedRate),
    midMarketRate: round(midMarketRate),
    fxKostenEur: round(fxKostenInEur, 2),
    totaleKostenEur: round(totaleKostenEur, 2),
    totaleKostenPct: round(totaleKostenPct, 2),
    fxAfwijkingPct: round(marge * 100, 2),
    ontvangenBedrag: round(ontvangenBedrag, 2),
    effectievePct: bedrag > 0 ? round(((bedrag - ontvangenBedrag / midMarketRate) / bedrag) * 100, 2) : 0,
  };
}

export const KOSTEN_LABELS = {
  fee: { label: 'Vaste servicekosten', uitleg: 'Eén vast bedrag per overboeking — geen verborgen kosten' },
};
