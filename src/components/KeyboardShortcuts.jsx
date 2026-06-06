/**
 * KeyboardShortcuts.jsx — globale keyboard shortcuts (Verbetering TTT).
 *
 * Listent op document keydown en biedt:
 * - Ctrl/Cmd+K → open Calculator
 * - Ctrl/Cmd+N → naar Overmaken-tab (nieuwe transactie)
 * - / → focus eerste search-input op pagina
 * - ? → toon Help-overlay met alle shortcuts
 *
 * Negeert keys tijdens typing in input/textarea (anders raakt user gefrustreerd).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../i18n';

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export default function KeyboardShortcuts() {
  const { t } = useTaal();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      // Cmd+K / Ctrl+K → Calculator
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/calculator');
        return;
      }
      // Cmd+N / Ctrl+N → naar Overmaken (alleen als in /app)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        if (window.location.pathname.startsWith('/app')) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }));
        }
        return;
      }
      // Single-key shortcuts: alleen als user NIET aan het typen is
      if (isTypingTarget(e.target)) return;

      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
      if (e.key === '/') {
        // Zoek eerste search-input op de pagina en focus
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
      if (e.key === 'Escape') {
        setHelpOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  if (!helpOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: [mod, 'K'], label: t('kbd_open_calculator') },
    { keys: [mod, 'N'], label: t('kbd_nieuwe_transactie') },
    { keys: ['/'], label: t('kbd_focus_zoek') },
    { keys: ['?'], label: t('kbd_help') },
    { keys: ['Esc'], label: t('kbd_sluit') },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbd-help-title"
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setHelpOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="kbd-help-title" className="font-bold text-gray-900 text-lg">
            ⌨ {t('kbd_titel')}
          </h2>
          <button
            onClick={() => setHelpOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label={t('kbd_sluit')}
          >
            ✕
          </button>
        </div>

        <ul className="space-y-2">
          {shortcuts.map((s, i) => (
            <li key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{s.label}</span>
              <span className="flex gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="px-2 py-0.5 text-xs font-mono font-bold bg-white border border-gray-300 rounded shadow-sm text-gray-700"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-gray-400 mt-4 text-center">
          {t('kbd_hint')}
        </p>
      </div>
    </div>
  );
}
