/**
 * PinInstellingen.jsx — PIN aan/uit + setup voor Profiel-pagina (PIN-1).
 *
 * Drie modes:
 *   - Toon huidige status (ingeschakeld? sinds wanneer?)
 *   - Setup-flow: huidig wachtwoord + nieuwe PIN + bevestig PIN
 *   - Uitschakel-flow: huidig wachtwoord-confirmation
 *
 * Gebruikt UI primitives (Card, Knop, VeldGroep).
 */
import { useState, useEffect } from 'react';
import { useTaal } from '../../i18n';
import { apiFetch } from '../../services/api';
import { Card, Knop, VeldGroep } from '../ui';
import { Lock } from '../icons/Icons';

const PIN_LENGTE = 6;

export default function PinInstellingen() {
  const { t } = useTaal();
  const [status, setStatus] = useState(null);
  const [fase, setFase] = useState('lezen'); // 'lezen' | 'idle' | 'setup' | 'uitschakel' | 'klaar'
  const [wachtwoord, setWachtwoord] = useState('');
  const [pin, setPin] = useState('');
  const [pinBevestig, setPinBevestig] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  useEffect(() => {
    laadStatus();
  }, []);

  async function laadStatus() {
    setFase('lezen');
    try {
      const data = await apiFetch('/auth/pin/status');
      setStatus(data);
      setFase('idle');
    } catch {
      setFase('idle');
    }
  }

  function reset() {
    setWachtwoord('');
    setPin('');
    setPinBevestig('');
    setFout('');
    setFase('idle');
  }

  async function instelOpslaan(e) {
    e.preventDefault();
    setFout('');
    if (!new RegExp(`^\\d{${PIN_LENGTE}}$`).test(pin)) {
      setFout(t('pin_setup_fout_lengte') || `PIN moet ${PIN_LENGTE} cijfers zijn`);
      return;
    }
    if (pin !== pinBevestig) {
      setFout(t('pin_setup_fout_match') || 'PINs komen niet overeen');
      return;
    }
    if (!wachtwoord) {
      setFout(t('pin_setup_fout_wachtwoord_leeg') || 'Wachtwoord vereist');
      return;
    }
    setBezig(true);
    try {
      await apiFetch('/auth/pin/instellen', {
        method: 'POST',
        body: { huidigWachtwoord: wachtwoord, pin },
      });
      reset();
      setFase('klaar');
      laadStatus();
    } catch (e2) {
      const code = e2?.body?.error || e2?.message || '';
      if (/onjuist wachtwoord/i.test(code)) {
        setFout(t('pin_setup_fout_wachtwoord_onjuist') || 'Onjuist wachtwoord');
      } else if (/rate/i.test(code)) {
        setFout(t('pin_setup_fout_te_vaak') || 'Te veel pogingen — probeer over een uur opnieuw');
      } else {
        setFout(t('pin_setup_fout_algemeen') || 'Er ging iets mis');
      }
    } finally {
      setBezig(false);
    }
  }

  async function uitschakelen(e) {
    e.preventDefault();
    if (!wachtwoord) {
      setFout(t('pin_uit_fout_wachtwoord_leeg') || 'Wachtwoord vereist');
      return;
    }
    setBezig(true);
    setFout('');
    try {
      await apiFetch('/auth/pin/uitschakelen', {
        method: 'POST',
        body: { huidigWachtwoord: wachtwoord },
      });
      reset();
      laadStatus();
    } catch (e2) {
      const code = e2?.body?.error || e2?.message || '';
      if (/onjuist wachtwoord/i.test(code)) {
        setFout(t('pin_uit_fout_wachtwoord_onjuist') || 'Onjuist wachtwoord');
      } else {
        setFout(t('pin_uit_fout_algemeen') || 'Er ging iets mis');
      }
    } finally {
      setBezig(false);
    }
  }

  if (fase === 'lezen') {
    return (
      <Card variant="default" size="md">
        <div className="text-sm text-ink-2">{t('laden') || 'Laden...'}</div>
      </Card>
    );
  }

  return (
    <Card variant="default" size="md">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-brand-600 dark:text-brand-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-ink-1">
            {t('pin_instelling_titel') || 'App-PIN'}
          </h3>
          <p className="text-xs text-ink-2 mt-0.5">
            {t('pin_instelling_uitleg') ||
              `${PIN_LENGTE}-cijferige PIN bij app-open en bevestiging bij elke overboeking.`}
          </p>
        </div>
      </div>

      {fase === 'klaar' && (
        <Card variant="success" size="sm" className="mb-3">
          <p className="text-xs text-fg-success font-medium">
            {t('pin_setup_succes') || 'PIN ingesteld. Werkt nu bij app-open en transacties.'}
          </p>
        </Card>
      )}

      {/* IDLE-state: laat status zien + knoppen */}
      {fase === 'idle' && (
        <>
          <div className="flex items-center justify-between bg-surface-3 rounded-xl px-3 py-2.5 mb-3">
            <span className="text-sm font-medium text-ink-1">
              {t('pin_instelling_status_label') || 'Status'}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              status?.ingeschakeld
                ? 'bg-green-50 text-fg-success dark:bg-green-900/30'
                : 'bg-amber-50 text-fg-warning dark:bg-amber-900/30'
            }`}>
              {status?.ingeschakeld
                ? (t('pin_instelling_status_aan') || 'Ingeschakeld')
                : (t('pin_instelling_status_uit') || 'Niet ingesteld')}
            </span>
          </div>
          <div className="flex gap-2">
            {!status?.ingeschakeld && (
              <Knop variant="primary" fullWidth onClick={() => setFase('setup')}>
                {t('pin_instelling_setup_knop') || 'PIN instellen'}
              </Knop>
            )}
            {status?.ingeschakeld && (
              <>
                <Knop variant="secondary" onClick={() => setFase('setup')}>
                  {t('pin_instelling_wijzig_knop') || 'PIN wijzigen'}
                </Knop>
                <Knop variant="destructive" onClick={() => setFase('uitschakel')}>
                  {t('pin_instelling_uit_knop') || 'Uitschakelen'}
                </Knop>
              </>
            )}
          </div>
        </>
      )}

      {/* SETUP-state: form */}
      {fase === 'setup' && (
        <form onSubmit={instelOpslaan} className="space-y-3">
          <VeldGroep
            label={t('pin_setup_wachtwoord_label') || 'Huidig wachtwoord'}
            type="password"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            autoComplete="current-password"
            verplicht
          />
          <VeldGroep
            label={t('pin_setup_pin_label') || `Nieuwe ${PIN_LENGTE}-cijferige PIN`}
            type="password"
            inputMode="numeric"
            pattern={`\\d{${PIN_LENGTE}}`}
            maxLength={PIN_LENGTE}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTE))}
            autoComplete="new-password"
            verplicht
          />
          <VeldGroep
            label={t('pin_setup_bevestig_label') || 'Bevestig PIN'}
            type="password"
            inputMode="numeric"
            pattern={`\\d{${PIN_LENGTE}}`}
            maxLength={PIN_LENGTE}
            value={pinBevestig}
            onChange={(e) => setPinBevestig(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTE))}
            autoComplete="new-password"
            verplicht
          />
          {fout && (
            <Card variant="danger" size="sm">
              <p className="text-xs text-fg-error">{fout}</p>
            </Card>
          )}
          <div className="flex gap-2 pt-1">
            <Knop variant="secondary" fullWidth onClick={reset} disabled={bezig}>
              {t('annuleer') || 'Annuleren'}
            </Knop>
            <Knop variant="primary" type="submit" fullWidth laden={bezig}>
              {bezig ? (t('bezig') || 'Bezig...') : (t('pin_setup_opslaan') || 'PIN opslaan')}
            </Knop>
          </div>
        </form>
      )}

      {/* UITSCHAKEL-state */}
      {fase === 'uitschakel' && (
        <form onSubmit={uitschakelen} className="space-y-3">
          <Card variant="danger" size="sm">
            <p className="text-xs text-fg-error">
              {t('pin_uit_waarschuwing') ||
                'PIN uitschakelen betekent geen lock-screen meer en geen tx-bevestiging. Niet aangeraden.'}
            </p>
          </Card>
          <VeldGroep
            label={t('pin_uit_wachtwoord_label') || 'Bevestig met je wachtwoord'}
            type="password"
            value={wachtwoord}
            onChange={(e) => setWachtwoord(e.target.value)}
            autoComplete="current-password"
            verplicht
            fout={fout}
          />
          <div className="flex gap-2 pt-1">
            <Knop variant="secondary" fullWidth onClick={reset} disabled={bezig}>
              {t('annuleer') || 'Annuleren'}
            </Knop>
            <Knop variant="destructive" type="submit" fullWidth laden={bezig}>
              {bezig ? (t('bezig') || 'Bezig...') : (t('pin_uit_bevestig') || 'PIN uitschakelen')}
            </Knop>
          </div>
        </form>
      )}
    </Card>
  );
}
