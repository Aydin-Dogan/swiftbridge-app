/**
 * Stap4Klaar.jsx — Slotscherm met 3 quick tips + CTA naar overboeking
 *
 * - 3 tip cards (PWA install, notificaties, deel je code)
 * - PWA install tip toont alleen op Android Chrome (beforeinstallprompt support)
 * - CTA stuurt event 'swiftbridge_navigate' → 'betaling' tab
 */
import { useEffect, useState } from 'react';
import { useTaal } from '../../i18n';
import { Download, Bell, Users, Rocket } from '../icons/Icons';

export default function Stap4Klaar({ onNaarOverboeking }) {
  const { t } = useTaal();
  const [pwaPrompt, setPwaPrompt] = useState(null);

  // Vang beforeinstallprompt event op — Android/Chrome
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function installeerPWA() {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    try { await pwaPrompt.userChoice; } catch {}
    setPwaPrompt(null);
  }

  const tips = [
    {
      Icoon: Download,
      titel: t('onb_klaar_tip_pwa_titel'),
      tekst: t('onb_klaar_tip_pwa_tekst'),
      actie: pwaPrompt ? installeerPWA : null,
      actie_label: pwaPrompt ? t('onb_klaar_tip_pwa_knop') : null,
    },
    {
      Icoon: Bell,
      titel: t('onb_klaar_tip_notif_titel'),
      tekst: t('onb_klaar_tip_notif_tekst'),
    },
    {
      Icoon: Users,
      titel: t('onb_klaar_tip_deel_titel'),
      tekst: t('onb_klaar_tip_deel_tekst'),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mb-2 flex justify-center" aria-hidden="true">
          <Rocket className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
          {t('onb_klaar_titel')}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          {t('onb_klaar_subtitel')}
        </p>
      </div>

      {/* 3 tip cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col text-center shadow-sm"
          >
            <div className="mb-2 flex justify-center" aria-hidden="true">
              <tip.Icoon className="w-7 h-7 text-blue-600" />
            </div>
            <p className="font-bold text-slate-800 text-xs leading-snug mb-1">{tip.titel}</p>
            <p className="text-[11px] text-slate-500 leading-snug flex-1">{tip.tekst}</p>
            {tip.actie && (
              <button
                onClick={tip.actie}
                className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
              >
                {tip.actie_label} →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onNaarOverboeking}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-600/30 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {t('onb_klaar_cta')} →
      </button>
    </div>
  );
}
