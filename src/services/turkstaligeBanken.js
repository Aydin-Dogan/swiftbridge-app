/**
 * turkstaligeBanken.js — Banken in alle Turkstalige landen
 *
 * Landen: TR (Turkije), AZ (Azerbeidzjan), KZ (Kazachstan),
 * UZ (Oezbekistan), TM (Turkmenistan), KG (Kirgizië),
 * TJ (Tadzjikistan — bonus)
 *
 * Categorieën per land:
 * - publiek : Staatsbanken
 * - prive : Particuliere banken
 * - buitenlands: Buitenlandse banken
 * - digitaal : Volledig digitale banken
 * - wallet : E-money / wallet providers
 *
 * Bron: Centrale banken per land (mei 2026)
 */

// ═══════════════════════════════ AZERBEIDZJAN ═══════════════════════════════
export const AZ_BANKEN = [
  { id: 'az-kapital', naam: 'Kapital Bank', land: 'AZ', categorie: 'prive', kleur: '#E40521', symbool: 'K' },
  { id: 'az-pasha', naam: 'Pasha Bank', land: 'AZ', categorie: 'prive', kleur: '#003F8F', symbool: 'P' },
  { id: 'az-iba', naam: 'International Bank of Azerbaijan', land: 'AZ', categorie: 'publiek', kleur: '#003D7E', symbool: 'I' },
  { id: 'az-unibank', naam: 'Unibank', land: 'AZ', categorie: 'prive', kleur: '#005EB8', symbool: 'U' },
  { id: 'az-xalq', naam: 'Xalq Bank', land: 'AZ', categorie: 'publiek', kleur: '#E40521', symbool: 'X' },
  { id: 'az-access', naam: 'AccessBank', land: 'AZ', categorie: 'prive', kleur: '#005A9C', symbool: 'A' },
  { id: 'az-bakubank', naam: 'Bank of Baku', land: 'AZ', categorie: 'prive', kleur: '#7B2CBF', symbool: 'B' },
  { id: 'az-ykbaz', naam: 'Yapı Kredi Azerbaycan', land: 'AZ', categorie: 'buitenlands', kleur: '#005CA9', symbool: 'Y' },
  { id: 'az-btb', naam: 'Bank BTB', land: 'AZ', categorie: 'prive', kleur: '#1B8B47', symbool: 'b' },
  { id: 'az-turanbank', naam: 'TuranBank', land: 'AZ', categorie: 'prive', kleur: '#00A551', symbool: 'T' },
  { id: 'az-agbank', naam: 'AG Bank', land: 'AZ', categorie: 'prive', kleur: '#005EB8', symbool: 'a' },
  { id: 'az-nikoil', naam: 'Nikoil Bank', land: 'AZ', categorie: 'prive', kleur: '#F26522', symbool: 'N' },
  { id: 'az-yelo', naam: 'Yelo Bank', land: 'AZ', categorie: 'digitaal', kleur: '#FFD600', symbool: 'y' },
  { id: 'az-m10', naam: 'm10 (Azerpost)', land: 'AZ', categorie: 'wallet', kleur: '#0067A5', symbool: 'm' },
];

