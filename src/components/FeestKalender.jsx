/**
 * FeestKalender — Culturele herinneringen voor de Turks-Nederlandse community
 *
 * Toont een banner op het dashboard wanneer een belangrijke periode nadert:
 *   - Ramadan (start, midden, eind)
 *   - Eid al-Fitr (Ramazan Bayramı)
 *   - Eid al-Adha (Kurban Bayramı)
 *   - Nieuwjaar (Yılbaşı)
 *
 * NB: Islamitische feesten verschuiven elk jaar ~11 dagen.
 * Voor productie: vervang door API (zoals https://api.aladhan.com) ipv hardcoded data.
 */

const FEESTEN = [
  // 2026
  { id: 'ramadan-2026',  naam: 'Ramadan',           emoji: '🌙', start: '2026-02-17', eind: '2026-03-19', kleur: 'from-indigo-600 to-purple-700' },
  { id: 'eid-fitr-2026', naam: 'Ramazan Bayramı',   emoji: '🎉', start: '2026-03-20', eind: '2026-03-23', kleur: 'from-amber-500 to-orange-600' },
  { id: 'eid-adha-2026', naam: 'Kurban Bayramı',    emoji: '🐑', start: '2026-05-27', eind: '2026-05-30', kleur: 'from-emerald-500 to-teal-600' },
  { id: 'nieuwjaar-2027', naam: 'Yılbaşı',          emoji: '🎊', start: '2026-12-29', eind: '2027-01-02', kleur: 'from-rose-500 to-pink-600' },

  // 2027
  { id: 'ramadan-2027',  naam: 'Ramadan',           emoji: '🌙', start: '2027-02-06', eind: '2027-03-08', kleur: 'from-indigo-600 to-purple-700' },
  { id: 'eid-fitr-2027', naam: 'Ramazan Bayramı',   emoji: '🎉', start: '2027-03-09', eind: '2027-03-12', kleur: 'from-amber-500 to-orange-600' },
  { id: 'eid-adha-2027', naam: 'Kurban Bayramı',    emoji: '🐑', start: '2027-05-16', eind: '2027-05-19', kleur: 'from-emerald-500 to-teal-600' },
];

const DAGEN_VOORUIT = 14; // Toon banner vanaf 14 dagen voor het feest

function dagenTussen(d1, d2) {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function vindActiefFeest(vandaag = new Date()) {
  const STORAGE = 'swiftbridge_feest_dismissed';
  let dismissed = [];
  try { dismissed = JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch {}

  for (const feest of FEESTEN) {
    if (dismissed.includes(feest.id)) continue;
    const start = new Date(feest.start);
    const eind  = new Date(feest.eind);
    const dagenTotStart = dagenTussen(vandaag, start);
    const dagenTotEind  = dagenTussen(vandaag, eind);

    // Toon banner als feest binnen 14 dagen begint OF nu plaatsvindt
    if (dagenTotStart <= DAGEN_VOORUIT && dagenTotEind >= -1) {
      return { ...feest, dagenTotStart, isNu: dagenTotStart <= 0 && dagenTotEind >= -1 };
    }
  }
  return null;
}

function dismissFeest(feestId) {
  const STORAGE = 'swiftbridge_feest_dismissed';
  let dismissed = [];
  try { dismissed = JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch {}
  if (!dismissed.includes(feestId)) {
    dismissed.push(feestId);
    localStorage.setItem(STORAGE, JSON.stringify(dismissed));
  }
}

export default function FeestKalender({ onOvermaken }) {
  const feest = vindActiefFeest();
  if (!feest) return null;

  const tekst = feest.isNu
    ? `${feest.naam} is begonnen! Vergeet niet je familie te denken.`
    : feest.dagenTotStart === 0
    ? `${feest.naam} begint vandaag!`
    : feest.dagenTotStart === 1
    ? `${feest.naam} begint morgen`
    : `Nog ${feest.dagenTotStart} dagen tot ${feest.naam}`;

  const cta = feest.isNu ? '💝 Stuur Bayram-geld' : '💝 Plan een overboeking';

  return (
    <div className={`bg-gradient-to-r ${feest.kleur} rounded-2xl p-4 text-white shadow-lg`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-4xl flex-shrink-0">{feest.emoji}</div>
          <div className="min-w-0">
            <div className="font-bold text-sm">{tekst}</div>
            <div className="text-xs opacity-90 mt-0.5">
              Geld over naar familie in Turkije voor deze speciale periode
            </div>
          </div>
        </div>
        <button
          onClick={() => dismissFeest(feest.id) || window.dispatchEvent(new Event('swiftbridge_tx_update'))}
          className="text-white/70 hover:text-white text-lg leading-none flex-shrink-0"
          title="Verberg">
          ✕
        </button>
      </div>
      <button
        onClick={onOvermaken}
        className="w-full mt-3 bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold py-2.5 rounded-xl transition text-sm active:scale-95">
        {cta} →
      </button>
    </div>
  );
}
