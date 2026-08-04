/**
 * Verzendlijst.jsx — klaarstaande opdrachten (bank-concept).
 * Toont écht bestaande gegevens: het concept uit een half ingevulde
 * overboeking (sessionStorage payment-draft) en de actieve geplande
 * opdrachten. Verzamelbetalingen/incassobatches volgen in een latere
 * ronde samen met de backend (bouwbrief §2) — geen nep-knoppen.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { apiFetch } from '../../services/api';
import { Send, Calendar, Info } from '../icons/Icons';
// BULK-1: één PIN-bevestiging (SCA) voor de hele batch, zelfde scherm als PaymentFlow
import AppLockScherm from '../pin/AppLockScherm';

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
  // BULK-1: selectie van eenmalige opdrachten voor "Verstuur (N)"
  const [selectie, setSelectie] = useState(() => new Set());
  const [bulkStap, setBulkStap] = useState(null); // null | 'bevestig' | 'pin' | 'bezig'
  const [bulkToken, setBulkToken] = useState(null);
  const [bulkMelding, setBulkMelding] = useState(null); // { soort: 'ok'|'deels'|'fout', tekst }
  // OVZ-4b: bewerken van een geplande opdracht (bedrag/datum/kenmerk/omschrijving)
  const [bewerk, setBewerk] = useState(null); // null | { id, naam, bedrag, datum, kenmerk, omschrijving }
  const [bewerkBezig, setBewerkBezig] = useState(false);
  const [bewerkFout, setBewerkFout] = useState(null);

  const laadGepland = useCallback(() => {
    // Gepland = actieve herhaalopdrachten + eenmalig geplande opdrachten (OVZ-4)
    return Promise.allSettled([
      apiFetch('/recurring').catch(() => ({ recurring: [] })),
      apiFetch('/opdrachten').catch(() => ({ opdrachten: [] })),
    ]).then(([recRes, opdRes]) => {
      const rec = (recRes.value?.recurring || []).filter(g => g.actief).map(g => ({
        key: `rec-${g.id}`, soort: 'recurring', id: g.id,
        naam: g.ontvangerNaam || g.naam, datum: (g.volgendeUitvoering || '').slice(0, 10),
        bedragEur: g.bedragEur,
      }));
      const opd = (opdRes.value?.opdrachten || []).filter(o => o.status === 'gepland').map(o => ({
        key: `opd-${o.id}`, soort: 'eenmalig', id: o.id,
        naam: o.ontvangerNaam, datum: (o.uitvoerenOp || '').slice(0, 10),
        bedragEur: o.bedragEur,
        // OVZ-4b: nodig om de bewerk-modal voor te vullen
        omschrijving: o.omschrijving || '', betalingskenmerk: o.betalingskenmerk || '',
      }));
      setGepland([...rec, ...opd].sort((a, b) => a.datum.localeCompare(b.datum)));
    });
  }, []);

  useEffect(() => {
    let weg = false;
    laadGepland().then(() => { if (weg) return; });
    return () => { weg = true; };
  }, [laadGepland]);

  const eenmalig = (gepland || []).filter(g => g.soort === 'eenmalig');
  const geselecteerd = eenmalig.filter(g => selectie.has(g.id));
  const selectieTotaal = geselecteerd.reduce((som, g) => som + (Number(g.bedragEur) || 0), 0);

  function wisselSelectie(id) {
    setSelectie(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function selecteerAlles() {
    setSelectie(prev => (prev.size === eenmalig.length
      ? new Set()
      : new Set(eenmalig.map(g => g.id))));
  }

  async function verstuurBulk(token) {
    setBulkStap('bezig');
    setBulkMelding(null);
    try {
      const res = await apiFetch('/opdrachten/verstuur-bulk', {
        method: 'POST',
        body: { ids: [...selectie], ...(token ? { txConfirmToken: token } : {}) },
      });
      if (res.mislukt === 0) {
        setBulkMelding({ soort: 'ok', tekst: t('bulk_ok', { gelukt: res.gelukt, totaal: res.totaal }) });
      } else {
        setBulkMelding({ soort: 'deels', tekst: `${t('bulk_ok', { gelukt: res.gelukt, totaal: res.totaal })} ${t('bulk_deels', { mislukt: res.mislukt })}` });
      }
      setSelectie(new Set());
      await laadGepland();
    } catch (err) {
      if (err.errorCode === 'PIN_CONFIRMATION_REQUIRED') {
        setBulkStap('pin');
        return;
      }
      setBulkMelding({ soort: 'fout', tekst: t('bulk_fout') });
    } finally {
      setBulkToken(null);
      setBulkStap(prev => (prev === 'pin' ? 'pin' : null));
    }
  }

  function openBewerk(g) {
    setBewerkFout(null);
    setBewerk({
      id: g.id, naam: g.naam,
      bedrag: String(g.bedragEur ?? ''),
      datum: g.datum, origDatum: g.datum,
      kenmerk: g.betalingskenmerk || '',
      omschrijving: g.omschrijving || '',
    });
  }

  async function slaBewerkOp() {
    if (!bewerk) return;
    setBewerkBezig(true);
    setBewerkFout(null);
    try {
      // uitvoerenOp alleen meesturen als de datum echt gewijzigd is: de backend
      // weigert elke niet-toekomstige datum, en een rij met een verstreken
      // uitvoerdatum (transiënte fout) zou anders nooit meer bewerkbaar zijn.
      const body = {
        bedragEur: Number(bewerk.bedrag),
        betalingskenmerk: bewerk.kenmerk.trim() || null,
        omschrijving: bewerk.omschrijving.trim() || null,
      };
      if (bewerk.datum !== bewerk.origDatum) body.uitvoerenOp = bewerk.datum;
      await apiFetch(`/opdrachten/${bewerk.id}`, { method: 'PATCH', body });
      setBewerk(null);
      setBulkMelding({ soort: 'ok', tekst: t('opdracht_bewerk_opgeslagen') });
      await laadGepland();
    } catch (err) {
      setBewerkFout(typeof err?.error === 'string' ? err.error : t('opdracht_bewerk_fout'));
    } finally {
      setBewerkBezig(false);
    }
  }

  async function startBulk() {
    // PIN aan? Dan eerst de tx-confirm-ceremony, anders direct versturen.
    setBulkStap('bezig');
    let pinAan = false;
    try {
      const s = await apiFetch('/auth/pin/status');
      pinAan = !!s?.ingeschakeld;
    } catch { /* status onbekend — backend dwingt zonodig alsnog af */ }
    if (pinAan) setBulkStap('pin');
    else await verstuurBulk(null);
  }

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
            <>
              {eenmalig.length > 0 && (
                <div className="px-4 py-2 border-b border-border-subtle flex items-center gap-2">
                  <input id="bulk-alles" type="checkbox"
                    checked={selectie.size > 0 && selectie.size === eenmalig.length}
                    onChange={selecteerAlles}
                    className="w-4 h-4 rounded border-border text-brand-600 focus:ring-brand-300" />
                  <label htmlFor="bulk-alles" className="text-xs font-medium text-ink-2 cursor-pointer select-none">
                    {t('bulk_selecteer_alles')}
                  </label>
                </div>
              )}
              <ul className="divide-y divide-border-subtle">
                {gepland.map(g => (
                  <li key={g.key} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {g.soort === 'eenmalig' ? (
                        <input type="checkbox" checked={selectie.has(g.id)} onChange={() => wisselSelectie(g.id)}
                          aria-label={`${t('bulk_selecteer')} ${g.naam}`}
                          className="w-4 h-4 rounded border-border text-brand-600 focus:ring-brand-300 flex-shrink-0" />
                      ) : (
                        <span className="w-4 flex-shrink-0" aria-hidden="true" />
                      )}
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
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="font-display font-medium text-sm tabular-nums text-ink-1">{fmtEur(g.bedragEur)}</div>
                      {g.soort === 'eenmalig' && (
                        <button onClick={() => openBewerk(g)}
                          className="text-xs text-brand-700 font-semibold hover:underline underline-offset-4"
                          aria-label={`${t('opdracht_bewerken')} ${g.naam}`}>
                          {t('opdracht_bewerken')}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {selectie.size > 0 && (
                <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3 bg-brand-50">
                  <div className="text-sm text-ink-1">
                    <span className="font-semibold">{t('bulk_geselecteerd', { n: selectie.size })}</span>
                    <span className="text-ink-2"> · {fmtEur(selectieTotaal)}</span>
                  </div>
                  <button onClick={() => setBulkStap('bevestig')} disabled={bulkStap === 'bezig'}
                    className="btn-inst px-5 py-2.5 disabled:opacity-50">
                    {t('bulk_verstuur', { n: selectie.size })}
                  </button>
                </div>
              )}
            </>
          )}
          {bulkMelding && (
            <p role={bulkMelding.soort === 'fout' ? 'alert' : 'status'}
              className={`px-4 py-3 text-sm border-t border-border-subtle
                ${bulkMelding.soort === 'ok' ? 'text-success-700 bg-success-50'
                  : bulkMelding.soort === 'deels' ? 'text-amber-700 bg-amber-50' : 'text-fg-error bg-red-50'}`}>
              {bulkMelding.tekst}
            </p>
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

      {/* BULK-1: "Weet je het zeker?"-bevestiging vóór het versturen */}
      {bulkStap === 'bevestig' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-label={t('bulk_bevestig_titel')}
          onClick={() => setBulkStap(null)}>
          <div className="bg-surface rounded-md shadow-soft-xl border border-border w-full max-w-sm p-6 space-y-4 animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-medium text-lg text-brand-700">{t('bulk_bevestig_titel')}</h2>
            <p className="text-sm text-ink-2">{t('bulk_bevestig_tekst', { n: selectie.size, bedrag: fmtEur(selectieTotaal) })}</p>
            <div className="flex gap-2">
              <button onClick={startBulk} className="btn-inst px-5 py-2.5">
                {t('bulk_verstuur', { n: selectie.size })}
              </button>
              <button onClick={() => setBulkStap(null)}
                className="px-5 py-2.5 rounded-[3px] border border-border text-ink-2 text-sm font-medium hover:bg-surface-2 transition">
                {t('annuleren')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVZ-4b: geplande opdracht bewerken */}
      {bewerk && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-label={t('opdracht_bewerk_titel')}
          onClick={() => { if (!bewerkBezig) setBewerk(null); }}>
          <div className="bg-surface rounded-md shadow-soft-xl border border-border w-full max-w-sm p-6 space-y-4 animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="font-display font-medium text-lg text-brand-700">{t('opdracht_bewerk_titel')}</h2>
              <p className="text-sm text-ink-2 mt-0.5 truncate">{bewerk.naam}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="bewerk-bedrag" className="block text-xs font-medium text-ink-2 mb-1">{t('ovs_bedrag')}</label>
                <input id="bewerk-bedrag" type="number" min="50" max="5000" step="0.01" value={bewerk.bedrag}
                  onChange={e => setBewerk(b => ({ ...b, bedrag: e.target.value }))}
                  className="w-full rounded-[3px] border border-border bg-surface px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label htmlFor="bewerk-datum" className="block text-xs font-medium text-ink-2 mb-1">{t('ovs_uitvoerdatum')}</label>
                <input id="bewerk-datum" type="date" value={bewerk.datum}
                  onChange={e => setBewerk(b => ({ ...b, datum: e.target.value }))}
                  className="w-full rounded-[3px] border border-border bg-surface px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label htmlFor="bewerk-kenmerk" className="block text-xs font-medium text-ink-2 mb-1">{t('ovs_kenmerk')}</label>
                <input id="bewerk-kenmerk" type="text" maxLength={35} value={bewerk.kenmerk}
                  onChange={e => setBewerk(b => ({ ...b, kenmerk: e.target.value }))}
                  className="w-full rounded-[3px] border border-border bg-surface px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label htmlFor="bewerk-omschrijving" className="block text-xs font-medium text-ink-2 mb-1">{t('ovs_omschrijving')}</label>
                <input id="bewerk-omschrijving" type="text" maxLength={140} value={bewerk.omschrijving}
                  onChange={e => setBewerk(b => ({ ...b, omschrijving: e.target.value }))}
                  className="w-full rounded-[3px] border border-border bg-surface px-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
            </div>
            {bewerkFout && <p role="alert" className="text-sm text-fg-error">{bewerkFout}</p>}
            <div className="flex gap-2">
              <button onClick={slaBewerkOp} disabled={bewerkBezig} className="btn-inst px-5 py-2.5 disabled:opacity-50">
                {t('opslaan')}
              </button>
              <button onClick={() => setBewerk(null)} disabled={bewerkBezig}
                className="px-5 py-2.5 rounded-[3px] border border-border text-ink-2 text-sm font-medium hover:bg-surface-2 transition">
                {t('annuleren')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK-1: één PIN-bevestiging (SCA) voor de hele batch */}
      {bulkStap === 'pin' && (
        <AppLockScherm
          doel="tx_confirm"
          onSucces={(token) => { setBulkToken(token); verstuurBulk(token); }}
          onAnnuleer={() => setBulkStap(null)}
        />
      )}
    </div>
  );
}
