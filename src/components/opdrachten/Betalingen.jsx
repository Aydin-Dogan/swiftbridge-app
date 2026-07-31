/**
 * Betalingen.jsx — Opdrachten-overzicht (bank-concept):
 * tabbladen Alles / Geweigerd / In behandeling / Gepland met aantallen,
 * uitklapbare regels (Van / Naar / Omschrijving / Type / Datum) en
 * "Opnieuw versturen" bij geweigerde opdrachten. Gepland toont de
 * herhaalopdrachten met hun volgende uitvoerdatum.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { apiFetch } from '../../services/api';
import { formatBedrag } from '../../services/currencies';
import { Send, Refresh, Calendar, AlertTriangle } from '../icons/Icons';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const GEWEIGERD = ['mislukt', 'geannuleerd'];
const IN_BEHANDELING = ['in_behandeling', 'wacht_op_betaling', 'info_nodig', 'info_in_behandeling'];

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function fmtDatum(iso) {
  if (!iso) return '—';
  return new Date(iso).toISOString().slice(0, 10);
}

function geweigerdReden(tx, t) {
  const bs = String(tx.betalingStatus || '').toLowerCase();
  if (['failed', 'expired', 'canceled', 'mislukt'].includes(bs)) return t('reden_betaling_niet_afgerond');
  if (tx.status === 'geannuleerd') return t('reden_geannuleerd');
  return t('reden_mislukt');
}

function OpdrachtRij({ tx, t, open, onToggle, onOpnieuw }) {
  const geweigerd = GEWEIGERD.includes(tx.status);
  return (
    <li className={`bg-surface ${geweigerd && open ? 'border-l-2 border-accent-500' : ''}`}>
      <button onClick={onToggle} aria-expanded={open}
        className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] gap-2 px-4 py-3 text-left hover:bg-surface-2 transition focus:outline-none focus:bg-surface-2">
        <div className="min-w-0 hidden sm:block">
          <div className="text-xs font-semibold text-ink-1 truncate uppercase">{t('rekening_kaart_naam')}</div>
          <div className="text-[11px] text-ink-3 truncate">SwiftBridge</div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-ink-1 truncate">→ {tx.ontvangerNaam || '—'}</div>
          <div className="text-[11px] text-ink-3 truncate">{tx.ontvangerIBAN || tx.ontvangerBank || ''}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-display font-medium text-sm tabular-nums text-ink-1">{fmtEur(tx.eurBedrag)}</div>
          <div className="text-[11px] text-ink-3">{fmtDatum(tx.aangemaaktOp)}</div>
        </div>
      </button>
      {geweigerd && !open && (
        <div className="px-4 pb-2.5 -mt-1 flex items-center gap-1.5 text-[11px] text-fg-error">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          {geweigerdReden(tx, t)}
        </div>
      )}
      {open && (
        <div className="px-4 pb-4 text-xs space-y-1.5 border-t border-border-subtle pt-3">
          {geweigerd && (
            <p className="flex items-center gap-1.5 text-fg-error mb-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              {geweigerdReden(tx, t)}
            </p>
          )}
          {[
            [t('betalingen_van'), `${t('rekening_kaart_naam')}`],
            [t('betalingen_naar'), `${tx.ontvangerNaam || '—'}${tx.ontvangerIBAN ? `, ${tx.ontvangerIBAN}` : ''}`],
            [t('betalingen_omschrijving'), tx.notitie || '—'],
            [t('betalingen_type'), t('betalingen_type_waarde')],
            [t('betalingen_datum'), fmtDatum(tx.aangemaaktOp)],
            [t('betalingen_ontvangen'), tx.valuta && tx.ontvangenBedrag != null ? formatBedrag(tx.ontvangenBedrag, tx.valuta) : '—'],
          ].map(([label, waarde]) => (
            <div key={label} className="grid grid-cols-[7rem_1fr] gap-2">
              <span className="text-ink-3">{label}</span>
              <span className="text-ink-1 break-words">{waarde}</span>
            </div>
          ))}
          {geweigerd && (
            <button onClick={onOpnieuw}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 border border-brand-300 hover:bg-brand-50 rounded-md px-3 py-2 transition">
              <Refresh className="w-4 h-4" aria-hidden="true" /> {t('opnieuw_versturen')}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function Betalingen({ beginTab = 'alles' }) {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [transacties, setTransacties] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [laden, setLaden] = useState(true);
  const [tab, setTab] = useState(beginTab);
  const [openId, setOpenId] = useState(null);

  useEffect(() => { setTab(beginTab); }, [beginTab]);

  useEffect(() => {
    let weg = false;
    Promise.allSettled([
      fetch(`${API}/transactions`, { credentials: 'include' }).then(r => r.ok ? r.json() : { transacties: [] }),
      apiFetch('/recurring').catch(() => ({ recurring: [] })),
    ]).then(([txRes, recRes]) => {
      if (weg) return;
      if (txRes.status === 'fulfilled') setTransacties(txRes.value?.transacties || []);
      if (recRes.status === 'fulfilled') setRecurring(recRes.value?.recurring || []);
      setLaden(false);
    });
    return () => { weg = true; };
  }, []);

  const groepen = useMemo(() => ({
    alles: transacties,
    geweigerd: transacties.filter(tx => GEWEIGERD.includes(tx.status)),
    in_behandeling: transacties.filter(tx => IN_BEHANDELING.includes(tx.status)),
  }), [transacties]);

  const geplandActief = recurring.filter(g => g.actief);

  function opnieuwVersturen(tx) {
    localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
      ontvanger: tx.ontvangerNaam, iban: tx.ontvangerIBAN,
      bedrag: tx.eurBedrag, valuta: tx.valuta || 'TRY',
    }));
    window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }));
  }

  const tabs = [
    ['alles', `${t('betalingen_tab_alles')} (${groepen.alles.length})`],
    ['geweigerd', `${t('tab_geweigerd')} (${groepen.geweigerd.length})`],
    ['in_behandeling', `${t('status_in_behandeling')} (${groepen.in_behandeling.length})`],
    ['gepland', `${t('tab_gepland')} (${geplandActief.length})`],
  ];

  const lijst = tab === 'gepland' ? [] : (groepen[tab] || []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink-1">{t('betalingen_titel')}</h1>

      <button
        onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))}
        className="group flex flex-col items-center gap-1.5 w-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded-md py-1">
        <span className="w-11 h-11 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-soft transition group-active:scale-95">
          <Send className="w-5 h-5" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium text-ink-2 leading-tight text-center">{t('actie_overschrijven')}</span>
      </button>

      <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label={t('betalingen_titel')}>
        {tabs.map(([w, label]) => (
          <button key={w} role="tab" aria-selected={tab === w} onClick={() => { setTab(w); setOpenId(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition
              ${tab === w ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-ink-2 border-border hover:border-brand-300'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-border bg-surface shadow-soft overflow-hidden">
        {laden && <p className="text-sm text-ink-3 px-4 py-8 text-center">{t('laden')}</p>}

        {!laden && tab === 'gepland' && (
          geplandActief.length === 0 ? (
            <p className="text-sm text-ink-3 px-4 py-8 text-center">{t('gepland_leeg')}</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {geplandActief
                .sort((a, b) => String(a.volgendeUitvoering || '').localeCompare(String(b.volgendeUitvoering || '')))
                .map(g => (
                  <li key={g.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <Calendar className="w-4 h-4 text-brand-600" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-1 text-sm truncate">{g.ontvangerNaam || g.naam}</div>
                        <div className="text-[11px] text-ink-3 mt-0.5">
                          {t('gepland_volgende')}: {(g.volgendeUitvoering || '').slice(0, 10)}
                          {['dagelijks', 'wekelijks', 'maandelijks'].includes(g.frequentie) && ` · ${t(`gepland_freq_${g.frequentie}`)}`}
                        </div>
                      </div>
                    </div>
                    <div className="font-display font-medium text-sm tabular-nums text-ink-1 flex-shrink-0">{fmtEur(g.bedragEur)}</div>
                  </li>
                ))}
            </ul>
          )
        )}
        {!laden && tab === 'gepland' && (
          <div className="border-t border-border-subtle px-4 py-3">
            <button onClick={() => navigate('/app/recurring')}
              className="w-full text-center text-sm text-brand-700 font-semibold hover:underline underline-offset-4">
              {t('gepland_beheer')}
            </button>
          </div>
        )}

        {!laden && tab !== 'gepland' && (
          lijst.length === 0 ? (
            <p className="text-sm text-ink-3 px-4 py-8 text-center">{t('betalingen_leeg')}</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {lijst.map(tx => (
                <OpdrachtRij key={tx.id} tx={tx} t={t}
                  open={openId === tx.id}
                  onToggle={() => setOpenId(openId === tx.id ? null : tx.id)}
                  onOpnieuw={() => opnieuwVersturen(tx)} />
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
