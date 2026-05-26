/**
 * ReferralProgress.jsx — motivatie-widget voor referral programma (LLL).
 *
 * Toont:
 *   - Hoeveel verdiend tot nu toe (€)
 *   - Nog X vrienden tot volgende milestone (€50 / €100 / €250)
 *   - Progress-bar tot volgende milestone
 *
 * Verbergt zichzelf als data nog niet beschikbaar.
 */
import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { useTaal } from '../../i18n';

const MIJLPALEN = [50, 100, 250, 500]; // EUR

export default function ReferralProgress() {
  const { t } = useTaal();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/referral/mijn')
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => {/* niet kritiek */});
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  const verdiend = Number(data.statistieken?.creditEur || 0);
  const beloning = Number(data.beloningPerVriendEur || 5);

  // Volgende mijlpaal
  const volgende = MIJLPALEN.find(m => m > verdiend) || MIJLPALEN[MIJLPALEN.length - 1];
  const vorige = [0, ...MIJLPALEN].filter(m => m <= verdiend).pop() ?? 0;
  const procent = volgende > vorige ? ((verdiend - vorige) / (volgende - vorige)) * 100 : 100;
  const benodigdeVrienden = Math.ceil((volgende - verdiend) / beloning);

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-extrabold text-emerald-700">
          €{verdiend.toFixed(2)}
        </span>
        <span className="text-xs text-emerald-600 font-medium">
          / €{volgende} {t('referral_progress_volgende')}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all"
          style={{ width: `${Math.min(100, procent)}%` }}
        />
      </div>

      <p className="text-xs text-emerald-800 font-medium">
        {benodigdeVrienden > 0
          ? t('referral_progress_nog', { aantal: benodigdeVrienden, mijlpaal: volgende })
          : t('referral_progress_mijlpaal_gehaald', { mijlpaal: volgende })}
      </p>
    </div>
  );
}
