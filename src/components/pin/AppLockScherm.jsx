/**
 * AppLockScherm.jsx — Full-screen PIN-pad voor app-lock + tx-confirm (PIN-1).
 *
 * Twee modes:
 *   - 'app_lock'   = bij app-open, ontgrendel sessie
 *   - 'tx_confirm' = bij tx-creatie, returnt txConfirmToken via onSucces
 *
 * UX (Wise/Revolut-stijl):
 *   - 6 dots tonen ingevoerde digits
 *   - 3x3 keypad + delete-knop
 *   - Auto-submit zodra 6 digits zijn ingevoerd
 *   - Shake-animatie bij fout
 *   - Toont resterende blokkade-tijd bij geblokkeerd
 *   - "Wachtwoord vergeten"-link niet hier — alleen vanuit Profiel-settings
 *
 * Props:
 *   doel       — 'app_lock' | 'tx_confirm'
 *   onSucces   — (token?) => void  (token alleen bij tx_confirm)
 *   onAnnuleer — () => void        (alleen voor tx_confirm; app_lock is non-dismissible)
 *   titel/uitleg — optionele override van standaard i18n-tekst
 */
import { useState, useEffect, useCallback } from 'react';
import { useTaal } from '../../i18n';
import { apiFetch } from '../../services/api';
import { Lock, X } from '../icons/Icons';

const PIN_LENGTE = 6;

export default function AppLockScherm({
  doel = 'app_lock',
  onSucces,
  onAnnuleer,
  titel,
  uitleg,
}) {
  const { t } = useTaal();
  const [pin, setPin] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [shake, setShake] = useState(false);
  const [blokkadeRest, setBlokkadeRest] = useState(0); // seconden

  // Init: check status — als al geblokkeerd, toon countdown
  useEffect(() => {
    apiFetch('/auth/pin/status')
      .then((data) => {
        if (data?.geblokkeerd && data.blokkadeRestSec > 0) {
          setBlokkadeRest(data.blokkadeRestSec);
        }
      })
      .catch(() => {/* niet kritiek */});
  }, []);

  // Countdown timer voor blokkade
  useEffect(() => {
    if (blokkadeRest <= 0) return;
    const i = setInterval(() => {
      setBlokkadeRest((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(i);
  }, [blokkadeRest]);

  const indienen = useCallback(async (volledigePin) => {
    if (volledigePin.length !== PIN_LENGTE) return;
    if (blokkadeRest > 0) return;
    setBezig(true);
    setFout('');
    try {
      const data = await apiFetch('/auth/pin/verifieren', {
        method: 'POST',
        body: { pin: volledigePin, doel },
      });
      if (data?.ok) {
        onSucces?.(data.txConfirmToken);
      } else {
        // Niet bereikt; backend returnt error-status
        setFout(t('pin_fout_onbekend') || 'Onbekende fout');
        triggerShake();
      }
    } catch (e) {
      const body = e?.body || {};
      if (body.geblokkeerd) {
        setBlokkadeRest(body.blokkadeRestSec || 30);
        setFout('');
      } else {
        const restPogingen = body.falenCount != null ? Math.max(0, 5 - body.falenCount) : null;
        const tekst = restPogingen === 0
          ? (t('pin_fout_geblokkeerd_binnenkort') || 'Onjuiste PIN — bijna geblokkeerd')
          : restPogingen != null
            ? (t('pin_fout_pogingen') || 'Onjuiste PIN — {n} pogingen over').replace('{n}', restPogingen)
            : (t('pin_fout') || 'Onjuiste PIN');
        setFout(tekst);
        triggerShake();
      }
      setPin('');
    } finally {
      setBezig(false);
    }
  }, [doel, onSucces, t, blokkadeRest]);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  function voegToe(d) {
    if (bezig || blokkadeRest > 0) return;
    if (pin.length >= PIN_LENGTE) return;
    const nieuw = pin + d;
    setPin(nieuw);
    setFout('');
    if (nieuw.length === PIN_LENGTE) {
      indienen(nieuw);
    }
  }

  function backspace() {
    if (bezig || blokkadeRest > 0) return;
    setPin((p) => p.slice(0, -1));
    setFout('');
  }

  // Hardware keyboard support
  useEffect(() => {
    function onKey(e) {
      if (bezig || blokkadeRest > 0) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        voegToe(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === 'Escape' && onAnnuleer) {
        onAnnuleer();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, bezig, blokkadeRest]);

  const isAppLock = doel === 'app_lock';
  const defaultTitel = isAppLock
    ? (t('pin_app_lock_titel') || 'Voer je PIN in')
    : (t('pin_tx_confirm_titel') || 'Bevestig met PIN');
  const defaultUitleg = isAppLock
    ? (t('pin_app_lock_uitleg') || 'Ontgrendel SwiftBridge')
    : (t('pin_tx_confirm_uitleg') || 'Bevestig de overboeking');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-2 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-titel"
    >
      <div className="w-full max-w-xs">
        {/* Header — annuleer-X alleen bij tx_confirm */}
        {!isAppLock && onAnnuleer && (
          <button
            type="button"
            onClick={onAnnuleer}
            aria-label="Annuleer"
            className="absolute top-4 right-4 p-2 text-ink-3 hover:text-ink-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icoon + titels */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-3">
            <Lock className="w-7 h-7 text-brand-600 dark:text-brand-300" />
          </div>
          <h1 id="pin-titel" className="text-xl font-bold text-ink-1">{titel || defaultTitel}</h1>
          <p className="text-sm text-ink-2 mt-1">{uitleg || defaultUitleg}</p>
        </div>

        {/* Dots */}
        <div
          className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}
          aria-live="polite"
        >
          {Array.from({ length: PIN_LENGTE }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`w-3 h-3 rounded-full transition-all ${
                i < pin.length
                  ? 'bg-brand-600 dark:bg-brand-300 scale-110'
                  : 'bg-border-strong'
              }`}
            />
          ))}
        </div>

        {/* Fout-melding */}
        {fout && (
          <p role="alert" className="text-center text-sm text-fg-error mb-4">
            {fout}
          </p>
        )}

        {/* Blokkade-countdown */}
        {blokkadeRest > 0 && (
          <div className="text-center text-sm text-fg-warning mb-4">
            {(t('pin_geblokkeerd_uitleg') || 'Geblokkeerd — probeer over')}{' '}
            <span className="font-bold tabular-nums">{formatTijd(blokkadeRest)}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <KeypadKnop key={n} onClick={() => voegToe(String(n))} disabled={bezig || blokkadeRest > 0}>
              {n}
            </KeypadKnop>
          ))}
          <div /> {/* lege cel onder-links */}
          <KeypadKnop onClick={() => voegToe('0')} disabled={bezig || blokkadeRest > 0}>
            0
          </KeypadKnop>
          <KeypadKnop onClick={backspace} disabled={bezig || blokkadeRest > 0 || pin.length === 0} aria-label="Backspace">
            ←
          </KeypadKnop>
        </div>
      </div>

      {/* Inline keyframes voor shake-animatie */}
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 50%{transform:translateX(8px)} 75%{transform:translateX(-4px)} }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

function KeypadKnop({ children, onClick, disabled, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-16 rounded-2xl bg-surface border border-border text-2xl font-medium text-ink-1
                 hover:bg-surface-3 active:scale-95 active:bg-border
                 disabled:opacity-30 disabled:cursor-not-allowed
                 transition select-none tabular-nums"
      {...rest}
    >
      {children}
    </button>
  );
}

function formatTijd(sec) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
