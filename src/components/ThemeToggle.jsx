/**
 * ThemeToggle.jsx — Light/Dark/System theme schakelaar (UU).
 *
 * Twee varianten:
 *   - compact (default): één knop die door 3 modes cyclet
 *   - dropdown: button met menu (light/dark/system) — voor profiel-pagina
 *
 * Gebruik:
 *   <ThemeToggle />                 // compact, in TopBar
 *   <ThemeToggle variant="menu" />  // dropdown, in Profiel
 */
import { useState, useEffect, useRef } from 'react';
import { useTaal } from '../i18n';
import {
  leesThemeKeuze,
  zetThemeKeuze,
  effectieveTheme,
  pasThemeToe,
} from '../services/theme';

function SunIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

const VOLGORDE = ['light', 'dark', 'system']; // cycle order voor compact

export default function ThemeToggle({ variant = 'compact', className = '' }) {
  const { t } = useTaal();
  const [keuze, setKeuze] = useState(() => leesThemeKeuze());
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Pas toe bij elke wijziging + sync over tabs (storage event)
  useEffect(() => {
    pasThemeToe(keuze);
  }, [keuze]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'sb_theme') setKeuze(leesThemeKeuze());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Klik-buiten sluit dropdown
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function kiesKeuze(nieuwe) {
    setKeuze(nieuwe);
    zetThemeKeuze(nieuwe);
    setOpen(false);
  }

  // Effectieve mode bepaalt welk icoon getoond wordt bij 'system'
  const effectief = effectieveTheme(keuze);

  function CompactIcon() {
    if (keuze === 'system') return <SystemIcon className="w-5 h-5" />;
    if (effectief === 'dark') return <MoonIcon className="w-5 h-5" />;
    return <SunIcon className="w-5 h-5" />;
  }

  if (variant === 'menu') {
    return (
      <div ref={wrapRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t('thema_kies') || 'Thema kiezen'}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-ink-1 bg-surface-3 hover:bg-border transition border border-border"
        >
          <CompactIcon />
          <span>
            {keuze === 'system'
              ? t('thema_systeem') || 'Systeem'
              : keuze === 'dark'
              ? t('thema_donker') || 'Donker'
              : t('thema_licht') || 'Licht'}
          </span>
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-44 bg-surface rounded-xl shadow-soft-lg border border-border overflow-hidden z-50"
          >
            {VOLGORDE.map((k) => (
              <button
                key={k}
                role="menuitem"
                type="button"
                onClick={() => kiesKeuze(k)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${
                  keuze === k ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-ink-1 hover:bg-surface-3'
                }`}
              >
                {k === 'light' && <SunIcon className="w-4 h-4" />}
                {k === 'dark' && <MoonIcon className="w-4 h-4" />}
                {k === 'system' && <SystemIcon className="w-4 h-4" />}
                <span>
                  {k === 'light' ? t('thema_licht') || 'Licht' :
                   k === 'dark'  ? t('thema_donker') || 'Donker' :
                   t('thema_systeem') || 'Systeem'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Compact: één knop die cyclet
  function volgendeKeuze() {
    const idx = VOLGORDE.indexOf(keuze);
    return VOLGORDE[(idx + 1) % VOLGORDE.length];
  }

  const titel = `${t('thema_huidig') || 'Huidig'}: ${
    keuze === 'system' ? (t('thema_systeem') || 'Systeem') :
    keuze === 'dark'   ? (t('thema_donker') || 'Donker') :
    (t('thema_licht') || 'Licht')
  } → ${
    volgendeKeuze() === 'system' ? (t('thema_systeem') || 'Systeem') :
    volgendeKeuze() === 'dark'   ? (t('thema_donker') || 'Donker') :
    (t('thema_licht') || 'Licht')
  }`;

  return (
    <button
      type="button"
      onClick={() => kiesKeuze(volgendeKeuze())}
      aria-label={titel}
      title={titel}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-ink-2 hover:bg-surface-3 hover:text-ink-1 transition ${className}`}
    >
      <CompactIcon />
    </button>
  );
}