// ═══════════════════════════════ KAZACHSTAN ═══════════════════════════════
export const KZ_BANKEN = [
  { id: 'kz-halyk', naam: 'Halyk Bank', land: 'KZ', categorie: 'prive', kleur: '#00C04B', symbool: 'H' },
  { id: 'kz-kaspi', naam: 'Kaspi Bank', land: 'KZ', categorie: 'digitaal', kleur: '#F14C28', symbool: 'K' },
  { id: 'kz-centercredit', naam: 'Bank CenterCredit', land: 'KZ', categorie: 'prive', kleur: '#005EB8', symbool: 'C' },
  { id: 'kz-atfbank', naam: 'ATFBank', land: 'KZ', categorie: 'prive', kleur: '#E40521', symbool: 'A' },
  { id: 'kz-forte', naam: 'Forte Bank', land: 'KZ', categorie: 'prive', kleur: '#005A9C', symbool: 'F' },
  { id: 'kz-eurasian', naam: 'Eurasian Bank', land: 'KZ', categorie: 'prive', kleur: '#E40521', symbool: 'E' },
  { id: 'kz-icbc', naam: 'ICBC Almaty', land: 'KZ', categorie: 'buitenlands', kleur: '#C8102E', symbool: '工' },
  { id: 'kz-rbk', naam: 'Bank RBK', land: 'KZ', categorie: 'prive', kleur: '#0067A5', symbool: 'R' },
  { id: 'kz-jusan', naam: 'Jusan Bank', land: 'KZ', categorie: 'prive', kleur: '#FF9800', symbool: 'J' },
  { id: 'kz-freedom', naam: 'Freedom Bank', land: 'KZ', categorie: 'prive', kleur: '#1B8B47', symbool: 'f' },
  { id: 'kz-altyn', naam: 'Altyn Bank', land: 'KZ', categorie: 'prive', kleur: '#FFD600', symbool: 'a' },
  { id: 'kz-vtb', naam: 'VTB Kazachstan', land: 'KZ', categorie: 'buitenlands', kleur: '#005FA9', symbool: 'V' },
  { id: 'kz-onay', naam: 'Onay Wallet', land: 'KZ', categorie: 'wallet', kleur: '#00A551', symbool: 'O' },
];

// ═══════════════════════════════ OEZBEKISTAN ═══════════════════════════════
export const UZ_BANKEN = [
  { id: 'uz-nbu', naam: 'National Bank of Uzbekistan', land: 'UZ', categorie: 'publiek', kleur: '#005EB8', symbool: 'N' },
  { id: 'uz-asaka', naam: 'Asaka Bank', land: 'UZ', categorie: 'publiek', kleur: '#1B8B47', symbool: 'A' },
  { id: 'uz-ipoteka', naam: 'Ipoteka Bank', land: 'UZ', categorie: 'prive', kleur: '#E40521', symbool: 'I' },
  { id: 'uz-hamkorbank', naam: 'Hamkorbank', land: 'UZ', categorie: 'prive', kleur: '#0099B5', symbool: 'H' },
  { id: 'uz-kapital', naam: 'Kapitalbank', land: 'UZ', categorie: 'prive', kleur: '#005EB8', symbool: 'K' },
  { id: 'uz-sqb', naam: 'Sanoatqurilishbank', land: 'UZ', categorie: 'publiek', kleur: '#005A9C', symbool: 'S' },
  { id: 'uz-ipakyoli', naam: 'Ipak Yo\'li Bank', land: 'UZ', categorie: 'prive', kleur: '#FFD600', symbool: 'i' },
  { id: 'uz-mkbank', naam: 'Mikrokreditbank', land: 'UZ', categorie: 'publiek', kleur: '#00A551', symbool: 'm' },
  { id: 'uz-trust', naam: 'Trustbank', land: 'UZ', categorie: 'prive', kleur: '#005EB8', symbool: 'T' },
  { id: 'uz-aloqa', naam: 'Aloqabank', land: 'UZ', categorie: 'prive', kleur: '#003F8F', symbool: 'a' },
  { id: 'uz-turkiston', naam: 'Turkiston Bank', land: 'UZ', categorie: 'prive', kleur: '#005A9C', symbool: 't' },
  { id: 'uz-tbc', naam: 'TBC Bank Uzbekistan', land: 'UZ', categorie: 'digitaal', kleur: '#0070BA', symbool: 'b' },
  { id: 'uz-anor', naam: 'Anor Bank', land: 'UZ', categorie: 'digitaal', kleur: '#F26522', symbool: 'n' },
  { id: 'uz-click', naam: 'Click Wallet', land: 'UZ', categorie: 'wallet', kleur: '#1B8B47', symbool: 'C' },
  { id: 'uz-payme', naam: 'Payme', land: 'UZ', categorie: 'wallet', kleur: '#5046E5', symbool: 'P' },
];

