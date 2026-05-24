/**
 * Hero.jsx — landing hero met live currency widget.
 * Sprint 2: matte-modern, soft-shadows, 1 brand-kleur, SVG icons,
 * echte fee-berekening via berekenKosten() (sync met tariefkaart).
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { VALUTAS } from '../../services/currencies';
import { berekenKosten } from '../../services/kosten';
import Vlag from '../Vlag';
import { API_URL } from '../../services/api';
import { ShieldCheck, Bank, Lock, ArrowRight } from '../icons/Icons';

// Trust signals — geen emoji's, SVG-iconen
function TrustRow({ t }) {
  const items = [
    { Icon: ShieldCheck, tekst: t('landing_trust_dnb') },
    { Icon: Bank,        tekst: t('landing_trust_ideal') },
    { Icon: Lock,        tekst: t('landing_trust_encrypted') },
  ];
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2.5 text-sm text-blue-100">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          <it.Icon className="w-4 h-4 text-blue-200" />
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
        // stil terugvallen op statische koers
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

  // Gebruik de échte berekenKosten() — bron-of-truth voor pricing (sync
  // met Tariefkaart op landing en checkout). Default methode iDEAL Express.
  const kosten = berekenKosten(bedragNum, 'ideal', 'express', huidigeKoers);
  const ontvangenFmt = (kosten.ontvangenBedrag || 0).toLocaleString(valutaInfo.locale, {
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
    <section className="relative overflow-hidden text-white bg-brand-hero">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-14 md:pt-20 md:pb-24">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Linker kolom — copy + CTA */}
          <div className="text-center md:text-left animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-semibold mb-5">
              <Vlag land="NL" size={16} />
              <span>{t('landing_pill_route')}</span>
              <Vlag land="TR" size={16} />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-5">
              {t('landing_hero_titel_1')}{' '}
              <span className="text-accent-400">{t('landing_hero_titel_2')}</span>
            </h1>

            <p className="text-blue-100/90 text-base sm:text-lg max-w-xl md:max-w-none mx-auto md:mx-0 mb-7 leading-relaxed">
              {t('landing_hero_subline')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
              {/* Primary CTA: rekenen zonder account (Sprint 4 conversie-fix) */}
              <button
                onClick={() => navigate(`/calculator?bedrag=${bedragNum}&valuta=${valuta}`)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-base font-semibold text-brand-800 bg-white hover:bg-blue-50 transition-colors duration-150 active:scale-[0.98] inline-flex items-center justify-center gap-2"
              >
                {t('landing_hero_cta_primary')}
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#hoe-werkt-het"
                className="w-full sm:w-auto text-center px-4 py-3 text-sm font-semibold text-white/90 hover:text-white underline-offset-4 hover:underline transition"
              >
                {t('landing_hero_cta_secondary')}
              </a>
            </div>

            <TrustRow t={t} />
          </div>

          {/* Rechter kolom — currency widget */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="bg-white text-gray-800 rounded-2xl p-5 sm:p-6 shadow-soft-xl">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('landing_widget_titel')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-success-700 bg-success-50 border border-success-100 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                  {t('landing_widget_live')}
                </span>
              </div>

              {/* Bedrag input */}
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {t('landing_widget_jij_verstuurt')}
              </label>
              <div className="flex items-center border border-gray-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 rounded-xl px-4 py-3 mb-4 transition">
                <span className="text-xl font-semibold text-gray-400 mr-2">€</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="10"
                  value={bedrag}
                  onChange={e => setBedragSafe(e.target.value)}
                  className="flex-1 text-2xl font-bold text-gray-900 outline-none bg-transparent"
                  aria-label={t('landing_widget_jij_verstuurt')}
                />
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium border border-gray-200 rounded-lg px-2 py-1">
                  <Vlag land="NL" size={14} /> EUR
                </span>
              </div>

              {/* Valuta selector — alleen TR + Turkse landen */}
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {t('landing_widget_ontvanger_in')}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-4">
                {valutaOpties.map(v => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => setValuta(v.code)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
                      valuta === v.code
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70'
                    }`}
                    title={v.naam}
                  >
                    <Vlag land={v.landCode} size={18} />
                    <span className="text-[10px] mt-0.5">{v.code}</span>
                  </button>
                ))}
              </div>

              <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3.5 mb-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {t('landing_widget_ontvanger_krijgt')}
                </span>
                {liveKoersen === null ? (
                  // Skeleton tijdens koers-fetch (eerste 0,5-2 sec)
                  <span className="h-7 w-32 rounded-md animate-shimmer" aria-label="Bezig met laden..." />
                ) : (
                  <span className="text-2xl font-bold text-brand-700">
                    {valutaInfo.symbool}
                    {ontvangenFmt}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-4">
                <span>
                  {t('landing_widget_koers')}: 1 € ={' '}
                  {liveKoersen === null ? (
                    <span className="inline-block h-3 w-16 rounded animate-shimmer align-middle" aria-label="Koers laden" />
                  ) : (
                    <>
                      {Number(huidigeKoers).toLocaleString('nl-NL', {
                        maximumFractionDigits: valutaInfo.decimals === 0 ? 2 : 4,
                      })}{' '}
                      {valutaInfo.code}
                    </>
                  )}
                </span>
                <span className="text-success-700 font-semibold">
                  {kosten.zichtbarePct ? `${String(kosten.zichtbarePct).replace('.', ',')}%` : t('landing_widget_fee')}
                </span>
              </div>

              <button
                onClick={() => navigate(`/calculator?bedrag=${bedragNum}&valuta=${valuta}`)}
                className="btn-primary w-full py-3.5 text-sm"
              >
                {t('landing_hero_cta_primary')}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
              <p className="text-[11px] text-gray-500 text-center mt-3">
                {t('landing_widget_no_account_needed')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
