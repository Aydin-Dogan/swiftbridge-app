/**
 * WachtlijstModal.jsx — Inschrijven op wachtlijst voor "binnenkort"-corridors.
 *
 * Wordt getoond wanneer een gebruiker in PaymentFlow een valuta kiest waar de
 * uitbetaling nog niet live is (status='binnenkort'). Voorkomt dat de
 * gebruiker richting iDEAL gaat voor een corridor die nog niet kan uitbetalen.
 *
 * Modes:
 *   - ingelogd: email uit profiel pre-fill
 *   - anoniem (landing): email handmatig invullen
 *
 * Backend: POST /wachtlijst. UNIQUE(email, valuta_code) maakt het idempotent.
 */
import { useState } from 'react';
import Vlag from './Vlag';
import { apiFetch } from '../services/api';
import { useTaal } from '../i18n';

export default function WachtlijstModal({ open, valuta, eurBedrag, gebruikerEmail, onSluit }) {
  const { t } = useTaal();
  const [email, setEmail] = useState(gebruikerEmail || '');
  const [bezig, setBezig] = useState(false);
  const [resultaat, setResultaat] = useState(null);
  const [fout, setFout] = useState('');

  if (!open || !valuta) return null;

  async function inschrijven(e) {
    e.preventDefault();
    setFout('');
    setBezig(true);
    try {
      const data = await apiFetch('/wachtlijst', {
        method: 'POST',
        body: {
          email: email.trim().toLowerCase(),
          valutaCode: valuta.code,
          landCode: valuta.landCode.toUpperCase(),
          eurBedrag: Number(eurBedrag) || undefined,
          bron: 'paymentflow',
        },
      });
      setResultaat({ nieuw: data.nieuw, bericht: data.bericht });
    } catch (err) {
      setFout(err.message || t('wachtlijst_fout_algemeen'));
    } finally {
      setBezig(false);
    }
  }

  // Render: backdrop + centered card
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wachtlijst-titel"
      onClick={(e) => { if (e.target === e.currentTarget) onSluit(); }}
    >
      <div className="bg-white rounded-3xl sm:rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-7 animate-fade-up">
        {!resultaat ? (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <Vlag land={valuta.landCode} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="wachtlijst-titel" className="text-lg font-extrabold text-gray-900">
                  {t('wachtlijst_titel', { land: valuta.land })}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {t('wachtlijst_subtitel', { valuta: valuta.code })}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-5">
              {t('wachtlijst_uitleg')}
            </p>

            <form onSubmit={inschrijven} className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                  {t('wachtlijst_email_label')}
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              {fout && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  {fout}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={onSluit}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition"
                >
                  {t('wachtlijst_annuleer')}
                </button>
                <button
                  type="submit"
                  disabled={bezig || !email}
                  className="flex-1 btn-primary py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bezig ? '⏳ ' + t('wachtlijst_bezig') : '🔔 ' + t('wachtlijst_cta')}
                </button>
              </div>
            </form>

            <p className="text-[11px] text-gray-400 text-center mt-4">
              {t('wachtlijst_privacy')}
            </p>
          </>
        ) : (
          <>
            <div className="text-center py-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center text-3xl mb-4">
                ✅
              </div>
              <h2 className="text-lg font-extrabold text-gray-900 mb-2">
                {resultaat.nieuw ? t('wachtlijst_succes_titel') : t('wachtlijst_reeds_ingeschreven_titel')}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-5 px-2">
                {resultaat.bericht}
              </p>
              <button
                onClick={onSluit}
                className="btn-primary w-full py-3 text-sm"
              >
                {t('wachtlijst_sluit')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
