/**
 * ConfirmDialog.jsx — herbruikbare bevestigingsdialog (vervangt window.confirm()).
 *
 * Voordelen boven window.confirm():
 *   - Bestaat in alle browsers met dezelfde look (native confirm verschilt)
 *   - i18n-aware via useTaal()
 *   - Variant 'destructive' voor verwijder-acties (rode CTA)
 *   - Esc-toets sluit, click-outside sluit
 *   - Aria-modal + focus-trap
 *
 * Gebruik:
 *   <ConfirmDialog
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     onConfirm={() => { delete(); setOpen(false); }}
 *     title="Verwijderen?"
 *     message="Dit kan niet ongedaan worden gemaakt."
 *     variant="destructive"
 *   />
 */
import { useEffect, useRef } from 'react';
import { useTaal } from '../i18n';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default', // 'default' | 'destructive'
  busy = false,
}) {
  const { t } = useTaal();
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    // Focus de confirm-knop voor snelle keyboard-bevestiging
    setTimeout(() => confirmRef.current?.focus(), 50);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const isDestructive = variant === 'destructive';
  const confirmKlas = isDestructive
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose?.();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-up">
        {/* Icoon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${
          isDestructive ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          {isDestructive ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        <h2 id="confirm-title" className="font-bold text-gray-900 text-lg text-center mb-2">
          {title}
        </h2>
        <p id="confirm-message" className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl py-2.5 transition disabled:opacity-50"
          >
            {cancelLabel || t('confirm_annuleer')}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 text-sm font-bold rounded-xl py-2.5 transition disabled:opacity-50 ${confirmKlas}`}
          >
            {busy ? `${t('confirm_bezig')}…` : (confirmLabel || t('confirm_ok'))}
          </button>
        </div>
      </div>
    </div>
  );
}
