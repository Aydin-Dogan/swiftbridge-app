/**
 * CashflowCard.jsx — staafdiagram van verstuurde bedragen per periode
 * (bank-Overzicht concept). Eigen SVG, geen grafiek-library — zelfde
 * huisrecept als KoersChart. Periodes: weken / maanden / jaren.
 * Filter: alle / voltooid / in behandeling.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';

const TAAL_LOCALES = { nl: 'nl-NL', tr: 'tr-TR', en: 'en-GB', ru: 'ru-RU', az: 'az-AZ' };

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
}

const IN_BEHANDELING = ['in_behandeling', 'wacht_op_betaling', 'info_nodig', 'info_in_behandeling'];

// Bouw de lijst perioden (nieuwste rechts) + som per periode
function bouwReeks(transacties, periode, filter, taal) {
  const locale = TAAL_LOCALES[taal] || 'nl-NL';
  const nu = new Date();
  const buckets = [];
  const AANTAL = periode === 'jaren' ? 4 : periode === 'weken' ? 6 : 6;

  for (let i = AANTAL - 1; i >= 0; i--) {
    let start, label;
    if (periode === 'maanden') {
      start = new Date(nu.getFullYear(), nu.getMonth() - i, 1);
      label = start.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
    } else if (periode === 'jaren') {
      start = new Date(nu.getFullYear() - i, 0, 1);
      label = String(start.getFullYear());
    } else {
      // weken: maandag als weekstart
      const basis = new Date(nu);
      basis.setDate(basis.getDate() - basis.getDay() + 1 - i * 7);
      start = new Date(basis.getFullYear(), basis.getMonth(), basis.getDate());
      label = start.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    }
    buckets.push({ start, label, som: 0, aantal: 0 });
  }

  const sleutel = (d) => {
    if (periode === 'maanden') return `${d.getFullYear()}-${d.getMonth()}`;
    if (periode === 'jaren') return String(d.getFullYear());
    const b = new Date(d);
    b.setDate(b.getDate() - b.getDay() + 1);
    return `${b.getFullYear()}-${b.getMonth()}-${b.getDate()}`;
  };
  const index = new Map(buckets.map((b, i) => [sleutel(b.start), i]));

  for (const tx of transacties) {
    if (filter === 'voltooid' && tx.status !== 'voltooid') continue;
    if (filter === 'in_behandeling' && !IN_BEHANDELING.includes(tx.status)) continue;
    if (filter === 'alle' && ['mislukt', 'geannuleerd'].includes(tx.status)) continue;
    const d = new Date(tx.aangemaaktOp || tx.datum || 0);
    const i = index.get(sleutel(d));
    if (i == null) continue;
    buckets[i].som += tx.eurBedrag || 0;
    buckets[i].aantal += 1;
  }
  return buckets;
}

export default function CashflowCard({ transacties = [], laden = false }) {
  const { t, taal } = useTaal();
  const navigate = useNavigate();
  const [periode, setPeriode] = useState('maanden');
  const [filter, setFilter] = useState('alle');

  const reeks = useMemo(
    () => bouwReeks(transacties, periode, filter, taal),
    [transacties, periode, filter, taal]
  );
  const max = Math.max(...reeks.map(b => b.som), 1);
  const totaal = reeks.reduce((s, b) => s + b.som, 0);

  const B = 280, H = 120, PAD = 6;
  const barBreedte = (B - PAD * 2) / reeks.length * 0.52;
  const stap = (B - PAD * 2) / reeks.length;

  return (
    <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden animate-fade-up"
      aria-label={t('cashflow_titel')}>
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600">
          {t('cashflow_titel')}
        </h3>
        <span className="text-[11px] text-ink-3 font-display tabular-nums">{fmtEur(totaal)}</span>
      </div>

      <div className="px-4 pt-3 space-y-2">
        <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label={t('cashflow_periode_aria')}>
          {[['weken', t('cashflow_weken')], ['maanden', t('cashflow_maanden')], ['jaren', t('cashflow_jaren')]].map(([w, label]) => (
            <button key={w} role="tab" aria-selected={periode === w} onClick={() => setPeriode(w)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition
                ${periode === w ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-ink-2 border-border hover:border-brand-300'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label={t('cashflow_filter_aria')}>
          {[['alle', t('cashflow_alle')], ['voltooid', t('cashflow_voltooid')], ['in_behandeling', t('cashflow_in_behandeling')]].map(([w, label]) => (
            <button key={w} role="tab" aria-selected={filter === w} onClick={() => setFilter(w)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition
                ${filter === w ? 'bg-surface-3 text-ink-1 border-border-strong' : 'bg-surface text-ink-3 border-border hover:border-brand-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        {laden ? (
          <div className="h-28 rounded-md animate-shimmer" />
        ) : totaal === 0 ? (
          <p className="text-sm text-ink-3 py-8 text-center">{t('cashflow_leeg')}</p>
        ) : (
          <svg viewBox={`0 0 ${B} ${H + 18}`} className="w-full" role="img" aria-label={t('cashflow_grafiek_aria')}>
            {reeks.map((b, i) => {
              const hoogte = b.som > 0 ? Math.max(4, (b.som / max) * (H - 14)) : 0;
              const x = PAD + i * stap + (stap - barBreedte) / 2;
              const laatste = i === reeks.length - 1;
              return (
                <g key={b.label + i}>
                  {b.som > 0 && (
                    <rect x={x} y={H - hoogte} width={barBreedte} height={hoogte} rx="2.5"
                      fill={laatste ? '#E8632A' : '#1B3252'} opacity={laatste ? 1 : 0.85}>
                      <title>{`${b.label}: ${fmtEur(b.som)} (${b.aantal})`}</title>
                    </rect>
                  )}
                  {b.som === 0 && (
                    <rect x={x} y={H - 3} width={barBreedte} height="3" rx="1.5" fill="currentColor" opacity="0.12" />
                  )}
                  <text x={x + barBreedte / 2} y={H + 13} textAnchor="middle" fontSize="8.5"
                    fill="currentColor" opacity="0.55">{b.label}</text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="border-t border-border-subtle">
        <button onClick={() => navigate('/app/rekening')}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink-1 hover:bg-surface-2 transition focus:outline-none focus:bg-surface-2">
          <span>{t('cashflow_meer')}</span>
          <span className="text-ink-3" aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  );
}
