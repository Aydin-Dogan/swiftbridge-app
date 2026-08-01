/**
 * Verzendlijst.jsx — klaarstaande opdrachten (bank-concept).
 * Toont écht bestaande gegevens: het concept uit een half ingevulde
 * overboeking (sessionStorage payment-draft) en de actieve geplande
 * opdrachten. Verzamelbetalingen/incassobatches volgen in een latere
 * ronde samen met de backend (bouwbrief §2) — geen nep-knoppen.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { apiFetch } from '../../services/api';
import { Send, Calendar, Info } from '../icons/Icons';

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function laadConcept() {
  try {
    const raw = sessionStorage.getItem('swiftbridge_payment_draft_v2');
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && (d.bedrag || d.stap) ? d : null;
  } catch { return null; }
}

export default function Verzendlijst() {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [concept] = useState(laadConcept);
  const [gepland, setGepland] = useState(null);
  const [filter, setFilter] = useState('alles');

  useEffect(() => {
    let weg = false;
    // Gepland = actieve herhaalopdrachten + eenmalig geplande opdrachten (OVZ-4)
    Promise.allSettled([
      apiFetch('/recurring').catch(() => ({ recurring: [] })),
      apiFetch('/opdrachten').catch(() => ({ opdrachten: [] })),
    ]).then(([recRes, opdRes]) => {
      if (weg) return;
      const rec = (recRes.value?.recurring || []).filter(g => g.actief).map(g => ({
        key: `rec-${g.id}`, soort: 'recurring',
        naam: g.ontvangerNaam || g.naam, datum: (g.volgendeUitvoering || '').slice(0, 10),
        bedragEur: g.bedragEur,
      }));
      const opd = (opdRes.value?.opdrachten || []).filter(o => o.status === 'gepland').map(o => ({
        key: `opd-${o.id}`, soort: 'eenmalig',
        naam: o.ontvangerNaam, datum: (o.uitvoerenOp || '').slice(0, 10),
        bedragEur: o.bedragEur,
      }));
      setGepland([...rec, ...opd].sort((a, b) => a.datum.localeCompare(b.datum)));
    });
    return () => { weg = true; };
  }, []);

  const aantalConcept = concept ? 1 : 0;
  const aantalGepland = gepland?.length || 0;
  const chips = [
    ['alles', `${t('verzendlijst_chip_alles')} (${aantalConcept + aantalGepland})`],
    ['concepten', `${t('verzendlijst_concepten')} (${aantalConcept})`],
    ['gepland', `${t('verzendlijst_gepland')} (${aantalGepland})`],
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink-1">{t('verzendlijst_titel')}</h1>

      <button
        onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'overschrijven' }))}
        className="group flex flex-col items-center gap-1.5 w-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded-md py-1">
        <span className="w-11 h-11 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-soft transition group-active:scale-95">
          <Send className="w-5 h-5" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium text-ink-2 leading-tight text-center">{t('actie_overschrijven')}</span>
      </button>

      <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label={t('verzendlijst_titel')}>
        {chips.map(([w, label]) => (
          <button key={w} role="tab" aria-selected={filter === w} onClick={() => setFilter(w)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition
              ${filter === w ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-ink-2 border-border hover:border-brand-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {(filter === 'alles' || filter === 'concepten') && (
        <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden"
          aria-label={t('verzendlijst_concepten')}>
          <div className="px-4 py-3 border-b border-border-subtle">
            <h2 className="font-display font-medium text-ink-1 text-sm">{t('verzendlijst_concepten')}</h2>
          </div>
          {concept ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2 transition text-left focus:outline-none focus:bg-surface-2">
              <div className="min-w-0">
                <div className="font-semibold text-ink-1 text-sm">{t('verzendlijst_concept_titel')}</div>
                <div className="text-[11px] text-ink-3 mt-0.5">{t('verzendlijst_concept_doorgaan')}</div>
              </div>
              {concept.bedrag && (
                <div className="font-display font-medium text-sm tabular-nums text-ink-1 flex-shrink-0">
                  {fmtEur(Number(concept.bedrag) || 0)}
                </div>
              )}
            </button>
          ) : (
            <p className="flex items-center gap-2 text-sm text-ink-3 px-4 py-6">
              <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> {t('verzendlijst_leeg_concept')}
            </p>
          )}
        </section>
      )}

      {(filter === 'alles' || filter === 'gepland') && (
        <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden"
          aria-label={t('verzendlijst_gepland')}>
          <div className="px-4 py-3 border-b border-border-subtle">
            <h2 className="font-display font-medium text-ink-1 text-sm">{t('verzendlijst_gepland')}</h2>
          </div>
          {gepland == null && <p className="text-sm text-ink-3 px-4 py-6">{t('laden')}</p>}
          {gepland && gepland.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-ink-3 px-4 py-6">
              <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> {t('verzendlijst_leeg_gepland')}
            </p>
          )}
          {gepland && gepland.length > 0 && (
            <ul className="divide-y divide-border-subtle">
              {gepland.map(g => (
                <li key={g.key} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <Calendar className="w-4 h-4 text-brand-600" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink-1 text-sm truncate">{g.naam}</div>
                      <div className="text-[11px] text-ink-3 mt-0.5">
                        {g.soort === 'eenmalig'
                          ? `${t('gepland_uitvoerdatum')}: ${g.datum} · ${t('gepland_eenmalig')}`
                          : `${t('gepland_volgende')}: ${g.datum}`}
                      </div>
                    </div>
                  </div>
                  <div className="font-display font-medium text-sm tabular-nums text-ink-1 flex-shrink-0">{fmtEur(g.bedragEur)}</div>
                </li>
              ))}
            </ul>
          )}
          {gepland && gepland.length > 0 && (
            <div className="border-t border-border-subtle px-4 py-3">
              <button onClick={() => navigate('/app/recurring')}
                className="w-full text-center text-sm text-brand-700 font-semibold hover:underline underline-offset-4">
                {t('gepland_beheer')}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
