/**
 * TrBankenSteun.jsx — Trust banner met ALLE 36 banken/wallets in Turkije
 * Gegroepeerd per categorie (publiek/prive/buitenlands/deelname/digitaal/wallet)
 */
import { TR_BANKEN_COMPLEET, CATEGORIE_LABELS, bankenPerCategorie, AANTAL_BANKEN } from '../services/trBanken';

export { TR_BANKEN_COMPLEET as TR_BANKEN }; // backward compat

function BankPil({ bank, size = 'md' }) {
  const sizes = {
    sm: 'px-2 py-1 text-[10px] gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };
  return (
    <div
      className={`inline-flex items-center rounded-full font-bold border-2 shadow-sm bg-white whitespace-nowrap ${sizes[size]}`}
      style={{ borderColor: bank.kleur, color: bank.kleur }}
      title={`${bank.naam}${bank.code ? ` (${bank.code})` : ''}`}
    >
      <span className="font-mono">{bank.symbool}</span>
      <span>{bank.naam.replace(/Türkiye |Bankası| Türk/g, '').trim()}</span>
    </div>
  );
}

export default function TrBankenSteun({ titel, ondertitel, size = 'sm', toonCategorieën = true }) {
  const groups = bankenPerCategorie();
  const cats = Object.entries(CATEGORIE_LABELS).sort((a, b) => a[1].volgorde - b[1].volgorde);

  return (
    <div className="text-center">
      {titel && <h3 className="font-bold text-gray-800 text-lg mb-1">{titel}</h3>}
      {ondertitel && <p className="text-gray-500 text-sm mb-4">{ondertitel}</p>}

      {toonCategorieën ? (
        <div className="space-y-4 max-w-3xl mx-auto">
          {cats.map(([catKey, catInfo]) => {
            const banken = groups[catKey] || [];
            if (!banken.length) return null;
            return (
              <div key={catKey} className="text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">{catInfo.naam}</span>
                  <span className="text-[10px] text-gray-400">({banken.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {banken.map(b => <BankPil key={b.id} bank={b} size={size} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {TR_BANKEN_COMPLEET.map(b => <BankPil key={b.id} bank={b} size={size} />)}
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-4">
        {AANTAL_BANKEN} banken & wallets ondersteund. Merknamen zijn eigendom van betreffende organisaties.
      </p>
    </div>
  );
}
