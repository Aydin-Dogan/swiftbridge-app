/**
 * KYCReviewQueue.jsx — Admin review queue voor document-upload KYC aanvragen
 *
 * Lijst van kyc_records met bron='document_upload' en status='in_behandeling'.
 * Klik op record → modal met 3 thumbnails (voorkant/achterkant/selfie) +
 * approve/reject knoppen.
 *
 * Backend:
 *   GET   /admin/kyc/review-queue       — { records: [...] }
 *   GET   /admin/kyc/:id/document/:type — bytes (image/jpeg|png)
 *   PATCH /admin/kyc/:id/beoordeel      — { status, opmerking? }
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, parseError, API_URL } from '../../services/api';
import { useTaal } from '../../i18n';

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
      <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
        {label}
      </div>
      <div className="aspect-[4/3] bg-black/30 rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
        {fout ? (
          <div className="text-xs text-red-300 p-2 text-center">{fout}</div>
        ) : src ? (
          <img src={src} alt={label} className="w-full h-full object-contain" />
        ) : (
          <div className="text-xs text-white/40 animate-pulse">{t('laden')}</div>
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
      <div className="bg-slate-900 border border-white/20 rounded-2xl p-5 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {t('kyc_review_modal_titel')}
            </h3>
            <p className="text-sm text-white/60 mt-0.5">
              {record.userNaam || record.userEmail} · {record.documentType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl"
            aria-label={t('sluiten')}
          >
            ✕
          </button>
        </div>

        {/* Document info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
          <div>
            <div className="text-white/50">{t('kyc_upload_document_nummer')}</div>
            <div className="font-mono text-white">{record.documentNummer}</div>
          </div>
          <div>
            <div className="text-white/50">{t('kyc_upload_geboortedatum')}</div>
            <div className="text-white">{record.geboortedatum}</div>
          </div>
          <div>
            <div className="text-white/50">{t('kyc_upload_nationaliteit')}</div>
            <div className="text-white">{record.nationaliteit}</div>
          </div>
          <div>
            <div className="text-white/50">{t('kyc_review_ingediend_op')}</div>
            <div className="text-white">{fmtDatum(record.ingediendOp)}</div>
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
          <div role="alert" className="bg-red-500/10 border border-red-300/30 text-red-100 rounded-xl p-3 text-sm mb-3">
            ⚠️ {fout}
          </div>
        )}

        {toonReject ? (
          <div className="space-y-3">
            <label htmlFor="rejectReden" className="block text-sm font-semibold text-white">
              {t('kyc_review_reden_label')}
            </label>
            <textarea
              id="rejectReden"
              value={opmerking}
              onChange={(e) => setOpmerking(e.target.value)}
              rows={3}
              placeholder={t('kyc_review_reden_placeholder')}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setToonReject(false); setFout(''); }}
                disabled={bezig}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white hover:bg-white/20 disabled:opacity-40"
              >
                {t('terug')}
              </button>
              <button
                onClick={() => beoordeel('afgekeurd')}
                disabled={bezig || !opmerking.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm text-white font-semibold disabled:opacity-40"
              >
                {bezig ? t('laden') : `🚫 ${t('kyc_review_definitief_afkeuren')}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <button
              onClick={onClose}
              disabled={bezig}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm text-white hover:bg-white/20 disabled:opacity-40"
            >
              {t('annuleren')}
            </button>
            <button
              onClick={() => setToonReject(true)}
              disabled={bezig}
              className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-sm text-white font-semibold disabled:opacity-40"
            >
              🚫 {t('kyc_review_afkeuren')}
            </button>
            <button
              onClick={() => {
                if (window.confirm(t('kyc_review_bevestig_approve'))) {
                  beoordeel('goedgekeurd');
                }
              }}
              disabled={bezig}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-sm text-white font-semibold disabled:opacity-40"
            >
              {bezig ? t('laden') : `✅ ${t('kyc_review_goedkeuren')}`}
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
          <h2 className="text-lg font-bold text-white">
            {t('kyc_review_queue_titel')}
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            {t('kyc_review_queue_subtitel', { aantal: records.length })}
          </p>
        </div>
        <button
          onClick={laad}
          disabled={laden}
          className="text-white/70 hover:text-white text-xl disabled:opacity-40"
          title={t('vernieuwen')}
          aria-label={t('vernieuwen')}
        >
          🔄
        </button>
      </div>

      {fout && (
        <div role="alert" className="bg-red-500/10 border border-red-300/30 text-red-100 rounded-2xl p-3 text-sm">
          {fout}
        </div>
      )}

      {laden ? (
        <div className="text-center text-white/60 py-10">{t('laden')}</div>
      ) : records.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center text-white/70">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-semibold">{t('kyc_review_leeg_titel')}</p>
          <p className="text-xs text-white/50 mt-2">{t('kyc_review_leeg_subtitel')}</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/10">
                <tr className="text-left text-white/80">
                  <th className="px-4 py-3 font-semibold">{t('kyc_review_kol_gebruiker')}</th>
                  <th className="px-4 py-3 font-semibold">{t('kyc_review_kol_doctype')}</th>
                  <th className="px-4 py-3 font-semibold">{t('kyc_review_kol_docnummer')}</th>
                  <th className="px-4 py-3 font-semibold">{t('kyc_review_kol_nationaliteit')}</th>
                  <th className="px-4 py-3 font-semibold">{t('kyc_review_kol_ingediend')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('kyc_review_kol_actie')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition cursor-pointer" onClick={() => setActief(r)}>
                    <td className="px-4 py-3">
                      <div className="text-white">{r.userNaam || '—'}</div>
                      <div className="text-xs text-white/50 font-mono">{r.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-white/90 capitalize">{r.documentType}</td>
                    <td className="px-4 py-3 text-white/80 font-mono text-xs">{r.documentNummer}</td>
                    <td className="px-4 py-3 text-white/80">{r.nationaliteit}</td>
                    <td className="px-4 py-3 text-white/70 text-xs">{fmtDatum(r.ingediendOp)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActief(r); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
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

      <div className="text-xs text-white/40">
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
