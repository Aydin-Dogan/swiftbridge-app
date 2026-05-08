import { useState } from 'react';

const maanden = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

const volumeData = [0, 0, 0, 0, 0, 0, 0, 0, 100, 250, 500, 1000];
const maxVolume = Math.max(...volumeData);

const kpis = [
  { label: 'Actieve gebruikers', waarde: '2.847', delta: '+12%', kleur: 'blue', icoon: '👥' },
  { label: 'Maandvolume', waarde: '€1,2M', delta: '+8%', kleur: 'green', icoon: '💶' },
  { label: 'KYC conversie', waarde: '73%', delta: '+3%', kleur: 'purple', icoon: '✅' },
  { label: 'Gem. transactie', waarde: '€487', delta: '-2%', kleur: 'orange', icoon: '↗️' },
];

const recenteTransacties = [
  { naam: 'Aydin D.', bedrag: '€500', try: '₺18.007', tijd: '2 min geleden', status: 'voltooid' },
  { naam: 'Mehmet Y.', bedrag: '€250', try: '₺9.003', tijd: '7 min geleden', status: 'voltooid' },
  { naam: 'Fatma K.', bedrag: '€1.200', try: '₺43.217', tijd: '12 min geleden', status: 'voltooid' },
  { naam: 'Ali R.', bedrag: '€150', try: '₺5.401', tijd: '18 min geleden', status: 'in_behandeling' },
  { naam: 'Zeynep M.', bedrag: '€800', try: '₺28.811', tijd: '25 min geleden', status: 'voltooid' },
];

const kleurMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
};

function MiniGrafiek({ data, max, kleur }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <div
            className={`rounded-sm ${kleur} opacity-80`}
            style={{ height: `${max > 0 ? (v / max) * 100 : 0}%`, minHeight: v > 0 ? 2 : 0 }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [actievePeriode, setActievePeriode] = useState('Jaar 1');

  const jaarData = {
    'Jaar 1': { gebruikers: '3K–5K', volume: '€1,2M/mnd', omzet: '€317K', resultaat: '-€554K', break_even: 'Mnd 21-22' },
    'Jaar 2': { gebruikers: '15K–25K', volume: '€7,5M/mnd', omzet: '€1,98M', resultaat: '+€1,2M', break_even: '✅ Bereikt' },
    'Jaar 3': { gebruikers: '40K–60K', volume: '€24,8M/mnd', omzet: '€5,95M', resultaat: '+€4,81M', break_even: '✅ Bereikt' },
  };

  return (
    <div className="space-y-6">
      {/* KPI kaarten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-2xl p-2 rounded-lg ${kleurMap[k.kleur]}`}>{k.icoon}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full
                ${k.delta.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {k.delta}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{k.waarde}</div>
            <div className="text-xs text-gray-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Volume grafiek + Prognose */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Volume grafiek */}
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">📊 Maandvolume (EUR)</h3>
            <span className="text-xs text-gray-400">Jaar 1</span>
          </div>
          <div className="flex items-end gap-1 h-32">
            {volumeData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div
                  className="w-full bg-blue-500 rounded-t-sm transition-all"
                  style={{ height: `${maxVolume > 0 ? (v / maxVolume) * 100 : 0}%`, minHeight: v > 0 ? 4 : 0 }}
                />
                <span className="text-xs text-gray-400">{maanden[i].slice(0, 1)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-gray-400">
            <span>App lancering: mnd 9</span>
            <span>Doel: €1,2M</span>
          </div>
        </div>

        {/* Meerjarenprognose */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">📈 Meerjarenprognose</h3>
          <div className="flex gap-2 mb-4">
            {Object.keys(jaarData).map(j => (
              <button key={j} onClick={() => setActievePeriode(j)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition
                  ${actievePeriode === j ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {j}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {Object.entries(jaarData[actievePeriode]).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500 text-sm capitalize">{k.replace('_', ' ')}</span>
                <span className={`font-bold text-sm ${v.startsWith('+') ? 'text-green-600' : v.startsWith('-') ? 'text-red-500' : 'text-gray-800'}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Leading Indicators */}
      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-4">🎯 Leading Indicators (Doel Jaar 1)</h3>
        <div className="space-y-3">
          {[
            { label: 'Nieuwe registraties/mnd', huidig: 284, doel: 400, eenheid: '' },
            { label: 'KYC conversieratio', huidig: 73, doel: 70, eenheid: '%' },
            { label: 'Repeat rate (30 dagen)', huidig: 38, doel: 40, eenheid: '%' },
            { label: 'CAC via referral', huidig: 11, doel: 15, eenheid: '€', inverteert: true },
          ].map(({ label, huidig, doel, eenheid, inverteert }) => {
            const pct = Math.min((huidig / doel) * 100, 100);
            const goed = inverteert ? huidig <= doel : huidig >= doel * 0.9;
            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold">
                    <span className={goed ? 'text-green-600' : 'text-amber-600'}>{eenheid === '€' ? `€${huidig}` : `${huidig}${eenheid}`}</span>
                    <span className="text-gray-400 font-normal"> / doel {eenheid === '€' ? `€${doel}` : `${doel}${eenheid}`}</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-2 rounded-full transition-all ${goed ? 'bg-green-500' : 'bg-amber-400'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recente transacties */}
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">⚡ Recente transacties</h3>
          <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Alle bekijken →</span>
        </div>
        <div className="space-y-3">
          {recenteTransacties.map((t, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                  {t.naam[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{t.naam}</div>
                  <div className="text-xs text-gray-400">{t.tijd}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-sm">{t.bedrag} → {t.try}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${t.status === 'voltooid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {t.status === 'voltooid' ? '✅ Voltooid' : '⏳ In behandeling'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
