/**
 * GdprBeheer.jsx — AVG/GDPR rechten beheer
 * Recht op inzage (Art. 15): download alle persoonlijke data als JSON.
 * Recht op vergetelheid (Art. 17): anonimiseer account (transactiegegevens
 * blijven 5 jaar bewaard conform Wwft Art. 38).
 */
import { useState } from 'react';
import { parseError } from '../services/api';
import { useTaal } from '../i18n';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function GdprBeheer({ token }) {
  const { t } = useTaal();
  const [bezigExport, setBezigExport] = useState(false);
  const [bezigCsv, setBezigCsv] = useState(false);
  const [bezigAnoniem, setBezigAnoniem] = useState(false);
  const [fout, setFout] = useState('');
  const [bericht, setBericht] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bevestiging, setBevestiging] = useState('');

  async function downloadData() {
    setBezigExport(true);
    setFout('');
    setBericht('');
    try {
      const res = await fetch(`${API}/users/me/export`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFout(parseError({ ...err, status: res.status }, t));
        return;
      }
      const blob = await res.blob();
      // Haal filename uit Content-Disposition als beschikbaar
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/);
      const bestandsnaam = match ? match[1] : `swiftbridge-data-${new Date().toISOString().slice(0, 10)}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = bestandsnaam;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBericht(t('gdpr_download_succes'));
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezigExport(false);
    }
  }

  // CSV export (Verbetering TT) — download als bestand
  async function downloadCsv() {
    setBezigCsv(true);
    setFout('');
    setBericht('');
    try {
      const res = await fetch(`${API}/users/me/transacties-export.csv`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFout(parseError({ ...err, status: res.status }, t));
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/);
      const naam = match ? match[1] : `swiftbridge-transacties-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = naam;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBericht(t('gdpr_csv_succes'));
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezigCsv(false);
    }
  }

  async function bevestigAnonimiseren() {
    if (bevestiging.trim() !== 'IK BEGRIJP HET') {
      setFout(t('gdpr_typ_fout'));
      return;
    }
    setBezigAnoniem(true);
    setFout('');
    try {
      const res = await fetch(`${API}/users/me/anonimiseer`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bevestiging: 'IK BEGRIJP HET' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        setBezigAnoniem(false);
        return;
      }

      // Wis lokale sessie volledig
      try {
        localStorage.removeItem('sb_token');
        localStorage.removeItem('sb_refresh');
        localStorage.removeItem('sb_gebruiker');
        sessionStorage.clear();
      } catch {/* private mode */}

      // Toon bevestiging in modal (geen native alert) — daarna redirect na 2s
      // zodat gebruiker de bevestiging écht ziet.
      setModalOpen(false);
      setBericht(t('gdpr_afmelden_bericht'));
      setTimeout(() => {
        window.location.href = '/login';
      }, 2500);
    } catch (e) {
      setFout(parseError(e, t));
      setBezigAnoniem(false);
    }
  }

  function sluitModal() {
    if (bezigAnoniem) return;
    setModalOpen(false);
    setBevestiging('');
    setFout('');
  }

  return (
    <div className="card-glass p-5 space-y-4 animate-fade-up border-l-4 border-slate-400">
      <div>
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span>{t('gdpr_titel')}</span>
        </h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
          {t('gdpr_intro')}
        </p>
      </div>

      {/* Wwft disclaimer — prominent geel info box bovenaan */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-xs text-amber-900 leading-relaxed">
          {t('gdpr_wwft_disclaimer')}
        </p>
      </div>

      {/* Data download — blauwe sectie */}
      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-4 space-y-2">
        <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
          <span>{t('gdpr_download_titel')}</span>
        </h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          {t('gdpr_download_uitleg')}
        </p>
        <button
          onClick={downloadData}
          disabled={bezigExport}
          className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {bezigExport ? `⏳ ${t('gdpr_download_bezig')}` : t('gdpr_download_knop')}
        </button>
        <p className="text-[11px] text-gray-500 leading-snug pt-1">
          🔐 {t('gdpr_download_subtekst')}
        </p>
      </div>

      {/* CSV export voor accountant (Verbetering TT) — naast JSON-volledig */}
      <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 space-y-2">
        <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
          <span>📊 {t('gdpr_csv_titel')}</span>
        </h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          {t('gdpr_csv_uitleg')}
        </p>
        <button
          onClick={downloadCsv}
          disabled={bezigCsv}
          className="w-full py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {bezigCsv ? `⏳ ${t('gdpr_download_bezig')}` : t('gdpr_csv_knop')}
        </button>
        <p className="text-[11px] text-gray-500 leading-snug pt-1">
          📋 {t('gdpr_csv_subtekst')}
        </p>
      </div>

      {/* Account anonimiseren — rode sectie, danger zone */}
      <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-4 space-y-2">
        <h4 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
          <span>{t('gdpr_anonimiseer_titel')}</span>
        </h4>
        <p className="text-xs text-rose-800 leading-relaxed">
          {t('gdpr_anonimiseer_uitleg')}
        </p>
        <button
          onClick={() => { setModalOpen(true); setFout(''); setBericht(''); }}
          className="w-full py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
        >
          {t('gdpr_anonimiseer_knop')}
        </button>
      </div>

      {fout && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm">
          ❌ {fout}
        </div>
      )}
      {bericht && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-sm">
          ✅ {bericht}
        </div>
      )}

      {/* Bevestigingsmodal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={sluitModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-lg text-rose-900">{t('gdpr_modal_titel')}</h3>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <p>{t('gdpr_modal_wist_uitleg')}</p>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5 pl-1">
                <li>{t('gdpr_modal_li_persoonlijk')}</li>
                <li>{t('gdpr_modal_li_kyc')}</li>
                <li>{t('gdpr_modal_li_notificaties')}</li>
                <li>{t('gdpr_modal_li_login')}</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-900 flex gap-1.5">
                <span>📋</span>
                <span>{t('gdpr_modal_wwft_note')}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('gdpr_modal_typ_label')} <span className="font-mono text-rose-600">IK BEGRIJP HET</span> {t('gdpr_modal_typ_om')}
              </label>
              <input
                value={bevestiging}
                onChange={(e) => setBevestiging(e.target.value)}
                placeholder="IK BEGRIJP HET"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-500 font-mono"
                disabled={bezigAnoniem}
                autoFocus
              />
            </div>

            {fout && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm">
                {fout}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={sluitModal}
                disabled={bezigAnoniem}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
              >
                {t('gdpr_modal_annuleer')}
              </button>
              <button
                onClick={bevestigAnonimiseren}
                disabled={bezigAnoniem || bevestiging.trim() !== 'IK BEGRIJP HET'}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bezigAnoniem ? `⏳ ${t('gdpr_modal_bezig')}` : t('gdpr_modal_bevestig')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
