#!/usr/bin/env node
/**
 * i18n-check.mjs — Verifieert dat alle taalbestanden dezelfde keys hebben.
 *
 * Gebruik:
 *   node scripts/i18n-check.mjs            # toon rapport
 *   node scripts/i18n-check.mjs --strict   # exit-code 1 bij ontbrekende keys (voor CI)
 *
 * NL is de reference-taal — andere talen mogen geen extra keys hebben en
 * mogen geen NL-keys missen.
 */

import { nl } from '../src/i18n/nl.js';
import { en } from '../src/i18n/en.js';
import { tr } from '../src/i18n/tr.js';
import { ru } from '../src/i18n/ru.js';
import { az } from '../src/i18n/az.js';

const REFERENCE = 'nl';
const TALEN = { nl, en, tr, ru, az };

const referenceKeys = new Set(Object.keys(TALEN[REFERENCE]));
const rapport = [];

for (const [code, dict] of Object.entries(TALEN)) {
  if (code === REFERENCE) continue;
  const keys = new Set(Object.keys(dict));
  const missend = [...referenceKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !referenceKeys.has(k));
  rapport.push({ code, missend, extra, totaal: keys.size });
}

console.log(`\n📊 i18n consistency rapport (reference: ${REFERENCE.toUpperCase()} = ${referenceKeys.size} keys)\n`);

let totaalProblemen = 0;
for (const r of rapport) {
  const status = r.missend.length === 0 && r.extra.length === 0 ? '✅' : '⚠️';
  console.log(`${status} ${r.code.toUpperCase()}: ${r.totaal} keys (${r.missend.length} missend, ${r.extra.length} extra)`);
  if (r.missend.length > 0) {
    console.log(`   ❌ Missend in ${r.code} (${r.missend.length}):`);
    r.missend.slice(0, 20).forEach((k) => console.log(`      - ${k}`));
    if (r.missend.length > 20) console.log(`      ... en ${r.missend.length - 20} meer`);
  }
  if (r.extra.length > 0) {
    console.log(`   ⚠️ Extra in ${r.code} (${r.extra.length}):`);
    r.extra.slice(0, 10).forEach((k) => console.log(`      + ${k}`));
    if (r.extra.length > 10) console.log(`      ... en ${r.extra.length - 10} meer`);
  }
  totaalProblemen += r.missend.length + r.extra.length;
  console.log();
}

if (totaalProblemen === 0) {
  console.log('🎉 Alle talen synchroon!\n');
  process.exit(0);
} else {
  console.log(`Totaal ${totaalProblemen} verschillen gevonden.\n`);
  if (process.argv.includes('--strict')) {
    process.exit(1);
  }
}