// ═══════════════════════════════ TURKMENISTAN ═══════════════════════════════
export const TM_BANKEN = [
  { id: 'tm-state', naam: 'Türkmen Devlet Bankası', land: 'TM', categorie: 'publiek', kleur: '#00853E', symbool: 'D' },
  { id: 'tm-daikhan', naam: 'Daikhanbank', land: 'TM', categorie: 'publiek', kleur: '#1B8B47', symbool: 'd' },
  { id: 'tm-halkbank', naam: 'Halkbank TM', land: 'TM', categorie: 'publiek', kleur: '#005EB8', symbool: 'H' },
  { id: 'tm-turkmenbasy', naam: 'Türkmenbaşy Bank', land: 'TM', categorie: 'publiek', kleur: '#005A9C', symbool: 't' },
  { id: 'tm-senagat', naam: 'Senagat Bank', land: 'TM', categorie: 'publiek', kleur: '#C1272D', symbool: 'S' },
  { id: 'tm-garagum', naam: 'Garagum Bank', land: 'TM', categorie: 'prive', kleur: '#FF9800', symbool: 'G' },
  { id: 'tm-rysgal', naam: 'Rysgal Bank', land: 'TM', categorie: 'prive', kleur: '#005EB8', symbool: 'R' },
  { id: 'tm-prezident', naam: 'Prezident Bank', land: 'TM', categorie: 'prive', kleur: '#FFD600', symbool: 'P' },
];

// ═══════════════════════════════ KIRGIZIË ═══════════════════════════════
export const KG_BANKEN = [
  { id: 'kg-dkib', naam: 'Demir Kyrgyz International Bank', land: 'KG', categorie: 'buitenlands', kleur: '#E8112D', symbool: 'D' },
  { id: 'kg-kompanion', naam: 'Kompanion Bank', land: 'KG', categorie: 'prive', kleur: '#1B8B47', symbool: 'K' },
  { id: 'kg-kicb', naam: 'KICB', land: 'KG', categorie: 'prive', kleur: '#005EB8', symbool: 'k' },
  { id: 'kg-ayil', naam: 'Ayil Bank', land: 'KG', categorie: 'publiek', kleur: '#FFD600', symbool: 'A' },
  { id: 'kg-optima', naam: 'Optima Bank', land: 'KG', categorie: 'prive', kleur: '#003D7E', symbool: 'O' },
  { id: 'kg-rsk', naam: 'RSK Bank', land: 'KG', categorie: 'publiek', kleur: '#E40521', symbool: 'R' },
  { id: 'kg-eldik', naam: 'Eldik Bank', land: 'KG', categorie: 'prive', kleur: '#005A9C', symbool: 'E' },
  { id: 'kg-bakai', naam: 'Bakai Bank', land: 'KG', categorie: 'prive', kleur: '#FFD600', symbool: 'B' },
  { id: 'kg-asia', naam: 'Bank of Asia', land: 'KG', categorie: 'prive', kleur: '#003D7E', symbool: 'a' },
  { id: 'kg-halyk', naam: 'Halyk Bank KG', land: 'KG', categorie: 'buitenlands', kleur: '#00C04B', symbool: 'h' },
  { id: 'kg-doscredo', naam: 'DOSCREDOBANK', land: 'KG', categorie: 'prive', kleur: '#005EB8', symbool: 'd' },
  { id: 'kg-capital', naam: 'Capital Bank KG', land: 'KG', categorie: 'prive', kleur: '#1B8B47', symbool: 'c' },
  { id: 'kg-o', naam: 'O! Wallet', land: 'KG', categorie: 'wallet', kleur: '#FF9800', symbool: 'o' },
  { id: 'kg-balance', naam: 'Balance.kg', land: 'KG', categorie: 'wallet', kleur: '#5046E5', symbool: '⌬' },
  { id: 'kg-elqr', naam: 'ELQR Wallet', land: 'KG', categorie: 'wallet', kleur: '#7B2CBF', symbool: 'q' },
];

