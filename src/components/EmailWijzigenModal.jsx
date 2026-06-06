/**
 * EmailWijzigenModal.jsx — Aanvragen van een e-mailwijziging (SS).
 *
 * UI-1 geherschreven met herbruikbare primitives (Card, Knop, VeldGroep)
 * + EE++ semantic tokens. Dark-mode automatisch correct.
 *
 * 3-staps flow:
 * 1. Gebruiker vult huidig wachtwoord + nieuw e-mailadres in
 * 2. Backend verstuurt verificatielink naar nieuwe adres
 * (en waarschuwingsmail met intrek-link naar oude adres)
 * 3. Gebruiker klikt link in nieuwe mailbox -> EmailWijzigenBevestigen page
 *
 * Compliance: AVG art. 16 (recht op rectificatie).
 */
import { useState } from 'react';
import { apiFetch } from '../services/api';
import { useTaal } from '../i18n';
import { Card, Knop, VeldGroep } from './ui';
import { Mail } from './icons/Icons';

export default function EmailWijzigenModal({ open, huidigEmail, token, onSluit }) {
  const { t } = useTaal();
  const [nieuwEmail, setNieuwEmail] = useState('');
  const [huidigWachtwoord, setHuidigWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [succes, setSucces] = useState(false);
  const [fout, setFout] = useState('');
  const [veldFout, setVeldFout] = useState({ email: '', wachtwoord: '' });

  if (!open) return null;

  function sluit() {
    setNieuwEmail('');
    setHuidigWachtwoord('');
    setBezig(false);
    setSucces(false);
    setFout('');
    setVeldFout({ email: '', wachtwoord: '' });
    onSluit?.();
  }

  async function indienen(e) {
    e.preventDefault();
    setFout('');
    setVeldFout({ email: '', wachtwoord: '' });
    const nieuw = nieuwEmail.trim().toLowerCase();
    if (!nieuw || !nieuw.includes('@')) {
      setVeldFout({ email: t('email_wijzig_fout_ongeldig') || 'Voer een geldig e-mailadres in', wachtwoord: '' });
      return;
    }
    if (nieuw === huidigEmail.trim().toLowerCase()) {
      setVeldFout({ email: t('email_wijzig_fout_gelijk') || 'Het nieuwe adres is gelijk aan het huidige', wachtwoord: '' });
      return;
    }
    if (!huidigWachtwoord) {
      setVeldFout({ email: '', wachtwoord: t('email_wijzig_fout_wachtwoord_leeg') || 'Voer je huidige wachtwoord in' });
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
        setVeldFout({ email: '', wachtwoord: t('email_wijzig_fout_wachtwoord_onjuist') || 'Onjuist wachtwoord' });
      } else if (/rate/i.test(code)) {
        setFout(t('email_wijzig_fout_te_vaak') || 'Te veel aanvragen — probeer over een uur opnieuw');
      } else if (/gelijk/i.test(code)) {
        setVeldFout({ email: t('email_wijzig_fout_gelijk') || 'Het nieuwe adres is gelijk aan het huidige', wachtwoord: '' });
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
      <Card
        variant="elevated"
        size="lg"
        className="max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {!succes ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0">
                <h2 id="email-wijzig-titel" className="text-xl font-bold text-ink-1">
                  {t('email_wijzig_titel') || 'E-mailadres wijzigen'}
                </h2>
                <p className="text-xs text-ink-3 mt-1 truncate">
                  {t('email_wijzig_huidig') || 'Huidig'}: <span className="font-mono">{huidigEmail}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={sluit}
                aria-label="Sluit"
                className="text-ink-3 hover:text-ink-1 text-xl leading-none transition-colors -mt-1 -mr-1 p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={indienen} className="space-y-4">
              <VeldGroep
                label={t('email_wijzig_nieuw_label') || 'Nieuw e-mailadres'}
                type="email"
                required
                value={nieuwEmail}
                onChange={(e) => setNieuwEmail(e.target.value)}
                placeholder="naam@voorbeeld.nl"
                autoComplete="email"
                fout={veldFout.email}
                verplicht
              />

              <VeldGroep
                label={t('email_wijzig_wachtwoord_label') || 'Huidig wachtwoord'}
                type="password"
                required
                value={huidigWachtwoord}
                onChange={(e) => setHuidigWachtwoord(e.target.value)}
                autoComplete="current-password"
                hint={t('email_wijzig_wachtwoord_uitleg') ||
                  'Ter beveiliging vragen we je wachtwoord — ook al ben je ingelogd.'}
                fout={veldFout.wachtwoord}
                verplicht
              />

              {/* Waarschuwing-blok als sub-card. Variant 'default' met
                  amber-tint via custom className. */}
              <Card variant="default" size="sm" className="!bg-amber-50 !border-amber-200 dark:!bg-amber-900/20 dark:!border-amber-800/40">
                <p className="font-medium text-xs text-amber-900 dark:text-amber-200 mb-1">
                  {t('email_wijzig_waarschuwing_titel') || 'Wat gaat er gebeuren?'}
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
                  <li>{t('email_wijzig_waarschuwing_1') || 'Je krijgt een bevestigingslink op het nieuwe adres (1 uur geldig).'}</li>
                  <li>{t('email_wijzig_waarschuwing_2') || 'Je oude adres krijgt een waarschuwing met een intrek-link.'}</li>
                  <li>{t('email_wijzig_waarschuwing_3') || 'Na bevestiging word je op alle apparaten uitgelogd.'}</li>
                </ul>
              </Card>

              {fout && (
                <Card variant="danger" size="sm">
                  <p className="text-xs text-fg-error">{fout}</p>
                </Card>
              )}

              <div className="flex gap-2 pt-2">
                <Knop
                  variant="secondary"
                  fullWidth
                  onClick={sluit}
                  disabled={bezig}
                >
                  {t('annuleer') || 'Annuleren'}
                </Knop>
                <Knop
                  variant="primary"
                  type="submit"
                  fullWidth
                  laden={bezig}
                >
                  {bezig
                    ? (t('email_wijzig_bezig') || 'Bezig...')
                    : (t('email_wijzig_versturen') || 'Stuur bevestigingsmail')}
                </Knop>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-3">
              <Mail className="w-8 h-8 text-brand-600 dark:text-brand-300" />
            </div>
            <h2 className="text-xl font-bold text-ink-1 mb-2">
              {t('email_wijzig_succes_titel') || 'Check je nieuwe mailbox'}
            </h2>
            <p className="text-sm text-ink-2 mb-4 leading-relaxed">
              {t('email_wijzig_succes_uitleg') ||
                'We hebben een bevestigingslink gestuurd naar je nieuwe e-mailadres. Klik op de link binnen 1 uur om de wijziging af te ronden.'}
            </p>
            <Card variant="accent" size="sm" className="mb-4">
              <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
                {t('email_wijzig_succes_tip') || 'Geen mail ontvangen? Check je spam-map.'}
              </p>
            </Card>
            <Knop variant="primary" fullWidth onClick={sluit}>
              {t('sluit') || 'Sluiten'}
            </Knop>
          </div>
        )}
      </Card>
    </div>
  );
}
