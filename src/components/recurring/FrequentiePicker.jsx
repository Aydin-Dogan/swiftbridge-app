/**
 * FrequentiePicker.jsx — Radio voor frequentie + bijbehorende dag-selector
 *
 * - wekelijks    → toon dag van week dropdown (0 zondag .. 6 zaterdag)
 * - maandelijks  → toon dag van maand (1..31). 29-31 krijgen subtle hint.
 * - dagelijks    → geen extra veld
 */
import { useTaal } from '../../i18n';

export default function FrequentiePicker({
  frequentie,
  setFrequentie,
  dagVanMaand,
  setDagVanMaand,
  dagVanWeek,
  setDagVanWeek,
}) {
  const { t } = useTaal();

  const opties = [
    { v: 'maandelijks', label: t('recurring_freq_maandelijks'), sub: t('recurring_freq_maandelijks_sub') },
    { v: 'wekelijks',   label: t('recurring_freq_wekelijks'),   sub: t('recurring_freq_wekelijks_sub') },
    { v: 'dagelijks',   label: t('recurring_freq_dagelijks'),   sub: t('recurring_freq_dagelijks_sub') },
  ];

  const dagenVanWeek = [
    t('dag_zondag'), t('dag_maandag'), t('dag_dinsdag'),
    t('dag_woensdag'), t('dag_donderdag'), t('dag_vrijdag'), t('dag_zaterdag'),
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {opties.map(o => (
          <button
            key={o.v}
            type="button"
            onClick={() => setFrequentie(o.v)}
            className={`text-left p-3 rounded-md border transition active:scale-[0.98] ${
              frequentie === o.v
                ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-soft'
                : 'bg-surface border-border text-ink-2 hover:border-border-strong'
            }`}
            aria-pressed={frequentie === o.v}
          >
            <div className="font-display font-medium text-sm">{o.label}</div>
            <div className="text-xs opacity-70 mt-0.5">{o.sub}</div>
          </button>
        ))}
      </div>

      {frequentie === 'maandelijks' && (
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">
            {t('recurring_dag_van_maand')}
          </label>
          <select
            value={dagVanMaand ?? 1}
            onChange={(e) => setDagVanMaand(Number(e.target.value))}
            className="w-full p-3 border border-border rounded-md bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>
                {d}{d >= 29 ? ` ${t('recurring_dag_clamp_hint')}` : ''}
              </option>
            ))}
          </select>
          {dagVanMaand >= 29 && (
            <p className="mt-1 text-xs text-accent-600">
              {t('recurring_dag_clamp_uitleg')}
            </p>
          )}
        </div>
      )}

      {frequentie === 'wekelijks' && (
        <div>
          <label className="block text-sm font-medium text-ink-2 mb-1">
            {t('recurring_dag_van_week')}
          </label>
          <select
            value={dagVanWeek ?? 1}
            onChange={(e) => setDagVanWeek(Number(e.target.value))}
            className="w-full p-3 border border-border rounded-md bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {dagenVanWeek.map((label, i) => (
              <option key={i} value={i}>{label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
