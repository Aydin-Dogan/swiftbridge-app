/**
 * kybOpties.test.js — bewaakt de spiegel van de API-keuzecodes en de i18n-keys.
 *  - KEUZES is exact gelijk aan de vaste spiegel uit docs/KYB_API.md (2.1)
 *  - elke tKey in KYB_OPTIES bestaat in nl.js en is niet leeg
 *  - als de API-bron (swiftbridge-api/src/lib/kyb/keuzes.js) op schijf staat, is hij gelijk
 */
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { KEUZES, KYB_OPTIES, STAPPEN, AANTAL_STAPPEN, statusTKey, optieTKey, uboInvoerVereist, berekenVolgendeStap } from './kybOpties';
import { nl } from '../../i18n/nl';

const SPIEGEL = {
  RECHTSVORM: ['eenmanszaak', 'bv', 'vof', 'stichting', 'overig'],
  STRUCTUUR: ['enige_bestuurder', 'enige_eigenaar', 'meerdere_entiteiten', 'meerdere_bestuurders', 'meerdere_aandeelhouders'],
  KVK_BRON: ['kvk', 'kvk_mock', 'handmatig'],
  UBO_ROL: ['bestuurder', 'ubo', 'pseudo_ubo'],
  UBO_AARD: ['aandelen', 'stemrecht', 'eigendom', 'zeggenschap', 'pseudo'],
  UBO_PCT: ['25_50', '50_75', '75_100'],
  TX_PER_JAAR: ['lt_100', '100_500', '500_1000', 'gte_1000'],
  OMVANG_PER_TX: ['lt_100', '100_1k', '1k_10k', '10k_100k', 'gte_100k'],
  VOLUME_KWARTAAL: ['lt_10k', '10k_50k', '50k_150k', '150k_500k', 'gte_500k'],
  HERKOMST: ['omzet_onderneming', 'eigen_inbreng', 'investering_derden', 'lening', 'verkoop_activa', 'subsidie_overheid', 'overig'],
  JAAROMZET: ['lt_50k', '50k_100k', '100k_500k', '500k_1m', '1m_10m', 'gte_10m'],
  DOC_SOORT: ['kvk_uittreksel', 'statuten', 'aandeelhoudersregister', 'ubo_verklaring', 'info_antwoord', 'overig'],
  REDEN_CODE: ['identiteit_niet_verifieerbaar', 'kvk_niet_gevonden', 'kvk_afwijking', 'ubo_onvolledig', 'documenten_onleesbaar', 'doel_onduidelijk', 'sanctie', 'pep_niet_acceptabel', 'risico_te_hoog', 'overig'],
  CHECKLIST: ['identiteit_geverifieerd', 'kvk_gecontroleerd', 'ubo_compleet', 'sancties_gecontroleerd', 'pep_beoordeeld', 'doel_aard_begrepen'],
  STATUS: ['geen', 'concept', 'ingediend', 'in_behandeling', 'info_nodig', 'goedgekeurd', 'afgewezen', 'ingetrokken'],
};

describe('kybOpties — spiegel van api KEUZES', () => {
  test('KEUZES bevat exact de vaste spiegel (contract 2.1)', () => {
    for (const [groep, waarden] of Object.entries(SPIEGEL)) {
      expect([...KEUZES[groep]], groep).toEqual(waarden);
    }
  });

  test('KEUZES is bevroren', () => {
    expect(Object.isFrozen(KEUZES)).toBe(true);
    expect(Object.isFrozen(KEUZES.RECHTSVORM)).toBe(true);
  });

  test('elke tKey bestaat in nl.js en is niet leeg', () => {
    for (const [groep, opties] of Object.entries(KYB_OPTIES)) {
      expect(opties.length, groep).toBe(KEUZES[groep].length);
      for (const o of opties) {
        expect(typeof nl[o.tKey], `${groep}/${o.waarde} -> ${o.tKey}`).toBe('string');
        expect(nl[o.tKey].length, o.tKey).toBeGreaterThan(0);
      }
    }
  });

  test('stap-keys (label + titel) bestaan in nl.js', () => {
    expect(STAPPEN.length).toBe(AANTAL_STAPPEN);
    for (const s of STAPPEN) {
      expect(nl[s.labelKey], s.labelKey).toBeTruthy();
      expect(nl[s.titelKey], s.titelKey).toBeTruthy();
    }
  });

  test('status-keys bestaan in nl.js (geen -> concept-tekst)', () => {
    for (const status of KEUZES.STATUS) {
      expect(nl[statusTKey(status)], status).toBeTruthy();
    }
    expect(statusTKey('geen')).toBe('kyb_status_concept');
    expect(statusTKey('onzin')).toBe('kyb_status_concept');
  });

  test('optieTKey valt terug op de ruwe waarde bij onbekende groep/waarde', () => {
    expect(optieTKey('HERKOMST', 'lening')).toBe('kyb_herkomst_lening');
    expect(optieTKey('HERKOMST', 'bestaat_niet')).toBe('bestaat_niet');
    expect(optieTKey('DOC_SOORT', 'statuten')).toBe('statuten');
  });

  test('bedrijfsregels 1.5: UBO-invoer alleen als de aanvrager niet de enige is', () => {
    expect(uboInvoerVereist('eenmanszaak', [])).toBe(false);
    expect(uboInvoerVereist('bv', ['enige_bestuurder', 'enige_eigenaar'])).toBe(false);
    expect(uboInvoerVereist('bv', ['enige_bestuurder'])).toBe(true);
    expect(uboInvoerVereist('vof', ['meerdere_aandeelhouders'])).toBe(true);
    expect(uboInvoerVereist(null, [])).toBe(false);
  });

  test('berekenVolgendeStap geeft de eerste open stap', () => {
    expect(berekenVolgendeStap([])).toBe(1);
    expect(berekenVolgendeStap([1, 2])).toBe(3);
    expect(berekenVolgendeStap([1, 2, 4])).toBe(3);
    expect(berekenVolgendeStap([1, 2, 3, 4, 5, 6, 7])).toBe(7);
  });

  test('gelijk aan de API-bron als die naast deze repo staat', () => {
    const apiPad = path.resolve(process.cwd(), '..', 'swiftbridge-api', 'src', 'lib', 'kyb', 'keuzes.js');
    if (!fs.existsSync(apiPad)) return; // losse checkout van alleen de app: overslaan
    const require = createRequire(import.meta.url);
    const api = require(apiPad);
    for (const [groep, waarden] of Object.entries(SPIEGEL)) {
      expect([...api.KEUZES[groep]], `api ${groep}`).toEqual(waarden);
    }
  });
});
