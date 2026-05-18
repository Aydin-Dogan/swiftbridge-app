/**
 * Hero.jsx — Premium landing hero with live currency widget.
 * Mobile-first, glassmorphism, gradient.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { VALUTAS } from '../../services/currencies';
import Vlag from '../Vlag';
import { API_URL } from '../../services/api';

// Trust badges shown directly under the hero CTA
function TrustBadges({ t }) {
  const items = [
    { icoon: '🛡️', tekst: t('landing_trust_dnb') },
    { icoon: '🏦', tekst: t('landing_trust_ideal') },
    { icoon: '🔐', tekst: t('landing_trust_encrypted') },
    { icoon: '⭐', tekst: t('landing_trust_reviews') },
  ];
  return (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-blue-100/90 font-medium">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true">{it.icoon}</span>
          <span>{it.tekst}</span>
        </span>
      ))}
    </div>
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const { t } = useTaal();

  const [bedrag, setBedrag] = useState(500);
  const [valuta, setValuta] = useState('TRY');
  const [liveKoersen, setLiveKoersen] = useState(null);

  // Probeer live koersen op te halen — anders gebruik fallback uit currencies.js
  useEffect(() => {
    let geannuleerd = false;
    async function haal() {
      try {
        const res = await fetch(`${API_URL}/transactions/koersen`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!geannuleerd && data?.koersen) setLiveKoersen(data.koersen);
      } catch {
        // stilletjes terugvallen op statische koers
      }
    }
    haal();
    return () => {
      geannuleerd = true;
    };
  }, []);

  const valutaInfo = VALUTAS.find(v => v.code === valuta) ?? VALUTAS[0];
  const huidigeKoers = liveKoersen?.[valuta] ?? valutaInfo.koers;
  const bedragNum = Math.max(0, Number(bedrag) || 0);
  // 2,0% transactiefee + 0,45% wisselkoersmarge ≈ 0,9775 multiplier
  const ontvangen = bedragNum * huidigeKoers * 0.9775;
  const ontvangenFmt = ontvangen.toLocaleString(valutaInfo.locale, {
    minimumFractionDigits: valutaInfo.decimals,
    maximumFractionDigits: valutaInfo.decimals,
  });

  function setBedragSafe(val) {
    if (val === '' || val === '-') return setBedrag('');
    const n = parseFloat(val);
    if (isNaN(n)) return;
    setBedrag(Math.max(0, n));
  }

  // Toon alleen Turkse + Turkstalige landen in de quick selector
  const valutaOpties = VALUTAS.filter(
    v => v.groep === 'turkije' || v.groep === 'turks',
  );

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 0%, #1e3a8a 0%, #1d4ed8 35%, #2563eb 70%, #1e40af 100%)',
      }}
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(250,204,21,0.12) 0, transparent 40%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Linker kolom — copy + CTA */}
          <div className="text-center md:text-left animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur rounded-full px-3 py-1.5 text-xs font-semibold mb-5">
              <Vlag land="NL" size={16} />
              <span>{t('landing_pill_route')}</span>
              <Vlag land="TR" size={16} />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-5">
              {t('landing_hero_titel_1')}{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-amber-200 bg-clip-text text-transparent">
                {t('landing_hero_titel_2')}
              </span>
            </h1>

            <p className="text-blue-100/95 text-base sm:text-lg max-w-xl md:max-w-none mx-auto mb-7 leading-relaxed">
              {t('landing_hero_subline')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => navigate('/login?tab=register')}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl text-base font-extrabold text-white transition-all duration-200 active:scale-[0.98] shadow-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, #10b981 0%, #059669 60%, #0ea5e9 100%)',
                  boxShadow: '0 10px 30px -8px rgba(16,185,129,0.55)',
                }}
              >
                {t('landing_hero_cta_primary')} →
              </button>
              <a
                href="#hoe-werkt-het"
                className="w-full sm:w-auto text-center px-6 py-4 rounded-2xl text-sm font-bold text-white/95 border border-white/25 hover:bg-white/10 transition"
              >
                {t('landing_hero_cta_secondary')}
              </a>
            </div>

            <TrustBadges t={t} />
          </div>

          {/* Rechter kolom — currency widget */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div
              className="relative rounded-3xl p-1"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 60%, rgba(16,185,129,0.4) 100%)',
              }}
            >
              <div className="bg-white text-gray-800 rounded-[1.4rem] p-5 sm:p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t('landing_widget_titel')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t('landing_widget_live')}
                  </span>
                </div>

                {/* Bedrag input */}
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  {t('landing_widget_jij_verstuurt')}
                </label>
                <div className="flex items-center border-2 border-blue-500/80 focus-within:border-blue-600 rounded-2xl px-4 py-3 mb-4 transition">
                  <span className="text-xl font-bold text-gray-400 mr-2">€</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="10"
                    value={bedrag}
                    onChange={e => setBedragSafe(e.target.value)}
                    className="flex-1 text-2xl font-bold text-gray-800 outline-none bg-transparent"
                    aria-label={t('landing_widget_jij_verstuurt')}
                  />
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 font-semibold border border-gray-200 rounded-lg px-2 py-1">
                    <Vlag land="NL" size={14} /> EUR
                  </span>
                </div>

                {/* Valuta selector — alleen TR + Turkse landen */}
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  {t('landing_widget_ontvanger_in')}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-4">
                  {valutaOpties.map(v => (
                    <button
                      key={v.code}
                      type="button"
                      onClick={() => setValuta(v.code)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        valuta === v.code
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                      }`}
                      title={v.naam}
                    >
                      <Vlag land={v.landCode} size={18} />
                      <span className="text-[10px] mt-0.5">{v.code}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-emerald-50/70 border border-blue-100 rounded-2xl px-4 py-3.5 mb-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">
                    {t('landing_widget_ontvanger_krijgt')}
                  </span>
                  <span className="text-2xl font-extrabold text-blue-700">
                    {valutaInfo.symbool}
                    {ontvangenFmt}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-4">
                  <span>
                    {t('landing_widget_koers')}: 1 € ={' '}
                    {Number(huidigeKoers).toLocaleString('nl-NL', {
                      maximumFractionDigits: valutaInfo.decimals === 0 ? 2 : 4,
                    })}{' '}
                    {valutaInfo.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    {t('landing_widget_fee')}
                  </span>
                </div>

                <button
                  onClick={() => navigate('/login?tab=register')}
                  className="btn-primary w-full py-3.5 text-sm"
                >
                  {t('landing_hero_cta_primary')} →
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-3">
                  {t('landing_widget_no_account_needed')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schuine onderrand voor visuele overgang */}
      <svg
        className="block w-full -mb-px"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ height: 60 }}
      >
        <path
          d="M0,60 L0,30 Q720,0 1440,30 L1440,60 Z"
          fill="#ffffff"
        />
      </svg>
    </section>
  );
}
