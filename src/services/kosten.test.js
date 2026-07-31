/**
 * Tests voor src/services/kosten.js — frontend pricing (transparant model).
 * Spiegelt de backend-tests (swiftbridge-api/tests/kosten.test.js) zodat
 * front en back exact dezelfde prijzen rekenen (bewaakt door matrixSync.test.js).
 */
import { describe, test, expect } from 'vitest';
import {
  berekenKosten,
  fxMarge,
  FEE_VAST,
  MIN_BEDRAG,
  MAX_BEDRAG,
  FX_MARGE_NIVEAUS,
} from './kosten';

describe('kosten.js — transparant prijsmodel (bouwbrief §8)', () => {
  test('bindende parameters', () => {
    expect(FEE_VAST).toBe(4.95);
    expect(MIN_BEDRAG).toBe(50);
    expect(MAX_BEDRAG).toBe(5000);
    expect(FX_MARGE_NIVEAUS.basis).toBe(0.012);
    expect(FX_MARGE_NIVEAUS.black).toBe(0.006);
  });

  test('vaste fee €4,95 ongeacht bedrag/methode/snelheid', () => {
    for (const [bedrag, methode, snelheid] of [[50, 'ideal', 'express'], [500, 'card', 'economy'], [5000, 'sepa', 'express']]) {
      const r = berekenKosten(bedrag, methode, snelheid, 36.20);
      expect(r.klantBetaaltFee).toBe(4.95);
    }
  });

  test('marge per niveau + fallback naar basis', () => {
    expect(fxMarge('basis')).toBe(0.012);
    expect(fxMarge('black')).toBe(0.006);
    expect(fxMarge('bestaat-niet')).toBe(0.012);
    expect(berekenKosten(500, 'ideal', 'express', 36.20, 'premium').fxMargePct).toBe(0.8);
  });

  test('applied rate transparant: mid-market minus getoonde marge', () => {
    const r = berekenKosten(500, 'ideal', 'express', 36.20);
    expect(r.appliedRate).toBeCloseTo(36.20 * (1 - 0.012), 3);
    expect(r.fxAfwijkingPct).toBe(1.2);
  });

  test('totale kosten = fee + marge over netto (PSD2-veld)', () => {
    const r = berekenKosten(500, 'ideal', 'express', 36.20);
    expect(r.totaleKostenEur).toBeCloseTo(4.95 + (500 - 4.95) * 0.012, 2);
    expect(r.fxKostenEur).toBeCloseTo((500 - 4.95) * 0.012, 2);
  });

  test('ontvangen bedrag = (bedrag - fee) × applied rate', () => {
    const r = berekenKosten(1000, 'ideal', 'express', 36.20);
    expect(r.ontvangenBedrag).toBeCloseTo((1000 - 4.95) * 36.20 * (1 - 0.012), 1);
  });

  test('edge cases: 0 en negatief geven geen negatieve uitkomsten', () => {
    expect(berekenKosten(0).ontvangenBedrag).toBe(0);
    expect(berekenKosten(-50).ontvangenBedrag).toBe(0);
    expect(berekenKosten('abc').bedrag).toBe(0);
  });
});
