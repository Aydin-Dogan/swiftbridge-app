/**
 * TurkstaligeBankenSteun.jsx — Trust banner met banken in ALLE Turkstalige landen
 * Gegroepeerd per land
 */
import { ALLE_TURKSTALIGE_BANKEN, LAND_INFO, bankenPerLand, TOTAAL_BANKEN } from '../services/turkstaligeBanken';
import Vlag from './Vlag';

function BankPil({ bank, size = 'sm' }) {
  const sizes = {
    sm: 'px-2 py-1 text-[10px] gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };
  // Kort de naam in als hij te lang is
  const kortNaam = bank.naam.length > 22 ? bank.naam.slice(0, 20) + '…' : bank.naam;
  return (
    <div
      className={`inline-flex items-center rounded-full font-bold border-2 shadow-sm bg-white whitespace-nowrap ${sizes[size]}`}
      style={{ borderColor: bank.kleur, color: bank.kleur }}
      title={bank.naam}
    >
      <span className="font-mono">{bank.symbool}</span>
      <span>{kortNaam}</span>
    </div>
  );
}

export default function TurkstaligeBankenSteun({ titel, ondertitel, size = 'sm' }) {
  const landen = Object.entries(LAND_INFO).sort((a, b) => a[1].volgorde - b[1].volgorde);

  return (
    <div className="text-center">
      {titel && <h3 className="font-bold text-gray-800 text-lg mb-1">{titel}</h3>}
      {ondertitel && <p className="text-gray-500 text-sm mb-6">{ondertitel}</p>}

      <div className="space-y-5 max-w-3xl mx-auto">
        {landen.map(([landCode, info]) => {
          const banken = bankenPerLand(landCode);
          if (!banken.length) return null;
          return (
            <div key={landCode} className="text-left bg-white/50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <Vlag land={info.vlag} size={22} />
                <span className="font-bold text-gray-800 text-sm">{info.naam}</span>
                <span className="text-[10px] text-gray-400">({banken.length} banken · {info.valuta})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {banken.map(b => <BankPil key={b.id} bank={b} size={size} />)}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-4">
        {TOTAAL_BANKEN} banken & wallets ondersteund in 7 Turkstalige landen. Merknamen zijn eigendom van betreffende organisaties.
      </p>
    </div>
  );
}
