/**
 * TransactieTracking.jsx — publieke tracking pagina (Verbetering OO).
 *
 * Route: /tx/:token (geen auth vereist)
 *
 * Toont minimal info aan ontvanger:
 * - Status (in behandeling / voltooid / mislukt)
 * - Bedrag in lokale valuta
 * - ETA / aankomstdatum
 * - Betaalmethode
 *
 * GEEN PII: geen naam, IBAN, of zender-info.
 *
 * Polling: ververst elke 30s automatisch zolang status 'in_behandeling' is.
 * Bij voltooid/mislukt stopt polling.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import { useTaal } from '../i18n';
import { Zap, Search, CheckCircle, XCircle, Clock } from '../components/icons/Icons';

function statusLabel(status, t) {
  if (status === 'voltooid') return t('track_status_voltooid');
  if (status === 'in_behandeling') return t('track_status_in_behandeling');
  if (status === 'wacht_op_betaling') return t('track_status_wacht');
  if (status === 'mislukt') return t('track_status_mislukt');
  if (status === 'geannuleerd') return t('track_status_geannuleerd');
  return status;
}

function statusKleur(status) {
  if (status === 'voltooid') return 'bg-success-50 border-success-100 text-success-700';
  if (status === 'mislukt' || status === 'geannuleerd') return 'bg-red-50 border-red-200 text-red-800';
  return 'bg-accent-400/10 border-accent-400/30 text-accent-600';
}

function formatBedrag(amount, valuta) {
  try {
    const locale = valuta === 'TRY' ? 'tr-TR' : 'nl-NL';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: valuta || 'TRY',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${amount} ${valuta}`;
  }
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('nl-NL', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function TransactieTracking() {
  const { token } = useParams();
  const { t } = useTaal();
  const [info, setInfo] = useState(null);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');

  const laad = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/track/${encodeURIComponent(token)}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(data.error || `HTTP ${res.status}`);
        setInfo(null);
        return;
      }
      setInfo(data);
      setFout('');
    } catch (err) {
      setFout(err.message);
    } finally {
      setLaden(false);
    }
  }, [token]);

  useEffect(() => {
    document.title = `${t('track_page_title')} — SwiftBridge`;
    laad();
  }, [laad, t]);

  // Auto-refresh elke 30s zolang status 'in behandeling' is
  useEffect(() => {
    if (!info || info.status !== 'in_behandeling') return;
    const interval = setInterval(laad, 30_000);
    return () => clearInterval(interval);
  }, [info, laad]);

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-600" />
            <span className="font-display font-medium text-ink-1 text-lg">SwiftBridge</span>
          </Link>
        </div>

        {laden ? (
          <div className="bg-surface rounded-md shadow-soft border border-border p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-200 border-t-brand-600 mx-auto" />
            <p className="text-sm text-ink-3 mt-4">{t('track_laden')}…</p>
          </div>
        ) : fout ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <Search className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="font-display font-medium text-red-900 mb-2">{t('track_niet_gevonden')}</h2>
            <p className="text-sm text-red-700">{fout}</p>
            <Link to="/" className="inline-block mt-4 text-sm font-semibold text-brand-600 hover:underline underline-offset-4">
              ← {t('track_terug')}
            </Link>
          </div>
        ) : info && (
          <div className="space-y-4">
            {/* Status hero */}
            <div className={`rounded-md border p-6 text-center ${statusKleur(info.status)}`}>
              <div className="flex justify-center mb-3" aria-hidden="true">
                {info.status === 'voltooid' ? <CheckCircle className="w-12 h-12" /> : info.status === 'mislukt' || info.status === 'geannuleerd' ? <XCircle className="w-12 h-12" /> : <Clock className="w-12 h-12" />}
              </div>
              <h1 className="font-display text-xl font-medium mb-1">{statusLabel(info.status, t)}</h1>
              <p className="font-display text-2xl font-medium mt-3 tabular-nums">
                {formatBedrag(info.ontvangenBedrag, info.valuta)}
              </p>
              {info.eta && info.status === 'in_behandeling' && (
                <p className="text-sm mt-2 opacity-80">
                  {t('track_verwacht')}: {formatTime(info.eta)}
                </p>
              )}
            </div>

            {/* Details */}
            <div className="bg-surface rounded-md shadow-soft border border-border p-5">
              <h2 className="font-display font-medium text-ink-1 mb-3 text-sm">{t('track_details')}</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-3">{t('track_eur_bedrag')}</dt>
                  <dd className="font-semibold text-ink-1 tabular-nums">€{Number(info.eurBedrag || 0).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-3">{t('track_methode')}</dt>
                  <dd className="font-semibold text-ink-1">{info.methode === 'papara' ? 'Papara' : t('track_methode_bank')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-3">{t('track_gestart_op')}</dt>
                  <dd className="font-semibold text-ink-1">{formatTime(info.aangemaaktOp)}</dd>
                </div>
                {info.voltooidOp && (
                  <div className="flex justify-between">
                    <dt className="text-ink-3">{t('track_voltooid_op')}</dt>
                    <dd className="font-semibold text-ink-1">{formatTime(info.voltooidOp)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Auto-refresh indicator */}
            {info.status === 'in_behandeling' && (
              <p className="text-center text-xs text-ink-3">
                {t('track_auto_refresh')}
              </p>
            )}

            {/* CTA naar landing */}
            <div className="bg-brand-50 border border-brand-100 rounded-md p-5 text-center">
              <p className="text-sm text-brand-700 mb-3">
                {t('track_cta_uitleg')}
              </p>
              <Link
                to="/"
                className="btn-inst inline-flex items-center gap-1.5"
              >
                {t('track_cta_button')} →
              </Link>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-ink-3 mt-8">
          {t('track_disclaimer')}
        </p>
      </div>
    </div>
  );
}
