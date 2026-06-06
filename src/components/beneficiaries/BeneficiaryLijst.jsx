/**
 * BeneficiaryLijst.jsx — Hoofd component voor beneficiaries beheer
 * Toont alle begunstigden gesorteerd op laatst_gebruikt_op DESC.
 * Bevat add/edit/delete flow met bevestigingsmodal.
 * API: GET/POST/PATCH/DELETE /beneficiaries (httpOnly cookie auth + CSRF)
 */
import { useEffect, useState, useCallback } from 'react';
import { useTaal } from '../../i18n';
import { parseError } from '../../services/api';
import BeneficiaryKaart from './BeneficiaryKaart';
import BeneficiaryFormulier from './BeneficiaryFormulier';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── CSRF helper: lees X-CSRF-Token uit sb_csrf cookie ───────────────────────
function leesCsrf() {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const match = document.cookie.match(/(?:^|;\s*)sb_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function authHeaders(extra = {}) {
  const headers = { ...extra };
  const csrf = leesCsrf();
  if (csrf) headers['X-CSRF-Token'] = csrf;
  return headers;
}

// ── Bevestig delete modal ───────────────────────────────────────────────────
function BevestigDelete({ beneficiary, bezig, onAnnuleer, onBevestig }) {
  const { t } = useTaal();
  if (!beneficiary) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-lg border border-white/30 rounded-2xl w-full max-w-sm p-5 shadow-xl">
        <div className="text-center space-y-3">
          <div className="text-4xl">🗑️</div>
          <h3 className="font-bold text-gray-800">{t('benef_verwijder_titel')}</h3>
          <p className="text-sm text-gray-600">
            {t('benef_verwijder_vraag', { naam: beneficiary.naam })}
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onAnnuleer}
              disabled={bezig}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-xl hover:bg-gray-50"
            >
              {t('annuleren')}
            </button>
            <button
              onClick={onBevestig}
              disabled={bezig}
              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white font-bold py-2 rounded-xl"
            >
              {bezig ? `${t('laden')}` : `🗑️ ${t('benef_verwijder')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BeneficiaryLijst({ token }) {
  const { t } = useTaal();
  const [lijst, setLijst] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formBezig, setFormBezig] = useState(false);
  const [formFout, setFormFout] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBezig, setDeleteBezig] = useState(false);

  const laad = useCallback(async () => {
    setLaden(true);
    setFout('');
    try {
      const res = await fetch(`${API}/beneficiaries`, {
        credentials: 'include',
        headers: authHeaders(token ? { Authorization: `Bearer ${token}` } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      // Server stuurt al gesorteerd, maar client-side sort als veiligheidsnet
      const items = Array.isArray(data) ? data : (data.items || data.beneficiaries || []);
      const sorted = [...items].sort((a, b) => {
        const da = a.laatst_gebruikt_op ? new Date(a.laatst_gebruikt_op).getTime() : 0;
        const db = b.laatst_gebruikt_op ? new Date(b.laatst_gebruikt_op).getTime() : 0;
        return db - da;
      });
      setLijst(sorted);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [token, t]);

  useEffect(() => { laad(); }, [laad]);

  async function opslaan(payload) {
    setFormBezig(true);
    setFormFout('');
    try {
      const isUpdate = !!editTarget?.id;
      const url = isUpdate ? `${API}/beneficiaries/${editTarget.id}` : `${API}/beneficiaries`;
      const res = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: authHeaders({
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      setFormOpen(false);
      setEditTarget(null);
      await laad();
    } catch (e) {
      setFormFout(parseError(e, t));
    } finally {
      setFormBezig(false);
    }
  }

  async function verwijder() {
    if (!deleteTarget?.id) return;
    setDeleteBezig(true);
    try {
      const res = await fetch(`${API}/beneficiaries/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders(token ? { Authorization: `Bearer ${token}` } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      setDeleteTarget(null);
      await laad();
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setDeleteBezig(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header met add knop */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {laden ? '...' : `${lijst.length} ${lijst.length === 1 ? t('benef_eenheid') : t('benef_meervoud')}`}
        </h4>
        <button
          onClick={() => { setEditTarget(null); setFormFout(''); setFormOpen(true); }}
          className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full transition"
        >
          + {t('benef_toevoegen')}
        </button>
      </div>

      {/* Loading skeleton */}
      {laden && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!laden && fout && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm flex items-center justify-between gap-2">
          <span>{fout}</span>
          <button onClick={laad} className="text-xs underline whitespace-nowrap">🔄 {t('vernieuwen')}</button>
        </div>
      )}

      {/* Empty state */}
      {!laden && !fout && lijst.length === 0 && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center space-y-3">
          <div className="text-4xl">👥</div>
          <p className="text-sm text-gray-600">{t('benef_leeg_uitleg')}</p>
          <button
            onClick={() => { setEditTarget(null); setFormFout(''); setFormOpen(true); }}
            className="btn-primary text-sm px-4 py-2"
          >
            + {t('benef_toevoeg_eerste')}
          </button>
        </div>
      )}

      {/* Lijst */}
      {!laden && lijst.length > 0 && (
        <div className="space-y-2">
          {lijst.map(b => (
            <BeneficiaryKaart
              key={b.id}
              beneficiary={b}
              onBewerk={(b) => { setEditTarget(b); setFormFout(''); setFormOpen(true); }}
              onVerwijder={(b) => setDeleteTarget(b)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <BeneficiaryFormulier
        open={formOpen}
        initial={editTarget}
        bezig={formBezig}
        fout={formFout}
        onAnnuleer={() => { setFormOpen(false); setEditTarget(null); }}
        onOpslaan={opslaan}
      />
      <BevestigDelete
        beneficiary={deleteTarget}
        bezig={deleteBezig}
        onAnnuleer={() => setDeleteTarget(null)}
        onBevestig={verwijder}
      />
    </div>
  );
}
