/**
 * TrBankenSteun.jsx — Visuele trust banner met alle TR banken die wij ondersteunen
 * Geeft klant vertrouwen dat hun familie/vrienden bij elke grote TR bank geld kunnen ontvangen
 */

export const TR_BANKEN = [
  { id: 'ziraat',    naam: 'Ziraat Bankası',    kort: 'Ziraat',    kleur: '#E30614', icon: '🌾' },
  { id: 'isbank',    naam: 'Türkiye İş Bankası', kort: 'İş Bank',   kleur: '#0067A5', icon: '$' },
  { id: 'garanti',   naam: 'Garanti BBVA',      kort: 'Garanti',   kleur: '#1B8B47', icon: '✦' },
  { id: 'akbank',    naam: 'Akbank',            kort: 'AKBANK',    kleur: '#E2231A', icon: '◆' },
  { id: 'yapikredi', naam: 'Yapı Kredi',        kort: 'YapıKredi', kleur: '#005CA9', icon: '∞' },
  { id: 'vakif',     naam: 'VakıfBank',         kort: 'VakıfBank', kleur: '#FFCC00', icon: 'V' },
  { id: 'halkbank',  naam: 'Halkbank',          kort: 'Halkbank',  kleur: '#005EB8', icon: 'H' },
  { id: 'kuveyt',    naam: 'KuveytTürk',        kort: 'KuveytTürk', kleur: '#00773E', icon: 'K' },
  { id: 'denizbank', naam: 'DenizBank',         kort: 'DenizBank', kleur: '#009BCB', icon: '~' },
  { id: 'qnb',       naam: 'QNB Finansbank',    kort: 'QNB',       kleur: '#88216B', icon: 'Q' },
  { id: 'ing',       naam: 'ING Türkiye',       kort: 'ING',       kleur: '#FF6200', icon: 'I' },
  { id: 'teb',       naam: 'TEB',               kort: 'TEB',       kleur: '#00853F', icon: 'T' },
  { id: 'enpara',    naam: 'Enpara.com',        kort: 'Enpara',    kleur: '#5046E5', icon: 'e' },
  { id: 'papara',    naam: 'Papara (wallet)',   kort: 'Papara',    kleur: '#7B2CBF', icon: '⌬' },
  { id: 'ininal',    naam: 'Ininal (wallet)',   kort: 'Ininal',    kleur: '#E91E63', icon: '◉' },
  { id: 'paycell',   naam: 'Paycell (wallet)',  kort: 'Paycell',   kleur: '#00B5F1', icon: '⊕' },
];

function BankPil({ bank, size = 'md' }) {
  const sizes = {
    sm: 'px-2.5 py-1.5 text-[10px] gap-1',
    md: 'px-3 py-2 text-xs gap-1.5',
    lg: 'px-4 py-2.5 text-sm gap-2',
  };
  return (
    <div
      className={`inline-flex items-center rounded-full font-bold border-2 shadow-sm bg-white ${sizes[size]}`}
      style={{ borderColor: bank.kleur, color: bank.kleur }}
      title={bank.naam}
    >
      <span className="font-mono">{bank.icon}</span>
      <span>{bank.kort}</span>
    </div>
  );
}

export default function TrBankenSteun({ titel, ondertitel, size = 'md', compact = false }) {
  return (
    <div className="text-center">
      {titel && <h3 className="font-bold text-gray-800 text-lg mb-1">{titel}</h3>}
      {ondertitel && <p className="text-gray-500 text-sm mb-4">{ondertitel}</p>}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(compact ? TR_BANKEN.slice(0, 8) : TR_BANKEN).map(bank => (
          <BankPil key={bank.id} bank={bank} size={size} />
        ))}
      </div>
      {!compact && (
        <p className="text-[11px] text-gray-400 mt-3">
          Logo's en handelsnamen zijn eigendom van de banken zelf. Vermelding betekent niet dat zij ons sponsoren.
        </p>
      )}
    </div>
  );
}
