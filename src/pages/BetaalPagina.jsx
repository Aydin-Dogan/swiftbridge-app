/**
 * BetaalPagina.jsx — publieke pagina voor een gedeeld betaalverzoek
 * (BETAALVERZOEK-1). Bereikbaar zonder account op /betaal/:token.
 *
 * Open verzoek: bedrag + omschrijving + optionele naam → iDEAL-checkout
 * (of directe simulatie op SB LOKAAL zonder betaalprovider). Bij terugkeer
 * van de checkout (?terug=1) pollt de pagina de status tot die definitief is.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTaal } from '../i18n';
import { apiFetch } from '../services/api';

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export default function BetaalPagina() {
  const { token } = useParams();
  const { t } = useTaal();
  const [data, setData] = useState(null);
  const [fout, setFout] = useState(null);
  const [naam, setNaam] = useState('');
  const [bezig, setBezig] = useState(false);
  const [poller, setPoller] = useState(new URLSearchParams(window.location.search).get('terug') === '1');
  const pollTeller = useRef(0);

  const laad = useCallback(() => {
    return apiFetch(`/betaalverzoeken/publiek/${encodeURIComponent(token)}`)
      .then(setData)
      .catch((e) => setFout(typeof e?.error === 'string' ? e.error : t('bv_pagina_fout')));
  }, [token, t]);

  useEffect(() => { laad(); }, [laad]);

  // Terug van de checkout: poll tot de status niet meer 'open' is (max ~40s).
  useEffect(() => {
    if (!poller) return;
    if (data && data.status !== 'open') { setPoller(false); return; }
    if (pollTeller.current >= 20) { setPoller(false); return; }
    const id = setTimeout(() => { pollTeller.current += 1; laad(); }, 2000);
    return () => clearTimeout(id);
  }, [poller, data, laad]);

  async function betaal(e) {
    e?.preventDefault();
    if (bezig) return;
    setBezig(true);
    setFout(null);
    try {
      const d = await apiFetch(`/betaalverzoeken/publiek/${encodeURIComponent(token)}/betaal`, {
        method: 'POST',
        body: { betalerNaam: naam.trim() || null },
      });
      if (d?.checkoutUrl) {
        window.location.href = d.checkoutUrl;
        return;
      }
      // Simulatie (SB LOKAAL): direct betaald
      await laad();
    } catch (err) {
      setFout(typeof err?.error === 'string' ? err.error : t('bv_pagina_fout'));
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #142641 0%, #1B3252 60%, #22416B 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg text-ink-1">SwiftBridge</span>
          <span className="text-[11px] text-ink-3 mt-1">{t('bv_pagina_label')}</span>
        </div>

        {fout && !data && <p role="alert" className="text-sm text-fg-error">{fout}</p>}
        {!data && !fout && <p className="text-sm text-ink-3">{t('laden')}</p>}

        {data && (
          <>
            <div className="text-center py-2">
              <p className="text-sm text-ink-2">{t('bv_pagina_vraagt', { naam: data.aanvrager })}</p>
              <p className="font-display text-4xl text-ink-1 mt-2 tabular-nums">{fmtEur(data.bedragEur)}</p>
              {data.omschrijving && (
                <p className="text-sm text-ink-2 mt-2">"{data.omschrijving}"</p>
              )}
            </div>

            {data.status === 'open' && (
              <form onSubmit={betaal} className="space-y-3">
                <div>
                  <label htmlFor="bv-naam" className="block text-xs font-medium text-ink-2 mb-1">
                    {t('bv_pagina_naam_label')}
                  </label>
                  <input id="bv-naam" type="text" maxLength={100} value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    placeholder={t('bv_pagina_naam_placeholder')}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-base text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                {fout && <p role="alert" className="text-sm text-fg-error">{fout}</p>}
                <button type="submit" disabled={bezig}
                  className="w-full btn-inst py-3 disabled:opacity-50">
                  {bezig ? t('bv_pagina_bezig') : t('bv_pagina_betaal')}
                </button>
                <p className="text-[11px] text-ink-3 text-center">{t('bv_pagina_voetnoot')}</p>
              </form>
            )}

            {data.status === 'betaald' && (
              <div className="text-center py-3" role="status">
                <div className="mx-auto w-14 h-14 rounded-full bg-success-50 flex items-center justify-center mb-2">
                  <svg className="w-7 h-7 text-success-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-ink-1">{t('bv_pagina_betaald')}</p>
                <p className="text-sm text-ink-2 mt-1">{t('bv_pagina_betaald_sub', { naam: data.aanvrager })}</p>
              </div>
            )}

            {poller && data.status === 'open' && (
              <p className="text-[12px] text-ink-3 text-center" aria-live="polite">{t('bv_pagina_wachten')}</p>
            )}

            {(data.status === 'verlopen' || data.status === 'ingetrokken') && (
              <p className="text-sm text-ink-2 text-center py-2" role="status">
                {t(`bv_pagina_${data.status}`)}
              </p>
            )}
          </>
        )}

        <p className="text-[10px] text-ink-3 text-center border-t border-border-subtle pt-3">
          {t('bv_pagina_disclaimer')}
        </p>
      </div>
    </div>
  );
}
