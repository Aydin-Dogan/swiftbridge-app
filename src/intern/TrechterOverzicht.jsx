/**
 * TrechterOverzicht.jsx — waar haken nieuwe klanten af? (aanmeldroute, sectie 6
 * van het voorstel "geen klant verliezen", 13-10-2026)
 *
 * Tabel per week van aanmelden uit GET /admin/trechter: per stap het aantal
 * klanten en daaronder het percentage dat de vorige stap doorkwam. Een stap
 * telt alleen wie ook alle vorige stappen haalde (zie de API,
 * services/trechter.js). Alleen aantallen: de server stuurt geen namen,
 * e-mailadressen of id's mee.
 *
 * Staat op het beheeroverzicht (/overzicht), onder de kerncijfers.
 */
import { useEffect, useId, useState } from 'react';
import { apiFetch } from '../services/api';
import { useTaal, TALEN } from '../i18n';

const WEKEN = 12;

/** Kolomkop per stap, in de volgorde van de trechter. */
const STAP_LABEL = {
  accountAangemaakt: 'admin_tr_stap_account',
  emailBevestigd: 'admin_tr_stap_email',
  kycIngediend: 'admin_tr_stap_kyc_ingediend',
  kycGoedgekeurd: 'admin_tr_stap_kyc_goedgekeurd',
  eersteTransactieAangemaakt: 'admin_tr_stap_tx_aangemaakt',
  eersteTransactieBetaald: 'admin_tr_stap_tx_betaald',
  tweedeBinnen30Dagen: 'admin_tr_stap_tweede',
};

function Cel({ stap, taal, vet }) {
  const pct = stap.pctVanVorige;
  return (
    <td className={`px-3 py-2 text-right tabular-nums ${vet ? 'font-semibold text-ink-1' : 'text-ink-1'}`}>
      <div>{stap.aantal}</div>
      {pct != null && (
        <div className="text-xs text-ink-3">
          {new Intl.NumberFormat(taal, { maximumFractionDigits: 1 }).format(pct)}%
        </div>
      )}
    </td>
  );
}

export default function TrechterOverzicht() {
  const { t, taal } = useTaal();
  const taalVeldId = useId();
  const [taalFilter, setTaalFilter] = useState('');
  // Het antwoord onthoudt voor welke taal het is, zodat "laden" daaruit volgt.
  const [resultaat, setResultaat] = useState(null);

  useEffect(() => {
    let weg = false;
    const q = new URLSearchParams({ weken: String(WEKEN) });
    if (taalFilter) q.set('taal', taalFilter);
    apiFetch(`/admin/trechter?${q.toString()}`)
      .then((data) => { if (!weg) setResultaat({ filter: taalFilter, data, fout: '' }); })
      .catch((e) => { if (!weg) setResultaat({ filter: taalFilter, data: null, fout: e?.message || '' }); });
    return () => { weg = true; };
  }, [taalFilter]);

  const laden = !resultaat || resultaat.filter !== taalFilter;
  const data = laden ? null : resultaat.data;
  const stappen = data?.stappen || Object.keys(STAP_LABEL);

  return (
    <section className="bg-surface rounded-md border border-border p-5 shadow-soft mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <h2 className="font-display text-lg font-medium text-ink-1">{t('admin_tr_titel')}</h2>
          <p className="text-sm text-ink-2 mt-1 max-w-3xl">{t('admin_tr_uitleg')}</p>
        </div>
        <div className="text-sm text-ink-2 flex items-center gap-2">
          <label htmlFor={taalVeldId}>{t('admin_tr_taal')}</label>
          <select
            id={taalVeldId}
            value={taalFilter}
            onChange={(e) => setTaalFilter(e.target.value)}
            className="border border-border rounded-md bg-surface px-2 py-1 text-sm text-ink-1"
          >
            <option value="">{t('admin_tr_alle_talen')}</option>
            {TALEN.map((l) => <option key={l.code} value={l.code}>{l.naam}</option>)}
          </select>
        </div>
      </div>

      {laden ? (
        <div className="h-40 rounded-md bg-surface-3 animate-pulse" />
      ) : resultaat.fout || !data ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
          <strong>{t('admin_tr_fout')}</strong>{resultaat.fout ? `: ${resultaat.fout}` : ''}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-3 py-2 text-left font-medium text-ink-2">{t('admin_tr_week')}</th>
                  {stappen.map((s) => (
                    <th key={s} scope="col" className="px-3 py-2 text-right font-medium text-ink-2">
                      {t(STAP_LABEL[s] || s)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.perWeek.map((w) => (
                  <tr key={w.week} className="border-b border-border">
                    <th scope="row" className="px-3 py-2 text-left font-normal text-ink-1 whitespace-nowrap">
                      <div>{w.week}</div>
                      <div className="text-xs text-ink-3">{w.vanaf}</div>
                    </th>
                    {w.stappen.map((s) => <Cel key={s.stap} stap={s} taal={taal} />)}
                  </tr>
                ))}
                <tr className="bg-surface-2">
                  <th scope="row" className="px-3 py-2 text-left font-semibold text-ink-1">{t('admin_tr_totaal')}</th>
                  {data.totaal.stappen.map((s) => <Cel key={s.stap} stap={s} taal={taal} vet />)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-3 mt-3">
            {t('admin_tr_nog_mogelijk', { n: data.totaal.tweedeNogMogelijk })}
          </p>
          <p className="text-xs text-ink-3 mt-1">{t('admin_tr_taal_let_op')}</p>
        </>
      )}
    </section>
  );
}
