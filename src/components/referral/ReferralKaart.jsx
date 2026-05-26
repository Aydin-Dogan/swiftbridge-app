/**
 * ReferralKaart.jsx — toont de eigen referral code, deel-knoppen en statistieken.
 *
 * UX:
 *   - Code + URL klikbaar om te kopiëren (toont "Gekopieerd!" feedback)
 *   - Drie deel-knoppen: WhatsApp, E-mail, Kopieer
 *   - Tellertje "X vrienden uitgenodigd, €Y verdiend"
 *   - Uitleg-blok onder de hoofdkaart
 *
 * Werkt op /referral/mijn — laadt zelf wanneer gemount.
 */
import { useState, useEffect } from 'react';
import { useTaal } from '../../i18n';
import { apiFetch, parseError } from '../../services/api';
import ReferralLeaderboard from './ReferralLeaderboard';

// SVG iconen — vervangen emoji's voor consistentie met matte-modern stijl
const IconWhatsApp = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.4 0 .03 5.37.03 11.97c0 2.11.55 4.18 1.6 6L0 24l6.2-1.62a11.94 11.94 0 0 0 5.79 1.47h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.45-8.4zM12 21.83h-.01a9.93 9.93 0 0 1-5.07-1.39l-.36-.21-3.68.96.98-3.58-.24-.37a9.93 9.93 0 0 1-1.52-5.29c0-5.49 4.47-9.97 9.97-9.97 2.66 0 5.16 1.04 7.04 2.93a9.9 9.9 0 0 1 2.92 7.04c0 5.49-4.47 9.97-9.97 9.97zm5.47-7.46c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9.07 9.07 0 0 1-1.67-2.08c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.06 2.88 1.21 3.08.15.2 2.1 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
  </svg>
);
const IconMail = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconShare = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export default function ReferralKaart() {
  const { t } = useTaal();
  const [data, setData] = useState(null);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [gekopieerd, setGekopieerd] = useState(null);

  async function laad() {
    setLaden(true);
    setFout('');
    try {
      const d = await apiFetch('/referral/mijn');
      setData(d);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }

  useEffect(() => { laad(); }, []);

  async function kopieer(tekst, label) {
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(label);
      setTimeout(() => setGekopieerd(null), 1500);
    } catch {
      // Fallback voor oudere browsers
      const ta = document.createElement('textarea');
      ta.value = tekst;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
      setGekopieerd(label);
      setTimeout(() => setGekopieerd(null), 1500);
    }
  }

  function deelViaWhatsApp() {
    if (!data) return;
    const bericht = t('referral_share_whatsapp', { url: data.deelUrl, bedrag: data.beloningPerVriendEur });
    const url = `https://wa.me/?text=${encodeURIComponent(bericht)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function deelViaEmail() {
    if (!data) return;
    const onderwerp = t('referral_share_email_onderwerp');
    const tekst = t('referral_share_email_tekst', { url: data.deelUrl, bedrag: data.beloningPerVriendEur });
    const mailto = `mailto:?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst)}`;
    window.location.href = mailto;
  }

  // Native share — opent mobiel platform-sheet (Twitter, Telegram, Messenger,
  // Signal, etc.) wanneer beschikbaar. Fallback naar clipboard.
  async function deelNative() {
    if (!data) return;
    const url = data.deelUrl;
    const tekst = t('referral_share_whatsapp', { url, bedrag: data.beloningPerVriendEur });
    if (navigator.share) {
      try {
        await navigator.share({ title: t('referral_share_email_onderwerp'), text: tekst, url });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    kopieer(url, 'knop');
  }

  if (laden) {
    return (
      <div className="card-glass p-5 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
        <div className="h-12 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (fout && !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-2">
        <div className="text-3xl">⚠️</div>
        <p className="text-sm text-rose-700">{fout}</p>
        <button onClick={laad} className="text-sm text-rose-700 underline">
          {t('vernieuwen')}
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { referralCode, deelUrl, beloningPerVriendEur, statistieken } = data;

  return (
    <div className="space-y-4">
      <div className="card-glass p-5 border-l-4 border-emerald-500 animate-fade-up">
        {/* Prominente earnings-badge bovenaan (Verbetering Y) */}
        <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-3 py-1 text-xs font-bold text-emerald-800 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          {t('referral_badge_verdien', { bedrag: beloningPerVriendEur })}
        </div>

        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
          {t('referral_titel')}
        </h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
          {t('referral_intro', { bedrag: beloningPerVriendEur })}
        </p>

        {/* Code blok */}
        <div className="mt-4">
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {t('referral_jouw_code')}
          </label>
          <button
            onClick={() => kopieer(referralCode, 'code')}
            className="w-full flex items-center justify-between gap-2 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl px-4 py-3 hover:border-emerald-400 transition active:scale-[0.98]"
            aria-label={t('referral_kopieer_code')}
          >
            <span className="font-mono text-xl font-bold text-emerald-700 tracking-[0.2em]">
              {referralCode}
            </span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              {gekopieerd === 'code' ? `✅ ${t('referral_gekopieerd')}` : `📋 ${t('referral_kopieer')}`}
            </span>
          </button>
        </div>

        {/* Deel URL */}
        <div className="mt-3">
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {t('referral_deel_link')}
          </label>
          <button
            onClick={() => kopieer(deelUrl, 'url')}
            className="w-full flex items-center justify-between gap-2 bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 hover:border-blue-400 transition active:scale-[0.98]"
            aria-label={t('referral_kopieer_link')}
          >
            <span className="text-xs text-gray-700 font-mono truncate flex-1 text-left">
              {deelUrl}
            </span>
            <span className="text-xs text-blue-600 font-semibold whitespace-nowrap">
              {gekopieerd === 'url' ? `✅ ${t('referral_gekopieerd')}` : `📋 ${t('referral_kopieer')}`}
            </span>
          </button>
        </div>

        {/* Deel knoppen — SVG iconen voor consistente matte-modern stijl */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <button
            onClick={deelViaWhatsApp}
            className="flex flex-col items-center justify-center gap-1 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-xl py-3 text-xs font-bold transition active:scale-95"
            aria-label={t('referral_deel_whatsapp')}
          >
            <IconWhatsApp />
            {t('referral_deel_whatsapp')}
          </button>
          <button
            onClick={deelViaEmail}
            className="flex flex-col items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold transition active:scale-95"
            aria-label={t('referral_deel_email')}
          >
            <IconMail />
            {t('referral_deel_email')}
          </button>
          <button
            onClick={deelNative}
            className="flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-gray-800 text-white rounded-xl py-3 text-xs font-bold transition active:scale-95"
            aria-label={t('referral_deel_meer')}
          >
            <IconShare />
            {t('referral_deel_meer')}
          </button>
          <button
            onClick={() => kopieer(deelUrl, 'knop')}
            className="flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl py-3 text-xs font-bold transition active:scale-95"
            aria-label={t('referral_deel_kopieer')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {gekopieerd === 'knop' ? t('referral_gekopieerd') : t('referral_deel_kopieer')}
          </button>
        </div>

        {/* Statistieken */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {statistieken.aantalUitnodigingen}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              {t('referral_stats_vrienden')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              €{statistieken.creditEur.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              {t('referral_stats_verdiend')}
            </div>
          </div>
        </div>
      </div>

      {/* Uitleg "Hoe het werkt" */}
      <div className="card-glass p-4 bg-gradient-to-br from-blue-50 to-emerald-50 animate-fade-up">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          {t('referral_hoe_titel')}
        </h4>
        <ol className="text-xs text-gray-700 mt-2 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>{t('referral_hoe_stap1')}</li>
          <li>{t('referral_hoe_stap2')}</li>
          <li>{t('referral_hoe_stap3', { bedrag: beloningPerVriendEur })}</li>
        </ol>
      </div>

      {/* Leaderboard (Verbetering JJJ) — verbergt zichzelf als niemand
          nog iemand heeft uitgenodigd. */}
      <ReferralLeaderboard />
    </div>
  );
}
