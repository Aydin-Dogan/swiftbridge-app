#!/usr/bin/env node
/**
 * pricing-consistency.mjs — Verifieert dat marketing-copy in alle talen
 * geen verouderde pricing-strings bevat.
 *
 * Faalt op alle voorkomens van het OUDE flat-fee verhaal:
 *   - "vaste fee €1,99" / "flat fee €1.99" / "sabit ücret €1,99"
 *   - "1,2% wisselkoers" / "1.2% exchange" / "%1,2 kur"
 *
 * Toegestaan blijven verwijzingen naar minimum fees (€1,99 als minimum,
 * niet als "vaste fee").
 */

import { nl } from '../src/i18n/nl.js';
import { en } from '../src/i18n/en.js';
import { tr } from '../src/i18n/tr.js';
import { ru } from '../src/i18n/ru.js';
import { az } from '../src/i18n/az.js';

const TALEN = { nl, en, tr, ru, az };

// Patronen die op verouderde pricing-claims duiden
const BAD_PATTERNS = [
  /vaste\s+fee/i,
  /flat\s+fee/i,
  /sabit\s+(işlem\s+)?üc?ret/i,
  /1,99\s+sabit/i,
  /€\s*1,99\s+vast/i,
  /€\s*1\.99\s+flat/i,
  /1,99\s+(per\s+)?(transfer|overboeking|transaction|işlem|köçürmə)/i,
  /1\.99\s+(per\s+)?(transfer|transaction)/i,
  /1,2%?\s+wisselkoers?marge/i,
  /1\.2%?\s+exchange\s+rate\s+margin/i,
  /%1,2\s+(kur|döviz)/i,
];

let problemen = 0;
console.log('\n🔍 Pricing-consistency check\n');

for (const [code, dict] of Object.entries(TALEN)) {
  const issues = [];
  for (const [key, value] of Object.entries(dict)) {
    if (typeof value !== 'string') continue;
    for (const pat of BAD_PATTERNS) {
      if (pat.test(value)) {
        // Skip 'minimum fee €1,99' soort context — die is OK
        if (/minimum\s+fee/i.test(value)) continue;
        if (/minimum\s+(ücret|komissiya|комиссия)/i.test(value)) continue;
        issues.push({ key, value: value.slice(0, 100), pattern: pat.source });
        break; // één hit per key is genoeg
      }
    }
  }
  if (issues.length === 0) {
    console.log(`✅ ${code.toUpperCase()}: geen verouderde pricing-strings`);
  } else {
    console.log(`⚠️ ${code.toUpperCase()}: ${issues.length} probleem(en):`);
    for (const i of issues) {
      console.log(`   - ${i.key}: matched "${i.pattern}"`);
      console.log(`     → "${i.value}..."`);
    }
    problemen += issues.length;
  }
}

console.log();
if (problemen === 0) {
  console.log('🎉 Alle pricing-strings consistent met huidige tariefkaart.\n');
  process.exit(0);
} else {
  console.log(`Totaal ${problemen} verouderde pricing-strings.\n`);
  if (process.argv.includes('--strict')) process.exit(1);
}
