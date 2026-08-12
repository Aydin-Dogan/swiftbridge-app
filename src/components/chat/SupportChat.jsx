/**
 * SupportChat — in-app support chat widget.
 *
 * - Floating button rechts onderaan (cirkel 56px met gradient)
 * - Klik opent een modal panel: header + message list + input
 * - QuickActions met mock antwoorden voor snelle feedback
 * - Vrij getypte berichten: POST naar /support/bericht (endpoint stub)
 * - Persistentie: localStorage 'sb_chat_history'
 * - Toegankelijk: role="dialog", Esc sluit, focus trap, aria-live op nieuwe msgs
 * - Responsive: full screen overlay <640px, 380px float >=640px
 *
 * Props:
 *  - gebruiker: optioneel — als ingelogd dan naam meesturen
 *  - actief: boolean — true = mag worden weergegeven; false = verberg
 *           (bv. tijdens KYC camera scan)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTaal } from '../../i18n';
import { apiFetch } from '../../services/api';
import ChatBubble from './ChatBubble';
import QuickActions from './QuickActions';

const STORAGE_KEY = 'sb_chat_history';
const GESPREK_KEY = 'sb_chat_gesprek_id';
const MAX_HISTORY = 100;

// AI-LEER-1: stabiel gesprek-id zodat de backend berichten van een gesprek
// kan groeperen in de leer-lus.
function gesprekId() {
  try {
    let id = localStorage.getItem(GESPREK_KEY);
    if (!id) {
      id = `g_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GESPREK_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function laadGeschiedenis() {
  try {
    const ruw = localStorage.getItem(STORAGE_KEY);
    if (!ruw) return [];
    const parsed = JSON.parse(ruw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

function bewaarGeschiedenis(berichten) {
  try {
    const trimmed = berichten.slice(-MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota of disabled — negeren */
  }
}

