/**
 * Tests voor src/services/kosten.js — frontend pricing engine.
 *
 * Hier dezelfde tests als backend (swiftbridge-api/tests/kosten.test.js)
 * vertaald naar de frontend-API. Bewaakt dat front en back exact dezelfde
 * resultaten geven voor dezelfde input.
 */

import { describe, test, expect } from 'vitest';
import {
  berekenKosten,
  mollieKosten,
  transferKosten,
  zichtbarePercentage,
  tariefTier,
  methodeNaarTariefKolom,
  TARIEF_MATRIX,
  TARIEF_TIER_GRENZEN,
} from './kosten';

describe('berekenKosten()', () => {
  test('Express tier 0 (€100 iDEAL) — 2,0% van bedrag, boven minimum', () => {
    const r = berekenKosten(100, 'ideal', 'express', 36.20);
    expect(r.klantBetaaltFee).toBe(2.00);
    expect(r.zichtbarePct).toBe(2.0);
  });

  test('Express minimum fee kickt in bij micro-bedrag (€50 iDEAL)', () => {
    const r = berekenKosten(50, 'ideal', 'express', 36.20);
    expect(r.klantBetaaltFee).toBe(1.99);
  });

  test('Economy minimum fee (€50 SEPA) = €0,99', () => {
    const r = berekenKosten(50, 'sepa', 'economy', 36.20);
    expect(r.klantBetaaltFee).toBe(0.99);
  });

  test('Tier 1 (€500 iDEAL) = 1,5%', () => {
    const r = berekenKosten(500, 'ideal', 'express', 36.20);
    expect(r.klantBetaaltFee).toBe(7.50);
    expect(r.zichtbarePct).toBe(1.5);
  });

  test('Tier 4 (€5.000 iDEAL) = 0,8% (boven €2.500)', () => {
    const r = berekenKosten(5000, 'ideal', 'express', 36.20);
    expect(r.klantBetaaltFee).toBe(40.00);
    expect(r.zichtbarePct).toBe(0.8);
  });

  test('Card-kolom heeft hogere percentages dan iDEAL', () => {
    const ideal = berekenKosten(500, 'ideal', 'express', 36.20).klantBetaaltFee;
    const card = berekenKosten(500, 'card', 'express', 36.20).klantBetaaltFee;
    expect(card).toBeGreaterThan(ideal);
    expect(card).toBe(17.50); // 500 * 3.5%
  });

  test('Wero en Bancontact tellen als iDEAL-kolom', () => {
    expect(methodeNaarTariefKolom('wero')).toBe('ideal');
    expect(methodeNaarTariefKolom('bancontact')).toBe('ideal');
    const wero = berekenKosten(500, 'wero', 'express', 36.20);
    const ideal = berekenKosten(500, 'ideal', 'express', 36.20);
    expect(wero.klantBetaaltFee).toBe(ideal.klantBetaaltFee);
  });

  test('Express applied rate < mid-market (marge verborgen in koers)', () => {
    const r = berekenKosten(100, 'ideal', 'express', 36.20);
    expect(r.appliedRate).toBeLessThan(36.20);
    expect(r.appliedRate).toBeCloseTo(35.7656, 3);
  });

  test('ontvangenBedrag = (eurBedrag - fee) * appliedRate', () => {
    const r = berekenKosten(100, 'ideal', 'express', 36.20);
    const verwacht = (100 - r.klantBetaaltFee) * r.appliedRate;
    expect(r.ontvangenBedrag).toBeCloseTo(verwacht, 1);
  });

  test('Edge: bedrag 0 → totaleKostenPct = 0 (geen division-by-zero)', () => {
    const r = berekenKosten(0, 'ideal', 'express', 36.20);
    expect(r.totaleKostenPct).toBe(0);
    expect(Number.isFinite(r.totaleKostenPct)).toBe(true);
  });

  test('Default methode/snelheid/koers werken', () => {
    const r = berekenKosten(100);
    expect(r.klantBetaaltFee).toBe(2.00);
    expect(r.midMarketRate).toBe(36.20);
  });
});

describe('Tariefkaart helpers', () => {
  test('tariefTier: grenzen €200/€500/€1000/€2500', () => {
    expect(tariefTier(0)).toBe(0);
    expect(tariefTier(200)).toBe(0);
    expect(tariefTier(200.01)).toBe(1);
    expect(tariefTier(500)).toBe(1);
    expect(tariefTier(500.01)).toBe(2);
    expect(tariefTier(2500)).toBe(3);
    expect(tariefTier(10000)).toBe(4);
  });

  test('TARIEF_MATRIX matcht §4.4 (sync met backend)', () => {
    expect(TARIEF_MATRIX.ideal).toEqual([0.020, 0.015, 0.012, 0.010, 0.008]);
    expect(TARIEF_MATRIX.card).toEqual([0.035, 0.035, 0.032, 0.030, 0.028]);
    expect(TARIEF_MATRIX.klarna).toEqual([0.050, 0.050, 0.045, 0.040, 0.035]);
    expect(TARIEF_MATRIX.sepa).toEqual([0.012, 0.009, 0.007, 0.005, 0.004]);
  });

  test('TARIEF_TIER_GRENZEN', () => {
    expect(TARIEF_TIER_GRENZEN).toEqual([200, 500, 1000, 2500]);
  });

  test('zichtbarePercentage geeft nummer terug (geen Decimal in frontend)', () => {
    expect(zichtbarePercentage(500, 'ideal')).toBe(0.015);
    expect(zichtbarePercentage(1000, 'card')).toBe(0.032);
  });
});

describe('mollieKosten()', () => {
  test('iDEAL: vaste €0.29 ongeacht bedrag', () => {
    expect(mollieKosten(10, 'ideal')).toBe(0.29);
    expect(mollieKosten(1000, 'ideal')).toBe(0.29);
  });

  test('Creditcard: 1.8% + €0.25', () => {
    expect(mollieKosten(100, 'creditcard')).toBeCloseTo(2.05, 4);
  });

  test('SEPA: max(€0.29, 0.25% van bedrag)', () => {
    expect(mollieKosten(50, 'sepa')).toBe(0.29);
    expect(mollieKosten(500, 'sepa')).toBeCloseTo(1.25, 4);
  });
});

describe('transferKosten()', () => {
  test('Express = €2.50', () => {
    expect(transferKosten('express')).toBe(2.50);
  });
  test('Economy = €0.50', () => {
    expect(transferKosten('economy')).toBe(0.50);
  });
});