// ═══════════════════════════════ TADZJIKISTAN (bonus) ═══════════════════════════════
export const TJ_BANKEN = [
  { id: 'tj-amonatbonk', naam: 'Amonatbonk', land: 'TJ', categorie: 'publiek', kleur: '#E40521', symbool: 'A' },
  { id: 'tj-spitamen', naam: 'Spitamen Bank', land: 'TJ', categorie: 'prive', kleur: '#005EB8', symbool: 'S' },
  { id: 'tj-eskhata', naam: 'Bank Eskhata', land: 'TJ', categorie: 'prive', kleur: '#005A9C', symbool: 'E' },
  { id: 'tj-sodirot', naam: 'Tojiksodirotbonk', land: 'TJ', categorie: 'publiek', kleur: '#1B8B47', symbool: 'T' },
  { id: 'tj-orien', naam: 'Orienbank', land: 'TJ', categorie: 'prive', kleur: '#FF9800', symbool: 'O' },
  { id: 'tj-alif', naam: 'Alif Bank', land: 'TJ', categorie: 'digitaal', kleur: '#7B2CBF', symbool: 'a' },
  { id: 'tj-brzn', naam: 'Bonki Rushdi Sarmoyaguzori', land: 'TJ', categorie: 'prive', kleur: '#FFD600', symbool: 'B' },
];

// ═══════════════════════════════ TURKIJE (her-export uit trBanken.js) ═══════════════════════════════
import { TR_BANKEN_COMPLEET } from './trBanken';

// ═══════════════════════════════ MASTER LIJST ═══════════════════════════════
export const ALLE_TURKSTALIGE_BANKEN = [
  ...TR_BANKEN_COMPLEET,
  ...AZ_BANKEN,
  ...KZ_BANKEN,
  ...UZ_BANKEN,
  ...TM_BANKEN,
  ...KG_BANKEN,
  ...TJ_BANKEN,
];

export const LAND_INFO = {
  TR: { naam: 'Turkije', vlag: 'TR', valuta: 'TRY', volgorde: 1 },
  AZ: { naam: 'Azerbeidzjan', vlag: 'AZ', valuta: 'AZN', volgorde: 2 },
  KZ: { naam: 'Kazachstan', vlag: 'KZ', valuta: 'KZT', volgorde: 3 },
  UZ: { naam: 'Oezbekistan', vlag: 'UZ', valuta: 'UZS', volgorde: 4 },
  TM: { naam: 'Turkmenistan', vlag: 'TM', valuta: 'TMT', volgorde: 5 },
  KG: { naam: 'Kirgizië', vlag: 'KG', valuta: 'KGS', volgorde: 6 },
  TJ: { naam: 'Tadzjikistan', vlag: 'TJ', valuta: 'TJS', volgorde: 7 },
};

export const CATEGORIE_LABELS = {
  publiek: { naam: 'Publieke banken', icon: '🏛️', volgorde: 1 },
  prive: { naam: 'Particuliere banken', icon: '🏦', volgorde: 2 },
  buitenlands: { naam: 'Buitenlandse banken', icon: '🌍', volgorde: 3 },
  deelname: { naam: 'Katılım (Islamitisch)', icon: '☪', volgorde: 4 },
  digitaal: { naam: 'Digitale banken', icon: '📱', volgorde: 5 },
  wallet: { naam: 'Wallets / E-money', icon: '👛', volgorde: 6 },
};

export function bankenPerLand(landCode) {
  return ALLE_TURKSTALIGE_BANKEN.filter(b => (b.land || 'TR') === landCode);
}

export function bankenPerLandPerCategorie(landCode) {
  const banken = bankenPerLand(landCode);
  const groups = {};
  for (const cat of Object.keys(CATEGORIE_LABELS)) groups[cat] = [];
  for (const b of banken) {
    if (groups[b.categorie]) groups[b.categorie].push(b);
  }
  return groups;
}

export function totaalBankenPerLand() {
  const counts = {};
  for (const land of Object.keys(LAND_INFO)) {
    counts[land] = bankenPerLand(land).length;
  }
  return counts;
}

export const TOTAAL_BANKEN = ALLE_TURKSTALIGE_BANKEN.length;