function nieuwId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Hoofd component ─────────────────────────────────────────────────────────
export default function SupportChat({ gebruiker, actief = true }) {
  const { t } = useTaal();
  const [open, setOpen] = useState(false);
  const [berichten, setBerichten] = useState(() => laadGeschiedenis());
  const [invoer, setInvoer] = useState('');
  const [verzendt, setVerzendt] = useState(false);
  const [ongelezen, setOngelezen] = useState(0);

  const messageListRef = useRef(null);
  const textareaRef = useRef(null);
  const knopRef = useRef(null);
  const panelRef = useRef(null);

  // ── Persistentie ──────────────────────────────────────────────────────────
  useEffect(() => {
    bewaarGeschiedenis(berichten);
  }, [berichten]);

  // ── Auto scroll naar laatste bericht ──────────────────────────────────────
  useEffect(() => {
    if (open && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [berichten, open]);

  // ── Mobiel: paneel volgt het zichtbare scherm bij open toetsenbord ────────
  // (iOS/Android schoven de kop met sluitknop en de verstuurknop buiten beeld
  //  zodra het toetsenbord opende — bevinding Aydin.)
  useEffect(() => {
    if (!open) return;
    const mobiel = window.matchMedia('(max-width: 640px)').matches;
    if (!mobiel) return;
    document.documentElement.style.overflow = 'hidden';
    const pasAan = () => {
      if (panelRef.current && window.visualViewport) {
        panelRef.current.style.height = `${window.visualViewport.height}px`;
      }
      if (messageListRef.current) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }
    };
    pasAan();
    window.visualViewport?.addEventListener('resize', pasAan);
    return () => {
      document.documentElement.style.overflow = '';
      window.visualViewport?.removeEventListener('resize', pasAan);
    };
  }, [open]);

  // ── Esc sluit modal + focus trap ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        sluit();
        return;
      }
      // Focus trap: Tab cycelt binnen panel
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'button, textarea, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    // Auto focus de textarea als panel opent
    setTimeout(() => textareaRef.current?.focus(), 50);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Open / sluit handlers ─────────────────────────────────────────────────
  function openModal() {
    setOpen(true);
    setOngelezen(0);
  }

  const sluit = useCallback(() => {
    setOpen(false);
    setOngelezen(0);
    // Focus terug naar trigger
    setTimeout(() => knopRef.current?.focus(), 50);
  }, []);

  // ── Bericht toevoegen ─────────────────────────────────────────────────────
  function voegToe(bericht) {
    setBerichten((b) => {
      // Eerste support bericht in een rij krijgt avatar
      const laatste = b[b.length - 1];
      const toonAvatar =
        bericht.rol === 'support' && (!laatste || laatste.rol !== 'support');
      return [...b, { ...bericht, toonAvatar }];
    });
  }

  // ── Quick action handler ──────────────────────────────────────────────────
  function handleQuick(actie) {
    const nu = new Date().toISOString();
    voegToe({
      id: nieuwId(),
      rol: 'user',
      tekst: actie.vraag,
      timestamp: nu,
    });
    // Simuleer korte "typt..." vertraging
    setTimeout(() => {
      voegToe({
        id: nieuwId(),
        rol: 'support',
        tekst: actie.antwoord,
        timestamp: new Date().toISOString(),
      });
    }, 500);
  }

  // ── Gespreksgeschiedenis voor de AI (alleen user/support, recentste 12) ───
  function bouwGeschiedenis(extraUserTekst) {
    const relevant = berichten
      .filter((b) => b.rol === 'user' || b.rol === 'support')
      .map((b) => ({ rol: b.rol === 'user' ? 'user' : 'assistent', tekst: b.tekst }));
    if (extraUserTekst) relevant.push({ rol: 'user', tekst: extraUserTekst });
    return relevant.slice(-12);
  }

  // ── Vrij bericht verzenden → AI-assistent (second brain) ─────────────────
  async function verzendBericht(e) {
    e?.preventDefault();
    const tekst = invoer.trim();
    if (!tekst || verzendt) return;

    const nu = new Date().toISOString();
    voegToe({
      id: nieuwId(),
      rol: 'user',
      tekst,
      timestamp: nu,
    });
    setInvoer('');
    setVerzendt(true);

    try {
      const data = await apiFetch('/support/chat', {
        method: 'POST',
        body: { berichten: bouwGeschiedenis(tekst), gesprekId: gesprekId() },
      });
      voegToe({
        id: nieuwId(),
        rol: 'support',
        // mock=true: AI niet beschikbaar — toon de melding in de taal van de
        // gebruiker (de server-fallback is Nederlands).
        tekst: data?.mock ? t('support_offline_fallback')
          : (data?.antwoord || t('support_offline_fallback')),
        logId: data?.logId || null,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      voegToe({
        id: nieuwId(),
        rol: 'support',
        tekst: t('support_offline_fallback'),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setVerzendt(false);
      textareaRef.current?.focus();
    }
  }

  // ── Escalatie: gesprek doorsturen naar een menselijke medewerker ─────────
  async function escaleerNaarMedewerker() {
    if (verzendt) return;
    setVerzendt(true);
    try {
      await apiFetch('/support/escalatie', {
        method: 'POST',
        body: {
          berichten: bouwGeschiedenis(),
          gebruikerNaam: gebruiker?.naam || null,
          gebruikerEmail: gebruiker?.email || null,
        },
      });
      voegToe({
        id: nieuwId(),
        rol: 'system',
        tekst: t('support_escalatie_ok'),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      voegToe({
        id: nieuwId(),
        rol: 'support',
        tekst: t('support_offline_fallback'),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setVerzendt(false);
    }
  }

  // ── AI-LEER-1: feedback op een AI-antwoord (duim omhoog/omlaag) ──────────
  async function stuurFeedback(bericht, keuze) {
    // Optimistisch markeren — feedback is best-effort en mag nooit storen.
    setBerichten((b) => b.map((m) => (m.id === bericht.id ? { ...m, feedback: keuze } : m)));
    try {
      await apiFetch('/support/feedback', {
        method: 'POST',
        body: { logId: bericht.logId, feedback: keuze },
      });
    } catch { /* stil — geen foutmelding voor een feedbackklikje */ }
  }

  // ── Toetsenbord in textarea: Enter verzendt, Shift+Enter newline ──────────
  function onTextareaKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      verzendBericht();
    }
  }

  // ── Textarea autosize ─────────────────────────────────────────────────────
  function onTextareaInput(e) {
    setInvoer(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  if (!actief) return null;

  const heeftBerichten = berichten.length > 0;

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────── */}
      {!open && (
        <button
          ref={knopRef}
          type="button"
          onClick={openModal}
          aria-label={t('support_open_chat')}
          className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[60] w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-blue-300"
          style={{
            background: 'linear-gradient(135deg, #1B3252 0%, #1A7F5E 100%)',
            boxShadow: '0 6px 20px -4px rgba(59,130,246,0.5)',
          }}
        >
          <ChatIcon className="w-6 h-6" />
          {ongelezen > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center border-2 border-white"
              aria-label={t('support_ongelezen', { aantal: ongelezen })}
            >
              {ongelezen > 9 ? '9+' : ongelezen}
            </span>
          )}
        </button>
      )}

      {/* ── Modal panel ─────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[60] sm:w-[380px] sm:max-h-[calc(100vh-3rem)] sm:h-[520px] flex flex-col bg-white sm:rounded-2xl shadow-2xl border-0 sm:border sm:border-gray-200 overflow-hidden animate-fade-up"
          role="dialog"
          aria-modal="true"
          aria-label={t('support_dialog_label')}
          ref={panelRef}
        >
          {/* Header */}
          <div
            className="px-4 py-3 text-white flex items-center gap-3 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #22416B 0%, #1B3252 60%, #142641 100%)',
            }}
          >
            <div
              className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-sm"
              aria-hidden="true"
            >
              SB
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight truncate">
                {t('support_titel')}
              </p>
              <p className="text-[11px] text-blue-100 flex items-center gap-1.5 leading-tight mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                {t('support_online_status')}
              </p>
            </div>
            <button
              type="button"
              onClick={sluit}
              aria-label={t('support_sluit')}
              className="text-white/80 hover:text-white hover:bg-white/15 rounded-full w-8 h-8 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message list */}
          <div
            ref={messageListRef}
            className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3"
            aria-live="polite"
            aria-relevant="additions"
          >
            {!heeftBerichten && (
              <div className="mb-3">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md p-3 mb-2 shadow-sm flex items-start gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #1B3252 0%, #1A7F5E 100%)' }}
                    aria-hidden="true"
                  >
                    SB
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">
                    {gebruiker?.naam
                      ? t('support_welkom_met_naam', { naam: gebruiker.naam })
                      : t('support_welkom')}
                  </p>
                </div>
                <QuickActions onKies={handleQuick} t={t} />
              </div>
            )}

            {berichten.map((b) => (
              <div key={b.id}>
                <ChatBubble bericht={b} />
                {b.rol === 'support' && b.logId && (
                  b.feedback ? (
                    <p className="text-[10px] text-gray-400 ml-10 -mt-1 mb-2">{t('chat_feedback_dank')}</p>
                  ) : (
                    <div className="flex gap-2 ml-10 -mt-1 mb-2">
                      <button type="button" onClick={() => stuurFeedback(b, 'goed')}
                        className="text-[10px] text-gray-400 hover:text-brand-600 border border-gray-200 hover:border-brand-300 rounded-full px-2 py-0.5 transition">
                        {t('chat_feedback_nuttig')}
                      </button>
                      <button type="button" onClick={() => stuurFeedback(b, 'slecht')}
                        className="text-[10px] text-gray-400 hover:text-brand-600 border border-gray-200 hover:border-brand-300 rounded-full px-2 py-0.5 transition">
                        {t('chat_feedback_niet_nuttig')}
                      </button>
                    </div>
                  )
                )}
              </div>
            ))}

            {verzendt && (
              <div className="flex items-center gap-1 ml-2 mt-1" aria-label={t('support_aan_het_typen')}>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={verzendBericht}
            className="flex-shrink-0 border-t border-gray-200 bg-white px-3 py-2.5"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={invoer}
                onChange={onTextareaInput}
                onKeyDown={onTextareaKey}
                placeholder={t('support_invoer_placeholder')}
                rows={1}
                aria-label={t('support_invoer_label')}
                disabled={verzendt}
                className="flex-1 resize-none bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-300 border border-transparent focus:border-blue-300 rounded-xl px-3 py-2 text-base sm:text-sm text-gray-800 placeholder-gray-400 outline-none transition max-h-[120px] disabled:opacity-50"
                style={{ minHeight: '40px' }}
              />
              <button
                type="submit"
                disabled={!invoer.trim() || verzendt}
                aria-label={t('support_verstuur')}
                className="w-10 h-10 flex-shrink-0 rounded-full text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{
                  background: 'linear-gradient(135deg, #22416B 0%, #1B3252 100%)',
                  boxShadow: '0 2px 8px -2px rgba(59,130,246,0.5)',
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-7 14-2-5-5-2z" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              <button
                type="button"
                onClick={escaleerNaarMedewerker}
                disabled={verzendt}
                className="text-brand-500 hover:underline font-medium disabled:opacity-50"
              >
                {t('support_medewerker_knop')}
              </button>
              {' · '}
              {t('support_footer_mail')}{' '}
              <a
                href="mailto:support@swiftbridge.nl"
                className="text-brand-500 hover:underline"
              >
                support@swiftbridge.nl
              </a>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

// ── Inline chat icoon SVG ───────────────────────────────────────────────────
function ChatIcon({ className = '' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
