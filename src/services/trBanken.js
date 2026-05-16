/**
 * trBanken.js — Complete lijst van alle banken in Turkije
 * Bron: BDDK (Bankacılık Düzenleme ve Denetleme Kurumu) — mei 2026
 *
 * Categorieën:
 *   - publiek    : Staatsbanken (4)
 *   - prive      : Particuliere banken (9)
 *   - buitenlands: Buitenlandse banken in TR (6)
 *   - deelname   : Katılım (Islamitisch) banken (6)
 *   - digitaal   : Volledig digitale banken (3)
 *   - wallet     : E-money / wallet providers (5)
 *
 * Symbool = unicode karakter dat lijkt op echt logo (juridisch veilig).
 * Kleur = officiële brand kleur per bank.
 */

export const TR_BANKEN_COMPLEET = [
  // ───────── PUBLIEKE BANKEN ─────────
  { id: 'ziraat',       naam: 'Ziraat Bankası',           categorie: 'publiek',     kleur: '#E30614', symbool: '🌾', code: 'TCZB', volgnr: 10 },
  { id: 'vakifbank',    naam: 'VakıfBank',                categorie: 'publiek',     kleur: '#FFCC00', symbool: 'V',  code: 'TVBA', volgnr: 15 },
  { id: 'halkbank',     naam: 'Halkbank',                 categorie: 'publiek',     kleur: '#005EB8', symbool: 'H',  code: 'TRHB', volgnr: 12 },
  { id: 'emlakkatilim', naam: 'Türkiye Emlak Katılım',    categorie: 'publiek',     kleur: '#005C9F', symbool: '⌂',  code: 'EKAT', volgnr: 213 },

  // ───────── PARTICULIERE BANKEN ─────────
  { id: 'isbank',       naam: 'Türkiye İş Bankası',       categorie: 'prive',       kleur: '#0067A5', symbool: '$',  code: 'ISBK', volgnr: 64 },
  { id: 'garanti',      naam: 'Garanti BBVA',             categorie: 'prive',       kleur: '#1B8B47', symbool: '✦',  code: 'TGBA', volgnr: 62 },
  { id: 'akbank',       naam: 'Akbank',                   categorie: 'prive',       kleur: '#E2231A', symbool: '◆',  code: 'AKBK', volgnr: 46 },
  { id: 'yapikredi',    naam: 'Yapı Kredi',               categorie: 'prive',       kleur: '#005CA9', symbool: '∞',  code: 'YAPI', volgnr: 67 },
  { id: 'denizbank',    naam: 'DenizBank',                categorie: 'prive',       kleur: '#009BCB', symbool: '~',  code: 'DENI', volgnr: 134 },
  { id: 'qnb',          naam: 'QNB Türkiye',              categorie: 'prive',       kleur: '#88216B', symbool: 'Q',  code: 'FNNB', volgnr: 111 },
  { id: 'teb',          naam: 'TEB',                      categorie: 'prive',       kleur: '#00853F', symbool: 'T',  code: 'TEBU', volgnr: 32 },
  { id: 'sekerbank',    naam: 'Şekerbank',                categorie: 'prive',       kleur: '#00833F', symbool: 'Ş',  code: 'SKEK', volgnr: 59 },
  { id: 'anadolubank',  naam: 'Anadolubank',              categorie: 'prive',       kleur: '#003D7E', symbool: 'A',  code: 'ANAB', volgnr: 135 },
  { id: 'alternatif',   naam: 'Alternatif Bank',          categorie: 'prive',       kleur: '#E40521', symbool: 'a',  code: 'ABNK', volgnr: 124 },
  { id: 'fibabanka',    naam: 'Fibabanka',                categorie: 'prive',       kleur: '#5BC0EB', symbool: 'F',  code: 'FBHL', volgnr: 103 },
  { id: 'odeabank',     naam: 'Odea Bank',                categorie: 'prive',       kleur: '#1F2860', symbool: 'O',  code: 'ODEA', volgnr: 146 },
  { id: 'burgan',       naam: 'Burgan Bank',              categorie: 'prive',       kleur: '#A1B5CC', symbool: 'B',  code: 'EYPB', volgnr: 125 },

  // ───────── BUITENLANDSE BANKEN ─────────
  { id: 'ing',          naam: 'ING Türkiye',              categorie: 'buitenlands', kleur: '#FF6200', symbool: 'I',  code: 'OYAK', volgnr: 99 },
  { id: 'hsbc',         naam: 'HSBC Türkiye',             categorie: 'buitenlands', kleur: '#DB0011', symbool: 'h',  code: 'HSBC', volgnr: 123 },
  { id: 'citi',         naam: 'Citibank Türkiye',         categorie: 'buitenlands', kleur: '#003B71', symbool: 'C',  code: 'CITI', volgnr: 92 },
  { id: 'icbc',         naam: 'ICBC Turkey',              categorie: 'buitenlands', kleur: '#C8102E', symbool: '工', code: 'TBTC', volgnr: 96 },
  { id: 'arap',         naam: 'Arap Türk Bankası',        categorie: 'buitenlands', kleur: '#1A4D8C', symbool: '⌃',  code: 'ARAP', volgnr: 100 },
  { id: 'jpmorgan',     naam: 'JPMorgan Chase Türkiye',   categorie: 'buitenlands', kleur: '#03224C', symbool: 'J',  code: 'CHAS', volgnr: 98 },

  // ───────── KATILIM (DEELNAME) BANKEN ─────────
  { id: 'kuveyt',       naam: 'KuveytTürk',               categorie: 'deelname',    kleur: '#00773E', symbool: 'K',  code: 'KTEF', volgnr: 205 },
  { id: 'albaraka',     naam: 'Albaraka Türk',            categorie: 'deelname',    kleur: '#005C30', symbool: '☪',  code: 'ALBR', volgnr: 203 },
  { id: 'turkfinans',   naam: 'Türkiye Finans Katılım',   categorie: 'deelname',    kleur: '#005DAA', symbool: '⌘',  code: 'TFKB', volgnr: 206 },
  { id: 'vakifkatilim', naam: 'Vakıf Katılım',            categorie: 'deelname',    kleur: '#005C9F', symbool: 'v',  code: 'VAKF', volgnr: 210 },
  { id: 'ziraatkatilim',naam: 'Ziraat Katılım',           categorie: 'deelname',    kleur: '#E30614', symbool: 'z',  code: 'ZKAT', volgnr: 209 },
  { id: 'hayat',        naam: 'Hayat Finans Katılım',     categorie: 'deelname',    kleur: '#E84B30', symbool: 'h',  code: 'HFKB', volgnr: 215 },

  // ───────── DIGITALE BANKEN ─────────
  { id: 'enpara',       naam: 'Enpara.com',               categorie: 'digitaal',    kleur: '#5046E5', symbool: 'e',  code: 'ENPA', volgnr: 111 },
  { id: 'colendi',      naam: 'Colendi Bank',             categorie: 'digitaal',    kleur: '#7E22CE', symbool: 'c',  code: 'CLND', volgnr: 425 },
  { id: 'nkolay',       naam: 'N Kolay',                  categorie: 'digitaal',    kleur: '#0070BA', symbool: 'n',  code: 'NKOL', volgnr: 143 },

  // ───────── WALLETS / E-MONEY ─────────
  { id: 'papara',       naam: 'Papara',                   categorie: 'wallet',      kleur: '#7B2CBF', symbool: '⌬',  code: 'PAPA', volgnr: null },
  { id: 'ininal',       naam: 'Ininal',                   categorie: 'wallet',      kleur: '#E91E63', symbool: '◉',  code: 'ININ', volgnr: null },
  { id: 'paycell',      naam: 'Paycell',                  categorie: 'wallet',      kleur: '#00B5F1', symbool: '⊕',  code: 'PCEL', volgnr: null },
  { id: 'istpay',       naam: 'İstPay',                   categorie: 'wallet',      kleur: '#003D8F', symbool: '✈',  code: 'ISPY', volgnr: null },
  { id: 'sender',       naam: 'Sender',                   categorie: 'wallet',      kleur: '#E91E63', symbool: 'S',  code: 'SNDR', volgnr: null },
  { id: 'upt',          naam: 'UPT Money Transfer',       categorie: 'wallet',      kleur: '#F2691F', symbool: '⟳',  code: 'UPT',  volgnr: null },
];

export const CATEGORIE_LABELS = {
  publiek:     { naam: 'Publieke banken',       icon: '🏛️', volgorde: 1 },
  prive:       { naam: 'Particuliere banken',   icon: '🏦', volgorde: 2 },
  buitenlands: { naam: 'Buitenlandse banken',   icon: '🌍', volgorde: 3 },
  deelname:    { naam: 'Katılım banken',        icon: '☪', volgorde: 4 },
  digitaal:    { naam: 'Digitale banken',       icon: '📱', volgorde: 5 },
  wallet:      { naam: 'Wallets / E-money',     icon: '👛', volgorde: 6 },
};

export function bankenPerCategorie() {
  const groups = {};
  for (const cat of Object.keys(CATEGORIE_LABELS)) groups[cat] = [];
  for (const b of TR_BANKEN_COMPLEET) {
    if (groups[b.categorie]) groups[b.categorie].push(b);
  }
  return groups;
}

export function getBank(idOfNaam) {
  return TR_BANKEN_COMPLEET.find(b => b.id === idOfNaam || b.naam === idOfNaam) || TR_BANKEN_COMPLEET[0];
}

export const AANTAL_BANKEN = TR_BANKEN_COMPLEET.length;
