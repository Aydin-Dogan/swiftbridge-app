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

        {/* Deel knoppen */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={deelViaWhatsApp}
            className="flex flex-col items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-bold transition active:scale-95"
          >
            <span className="text-xl">💬</span>
            {t('referral_deel_whatsapp')}
          </button>
          <button
            onClick={deelViaEmail}
            className="flex flex-col items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold transition active:scale-95"
          >
            <span className="text-xl">📧</span>
            {t('referral_deel_email')}
          </button>
          <button
            onClick={() => kopieer(deelUrl, 'knop')}
            className="flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl py-3 text-xs font-bold transition active:scale-95"
          >
            <span className="text-xl">📋</span>
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
    </div>
  );
}
