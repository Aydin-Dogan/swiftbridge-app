/**
 * EmailWijzigenModal.jsx — Aanvragen van een e-mailwijziging (SS).
 *
 * 3-staps flow:
 *  1. Gebruiker vult huidig wachtwoord + nieuw e-mailadres in
 *  2. Backend verstuurt verificatielink naar nieuwe adres
 *     (en waarschuwingsmail met intrek-link naar oude adres)
 *  3. Gebruiker klikt link in nieuwe mailbox -> EmailWijzigenBevestigen page
 *
 * Compliance: AVG art. 16 (recht op rectificatie).
 */
import { useState } from 'react';
import { apiFetch } from '../services/api';
import { useTaal } from '../i18n';

export default function EmailWijzigenModal({ open, huidigEmail, token, onSluit }) {
  const { t } = useTaal();
  const [nieuwEmail, setNieuwEmail] = useState('');
  const [huidigWachtwoord, setHuidigWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [succes, setSucces] = useState(false);
  const [fout, setFout] = useState('');

  if (!open) return null;

  function sluit() {
    setNieuwEmail('');
    setHuidigWachtwoord('');
    setBezig(false);
    setSucces(false);
    setFout('');
    onSluit?.();
  }

  async function indienen(e) {
    e.preventDefault();
    setFout('');
    const nieuw = nieuwEmail.trim().toLowerCase();
    if (!nieuw || !nieuw.includes('@')) {
      setFout(t('email_wijzig_fout_ongeldig') || 'Voer een geldig e-mailadres in');
      return;
    }
    if (nieuw === huidigEmail.trim().toLowerCase()) {
      setFout(t('email_wijzig_fout_gelijk') || 'Het nieuwe adres is gelijk aan het huidige');
      return;
    }
    if (!huidigWachtwoord) {
      setFout(t('email_wijzig_fout_wachtwoord_leeg') || 'Voer je huidige wachtwoord in');
      return;
    }
    setBezig(true);
    try {
      await apiFetch('/users/me/email-wijzig-aanvragen', {
        method: 'POST',
        token,
        body: { huidigWachtwoord, nieuwEmail: nieuw },
      });
      setSucces(true);
    } catch (e2) {
      const code = e2?.body?.error || e2?.message || '';
      if (/onjuist wachtwoord/i.test(code)) {
        setFout(t('email_wijzig_fout_wachtwoord_onjuist') || 'Onjuist wachtwoord');
      } else if (/rate/i.test(code)) {
        setFout(t('email_wijzig_fout_te_vaak') || 'Te veel aanvragen — probeer over een uur opnieuw');
      } else if (/gelijk/i.test(code)) {
        setFout(t('email_wijzig_fout_gelijk') || 'Het nieuwe adres is gelijk aan het huidige');
      } else {
        setFout(t('email_wijzig_fout_algemeen') || 'Er ging iets mis. Probeer het later opnieuw.');
      }
    } finally {
      setBezig(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-wijzig-titel"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={sluit}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {!succes ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 id="email-wijzig-titel" className="text-xl font-bold text-gray-900">
                  ✉️ {t('email_wijzig_titel') || 'E-mailadres wijzigen'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {t('email_wijzig_huidig') || 'Huidig'}: <span className="font-mono">{huidigEmail}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={sluit}
                aria-label="Sluit"
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={indienen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('email_wijzig_nieuw_label') || 'Nieuw e-mailadres'}
                </label>
                <input
                  type="email"
                  required
                  value={nieuwEmail}
                  onChange={(e) => setNieuwEmail(e.target.value)}
                  placeholder="naam@voorbeeld.nl"
                  autoComplete="email"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('email_wijzig_wachtwoord_label') || 'Huidig wachtwoord'}
                </label>
                <input
                  type="password"
                  required
                  value={huidigWachtwoord}
                  onChange={(e) => setHuidigWachtwoord(e.target.value)}
                  autoComplete="current-password"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  {t('email_wijzig_wachtwoord_uitleg') ||
                    'Ter beveiliging vragen we je wachtwoord — ook al ben je ingelogd.'}
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-md p-3 text-xs text-amber-900">
                <p className="font-medium mb-1">
                  ⚠ {t('email_wijzig_waarschuwing_titel') || 'Wat gaat er gebeuren?'}
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>{t('email_wijzig_waarschuwing_1') || 'Je krijgt een bevestigingslink op het nieuwe adres (1 uur geldig).'}</li>
                  <li>{t('email_wijzig_waarschuwing_2') || 'Je oude adres krijgt een waarschuwing met een intrek-link.'}</li>
                  <li>{t('email_wijzig_waarschuwing_3') || 'Na bevestiging word je op alle apparaten uitgelogd.'}</li>
                </ul>
              </div>

              {fout && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs p-3 rounded-r-md">
                  {fout}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={sluit}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                  disabled={bezig}
                >
                  {t('annuleer') || 'Annuleren'}
                </button>
                <button
                  type="submit"
                  disabled={bezig}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 transition"
                >
                  {bezig
                    ? (t('email_wijzig_bezig') || 'Bezig...')
                    : (t('email_wijzig_versturen') || 'Stuur bevestigingsmail')}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="text-5xl mb-3">📬</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t('email_wijzig_succes_titel') || 'Check je nieuwe mailbox'}
              </h2>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                {t('email_wijzig_succes_uitleg') ||
                  'We hebben een bevestigingslink gestuurd naar je nieuwe e-mailadres. Klik op de link binnen 1 uur om de wijziging af te ronden.'}
              </p>
              <div className="bg-blue-50 text-xs text-blue-900 p-3 rounded-md mb-4">
                <p className="font-medium">
                  💡 {t('email_wijzig_succes_tip') || 'Geen mail ontvangen? Check je spam-map.'}
                </p>
              </div>
              <button
                type="button"
                onClick={sluit}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                {t('sluit') || 'Sluiten'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
