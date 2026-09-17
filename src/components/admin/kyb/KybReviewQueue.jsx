/**
 * KybReviewQueue.jsx — Wachtrij zakelijke aanvragen (KYB) voor de compliance-medewerker.
 *
 * Backend (contract 2.6):
 *   GET  /admin/kyb?status=&q=&limit=50&offset=0  -> { totaal, items:[...] } oudste eerst
 *   POST /admin/kyb/:id/in-behandeling            -> { ok, status:'in_behandeling' }
 *
 * Filter (default "open" = ingediend + in_behandeling + info_nodig). "Alle" is geen API-status:
 * daarvoor halen we open + goedgekeurd + afgewezen + ingetrokken op en voegen we samen.
 * Klik op een rij opent het dossier (KybDossier) in dezelfde tab.
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, parseError } from '../../../services/api';
import { useTaal } from '../../../i18n';
import { Refresh, Search, AlertTriangle, ArrowRight } from '../../icons/Icons';
import KybDossier from './KybDossier';
import { useTx, useKybLabels, fmtDatum, STATUS_STIJL } from './kybAdminLabels';

const FILTERS = ['open', 'ingediend', 'in_behandeling', 'info_nodig', 'goedgekeurd', 'afgewezen', 'alle'];
const ALLE_STATUSSEN = ['open', 'goedgekeurd', 'afgewezen', 'ingetrokken'];
const LIMIT = 50;

function Pill({ children, klas = 'bg-surface-3 text-ink-2 border-border' }) {
  return <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${klas}`}>{children}</span>;
}

export default function KybReviewQueue({ beginId = null }) {
  const { t } = useTaal();
  const tx = useTx();
  const labels = useKybLabels();
  const [filter, setFilter] = useState('open');
  const [zoek, setZoek] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [totaal, setTotaal] = useState(0);
  const [fout, setFout] = useState('');
  const [bezigId, setBezigId] = useState(null);
  const [actiefId, setActiefId] = useState(beginId);

  // Debounce op het zoekveld (400 ms).
  useEffect(() => {
    const timer = setTimeout(() => setQ(zoek.trim()), 400);
    return () => clearTimeout(timer);
  }, [zoek]);

  // Laadstatus afgeleid van een sleutel (filter + zoekterm + herlaadronde): "laden" zolang de
  // ronde voor de huidige sleutel nog niet is afgerond. Het ophalen gebeurt in de effect hieronder;
  // state-updates alleen in de promise-callbacks (geen synchrone setState in de effect).
  const [herlaadNr, setHerlaadNr] = useState(0);
  const [geladenSleutel, setGeladenSleutel] = useState(null);
  const sleutel = `${filter}|${q}|${herlaadNr}`;
  const laden = geladenSleutel !== sleutel;
  const laad = useCallback(() => setHerlaadNr((n) => n + 1), []);

  useEffect(() => {
    if (actiefId) return undefined;
    let actief = true;
    const maakQuery = (status) => {
      const qs = new URLSearchParams({ status, limit: String(LIMIT), offset: '0' });
      if (q) qs.set('q', q);
      return `/admin/kyb?${qs.toString()}`;
    };
    const ophalen = filter === 'alle'
      ? Promise.all(ALLE_STATUSSEN.map((s) => apiFetch(maakQuery(s)))).then((delen) => {
        const samen = delen.flatMap((d) => d?.items || []);
        samen.sort((a, b) => (Number(a.ingediendOp) || 0) - (Number(b.ingediendOp) || 0));
        return { items: samen, totaal: delen.reduce((som, d) => som + (Number(d?.totaal) || 0), 0) };
      })
      : apiFetch(maakQuery(filter)).then((data) => ({ items: data?.items || [], totaal: Number(data?.totaal) || 0 }));
    ophalen
      .then((r) => { if (actief) { setItems(r.items); setTotaal(r.totaal); setFout(''); } })
      .catch((e) => { if (actief) setFout(parseError(e, t)); })
      .finally(() => { if (actief) setGeladenSleutel(sleutel); });
    return () => { actief = false; };
  }, [filter, q, sleutel, actiefId, t]);

  async function neemInBehandeling(e, id) {
    e.stopPropagation();
    setBezigId(id); setFout('');
    try {
      await apiFetch(`/admin/kyb/${id}/in-behandeling`, { method: 'POST', body: {} });
      laad();
    } catch (err) {
      setFout(parseError(err, t));
    } finally {
      setBezigId(null);
    }
  }

  if (actiefId) {
    return (
      <KybDossier
        id={actiefId}
        onTerug={() => setActiefId(null)}
        onGewijzigd={() => { /* dossier herlaadt zichzelf; lijst ververst bij terugkeer */ }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-medium text-ink-1">{tx('kyb_admin_titel', 'Zakelijke aanvragen')}</h2>
          <p className="text-xs text-ink-2 mt-0.5 tabular-nums">{totaal} {tx('kyb_admin_totaal_label', 'aanvragen')}</p>
        </div>
        <button onClick={laad} disabled={laden} className="text-gray-500 hover:text-brand-600 disabled:opacity-40" title={tx('vernieuwen', 'Vernieuwen')} aria-label={tx('vernieuwen', 'Vernieuwen')}>
          <Refresh className="w-5 h-5" />
        </button>
      </div>

      {/* Filter + zoeken */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label={tx('kyb_admin_kol_status', 'Status')}>
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filter === f ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-ink-2 border-border hover:border-brand-300'}`}>
              {tx(`kyb_admin_filter_${f}`, { open: 'Open', ingediend: 'Ingediend', in_behandeling: 'In behandeling', info_nodig: 'Info nodig', goedgekeurd: 'Goedgekeurd', afgewezen: 'Afgewezen', alle: 'Alle' }[f])}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <label className="relative">
          <span className="sr-only">{tx('kyb_admin_zoek', 'Zoeken op bedrijf, KvK of e-mail')}</span>
          <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder={tx('kyb_admin_zoek', 'Zoeken op bedrijf, KvK of e-mail')}
            className="bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 w-64 max-w-full"
          />
        </label>
      </div>

      {fout && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{fout}</div>}

      {laden ? (
        <div className="text-center text-ink-2 py-10">{tx('laden', 'Laden...')}</div>
      ) : items.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-8 text-center text-ink-2">
          <p className="font-semibold">{tx('kyb_admin_leeg', 'Geen aanvragen in deze status.')}</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-3 border-b border-border">
                <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">
                  <th className="px-4 py-3">{tx('kyb_admin_kol_bedrijf', 'Bedrijf')}</th>
                  <th className="px-4 py-3">{tx('kyb_admin_kol_aanvrager', 'Aanvrager')}</th>
                  <th className="px-4 py-3">{tx('kyb_admin_kol_status', 'Status')}</th>
                  <th className="px-4 py-3">{tx('kyb_admin_kol_ingediend', 'Ingediend')}</th>
                  <th className="px-4 py-3">{tx('kyb_admin_kol_uiterlijk', 'Uiterlijk')}</th>
                  <th className="px-4 py-3">{tx('kyb_admin_kol_versie', 'Poging')}</th>
                  <th className="px-4 py-3 text-right">{tx('kyc_review_kol_actie', 'Actie')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((r) => {
                  const signalen = Array.isArray(r.risicoSignalen) ? r.risicoSignalen : [];
                  return (
                    <tr key={r.id} className="hover:bg-surface-3 transition cursor-pointer" onClick={() => setActiefId(r.id)}>
                      <td className="px-4 py-3">
                        <div className="text-ink-1 font-semibold">{r.bedrijfsnaam || '-'}</div>
                        <div className="text-xs text-gray-500 font-mono">{r.kvkNummer || '-'}{r.rechtsvorm ? ` · ${labels.rechtsvorm(r.rechtsvorm)}` : ''}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.sanctieHit ? <Pill klas="bg-red-100 text-red-700 border-red-200">{tx('kyb_admin_sanctie_hit', 'Sanctie-hit')}</Pill> : null}
                          {r.screeningOnbeschikbaar || signalen.includes('sanctie_niet_gescreend')
                            ? <Pill klas="bg-amber-50 text-amber-700 border-amber-200">{tx('kyb_admin_screening_onbeschikbaar', 'Screening niet uitgevoerd')}</Pill> : null}
                          {r.bron === 'handmatig' || signalen.includes('kvk_handmatig')
                            ? <Pill klas="bg-amber-50 text-amber-700 border-amber-200">{tx('kyb_admin_kvk_handmatig', 'KvK handmatig')}</Pill> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-ink-1">{r.aanvragerNaam || '-'}</div>
                        <div className="text-xs text-gray-500 font-mono">{r.email || '-'}</div>
                        {r.inBehandelingDoor && (
                          <div className="text-[11px] text-ink-3 mt-0.5">{tx('kyb_admin_in_behandeling_bij', 'In behandeling bij {naam}', { naam: r.inBehandelingDoor })}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Pill klas={STATUS_STIJL[r.status] || STATUS_STIJL.concept}>{labels.status(r.status)}</Pill>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-2 whitespace-nowrap">{fmtDatum(r.ingediendOp)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <span className="text-ink-2">{fmtDatum(r.verwachtUiterlijkOp, false)}</span>
                        {r.slaOverschreden && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200">
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />{tx('kyb_admin_sla_overschreden', 'Doorlooptijd overschreden')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-2 tabular-nums">{r.ingediendCount ?? r.versie ?? 1}{r.versie && r.versie > 1 ? ` (v${r.versie})` : ''}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {r.status === 'ingediend' ? (
                          <button type="button" onClick={(e) => neemInBehandeling(e, r.id)} disabled={bezigId === r.id}
                            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md disabled:opacity-50">
                            {bezigId === r.id ? tx('laden', 'Laden...') : tx('kyb_admin_claim', 'In behandeling nemen')}
                          </button>
                        ) : (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setActiefId(r.id); }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline underline-offset-4">
                            {tx('kyc_review_bekijken', 'Bekijken')} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">{tx('kyc_review_hint', 'Klik op een rij om het dossier te openen.')}</div>
    </div>
  );
}
