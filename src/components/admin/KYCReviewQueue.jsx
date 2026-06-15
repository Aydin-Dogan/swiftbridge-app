/**
 * KYCReviewQueue.jsx — Admin review queue voor document-upload KYC aanvragen
 *
 * Lijst van kyc_records met bron='document_upload' en status='in_behandeling'.
 * Klik op record → modal met 3 thumbnails (voorkant/achterkant/selfie) +
 * approve/reject knoppen.
 *
 * Backend:
 * GET /admin/kyc/review-queue — { records: [...] }
 * GET /admin/kyc/:id/document/:type — bytes (image/jpeg|png)
 * PATCH /admin/kyc/:id/beoordeel — { status, opmerking? }
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, parseError, API_URL } from '../../services/api';
import { useTaal } from '../../i18n';
import { X, Refresh, Mail } from '../icons/Icons';

function fmtDatum(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('nl-NL', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Image preview met blob via fetch (credentials included) ──────────────────
function DocumentBeeld({ recordId, type, label }) {
  const { t } = useTaal();
  const [src, setSrc] = useState(null);
  const [fout, setFout] = useState(null);

  useEffect(() => {
    let geannuleerd = false;
    let blobUrl = null;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/admin/kyc/${recordId}/document/${type}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (geannuleerd) return;
        blobUrl = URL.createObjectURL(blob);
        setSrc(blobUrl);
      } catch (e) {
        setFout(e.message || t('kyc_review_fout_beeld'));
      }
    })();
    return () => {
      geannuleerd = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [recordId, type, t]);

  return (
    <div className="space-y-1">
      <div className="text-[0.7rem] font-medium text-gray-500 uppercase tracking-[0.16em]">
        {label}
      </div>
      <div className="aspect-[4/3] bg-surface-3 rounded-md overflow-hidden flex items-center justify-center border border-border">
        {fout ? (
          <div className="text-xs text-red-700 p-2 text-center">{fout}</div>
        ) : src ? (
          <img src={src} alt={label} className="w-full h-full object-contain" loading="lazy" decoding="async" />
        ) : (
          <div className="text-xs text-gray-500 animate-pulse">{t('laden')}</div>
        )}
      </div>
    </div>
  );
}

// ── Review modal ─────────────────────────────────────────────────────────────
function ReviewModal({ record, onClose, onBeoordeeld }) {
  const { t } = useTaal();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [toonReject, setToonReject] = useState(false);
  const [opmerking, setOpmerking] = useState('');

  async function beoordeel(status) {
    if (status === 'afgekeurd' && !opmerking.trim()) {
      setFout(t('kyc_review_reden_vereist'));
      return;
    }
    setBezig(true);
    setFout('');
    try {
      await apiFetch(`/admin/kyc/${record.id}/beoordeel`, {
        method: 'PATCH',
        body: { status, opmerking: opmerking.trim() || undefined },
      });
      onBeoordeeld?.();
      onClose();
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-md p-5 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-soft-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-medium text-ink-1">
              {t('kyc_review_modal_titel')}
            </h3>
            <p className="text-sm text-ink-2 mt-0.5">
              {record.userNaam || record.userEmail} · {record.documentType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-ink-1"
            aria-label={t('sluiten')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Document info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
          <div>
            <div className="text-gray-500">{t('kyc_upload_document_nummer')}</div>
            <div className="font-mono text-ink-1">{record.documentNummer}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('kyc_upload_geboortedatum')}</div>
            <div className="text-ink-1">{record.geboortedatum}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('kyc_upload_nationaliteit')}</div>
            <div className="text-ink-1">{record.nationaliteit}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('kyc_review_ingediend_op')}</div>
            <div className="text-ink-1">{fmtDatum(record.ingediendOp)}</div>
          </div>
        </div>

        {/* Documenten */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <DocumentBeeld recordId={record.id} type="voorkant" label={t('kyc_upload_voorkant_label')} />
          {record.heeftAchterkant && (
            <DocumentBeeld recordId={record.id} type="achterkant" label={t('kyc_upload_achterkant_label')} />
          )}
          <DocumentBeeld recordId={record.id} type="selfie" label={t('kyc_upload_selfie_label')} />
        </div>

        {fout && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-3">
            {fout}
          </div>
        )}

        {toonReject ? (
          <div className="space-y-3">
            <label htmlFor="rejectReden" className="block text-sm font-semibold text-ink-1">
              {t('kyc_review_reden_label')}
            </label>
            <textarea
              id="rejectReden"
              value={opmerking}
              onChange={(e) => setOpmerking(e.target.value)}
              rows={3}
              placeholder={t('kyc_review_reden_placeholder')}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink-1 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setToonReject(false); setFout(''); }}
                disabled={bezig}
                className="px-4 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 hover:bg-surface-3 disabled:opacity-40"
              >
                {t('terug')}
              </button>
              <button
                onClick={() => beoordeel('afgekeurd')}
                disabled={bezig || !opmerking.trim()}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-sm text-white font-semibold disabled:opacity-40"
              >
                {bezig ? t('laden') : `${t('kyc_review_definitief_afkeuren')}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <button
              onClick={onClose}
              disabled={bezig}
              className="px-4 py-2 rounded-md bg-surface border border-border text-sm text-ink-1 hover:bg-surface-3 disabled:opacity-40"
            >
              {t('annuleren')}
            </button>
            <button
              onClick={() => setToonReject(true)}
              disabled={bezig}
              className="px-4 py-2 rounded-md bg-red-600/90 hover:bg-red-700 text-sm text-white font-semibold disabled:opacity-40"
            >
              {t('kyc_review_afkeuren')}
            </button>
            <button
              onClick={() => {
                if (window.confirm(t('kyc_review_bevestig_approve'))) {
                  beoordeel('goedgekeurd');
                }
              }}
              disabled={bezig}
              className="px-4 py-2 rounded-md bg-success-600 hover:bg-success-700 text-sm text-white font-semibold disabled:opacity-40"
            >
              {bezig ? t('laden') : `${t('kyc_review_goedkeuren')}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function KYCReviewQueue() {
  const { t } = useTaal();
  const [records, setRecords] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [actief, setActief] = useState(null); // record voor modal

  const laad = useCallback(async () => {
    setLaden(true);
    setFout('');
    try {
      const data = await apiFetch('/admin/kyc/review-queue');
      setRecords(data.records || []);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [t]);

  useEffect(() => { laad(); }, [laad]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-medium text-ink-1">
            {t('kyc_review_queue_titel')}
          </h2>
          <p className="text-xs text-ink-2 mt-0.5">
            {t('kyc_review_queue_subtitel', { aantal: records.length })}
          </p>
        </div>
        <button
          onClick={laad}
          disabled={laden}
          className="text-gray-500 hover:text-brand-600 disabled:opacity-40"
          title={t('vernieuwen')}
          aria-label={t('vernieuwen')}
        >
          <Refresh className="w-5 h-5" />
        </button>
      </div>

      {fout && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
          {fout}
        </div>
      )}

      {laden ? (
        <div className="text-center text-ink-2 py-10">{t('laden')}</div>
      ) : records.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-8 text-center text-ink-2">
          <Mail className="w-10 h-10 mx-auto mb-3 text-gray-500" />
          <p className="font-semibold">{t('kyc_review_leeg_titel')}</p>
          <p className="text-xs text-gray-500 mt-2">{t('kyc_review_leeg_subtitel')}</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-3 border-b border-border">
                <tr className="text-left text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">
                  <th className="px-4 py-3">{t('kyc_review_kol_gebruiker')}</th>
                  <th className="px-4 py-3">{t('kyc_review_kol_doctype')}</th>
                  <th className="px-4 py-3">{t('kyc_review_kol_docnummer')}</th>
                  <th className="px-4 py-3">{t('kyc_review_kol_nationaliteit')}</th>
                  <th className="px-4 py-3">{t('kyc_review_kol_ingediend')}</th>
                  <th className="px-4 py-3 text-right">{t('kyc_review_kol_actie')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-3 transition cursor-pointer" onClick={() => setActief(r)}>
                    <td className="px-4 py-3">
                      <div className="text-ink-1">{r.userNaam || '—'}</div>
                      <div className="text-xs text-gray-500 font-mono">{r.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-1 capitalize">{r.documentType}</td>
                    <td className="px-4 py-3 text-ink-2 font-mono text-xs">{r.documentNummer}</td>
                    <td className="px-4 py-3 text-ink-2">{r.nationaliteit}</td>
                    <td className="px-4 py-3 text-ink-2 text-xs">{fmtDatum(r.ingediendOp)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActief(r); }}
                        className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md"
                      >
                        {t('kyc_review_bekijken')} →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        {t('kyc_review_hint')}
      </div>

      {actief && (
        <ReviewModal
          record={actief}
          onClose={() => setActief(null)}
          onBeoordeeld={laad}
        />
      )}
    </div>
  );
}
