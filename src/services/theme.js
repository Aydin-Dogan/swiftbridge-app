/**
 * theme.js — Light/dark/system theme service (UU).
 *
 * Bewaart keuze in localStorage onder 'sb_theme'. Drie waarden:
 *   'light'   — altijd licht
 *   'dark'    — altijd donker
 *   'system'  — volg OS prefers-color-scheme (default)
 *
 * Mechaniek: voegt/verwijdert .dark class op <html>. Tailwind 'class'-mode
 * leest deze class; CSS variables in index.css doen de echte kleur-swap.
 *
 * FOUC-preventie: ook in index.html staat een mini-script dat de class
 * zet vóór React rendert. Deze service is voor RUNTIME wijzigingen.
 */

const STORAGE_KEY = 'sb_theme';
const VALID = new Set(['light', 'dark', 'system']);

export function leesThemeKeuze() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return VALID.has(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
}

export function systemPrefersDark() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/** Bereken effectieve theme ('light' of 'dark') op basis van keuze. */
export function effectieveTheme(keuze = leesThemeKeuze()) {
  if (keuze === 'dark') return 'dark';
  if (keuze === 'light') return 'light';
  return systemPrefersDark() ? 'dark' : 'light';
}

/** Pas effectieve theme toe op <html> class. Idempotent. */
export function pasThemeToe(keuze = leesThemeKeuze()) {
  const eff = effectieveTheme(keuze);
  const html = document.documentElement;
  if (eff === 'dark') html.classList.add('dark');
  else html.classList.remove('dark');
  // Sync color-scheme zodat native UI (scrollbars, form controls) ook past
  html.style.colorScheme = eff;
}

/** Bewaar + pas direct toe. */
export function zetThemeKeuze(keuze) {
  if (!VALID.has(keuze)) keuze = 'system';
  try { localStorage.setItem(STORAGE_KEY, keuze); } catch {}
  pasThemeToe(keuze);
  // Event voor andere tabs / componenten die luisteren
  try {
    window.dispatchEvent(new CustomEvent('sb-theme-changed', { detail: { keuze } }));
  } catch {}
}

/** Subscribe op system prefers-color-scheme wijzigingen (alleen bij 'system'). */
export function startThemeWatcher() {
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (leesThemeKeuze() === 'system') pasThemeToe('system');
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler); // Safari < 14
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else if (mq.removeListener) mq.removeListener(handler);
    };
  } catch {
    return () => {};
  }
}
