import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LiveKoersTicker from '../components/LiveKoersTicker';
import TaalKiezer from '../components/TaalKiezer';
import { VALUTAS } from '../services/currencies';
import { useTaal } from '../i18n';
import Vlag from '../components/Vlag';
import TrBankenSteun from '../components/TrBankenSteun';
import TurkstaligeBankenSteun from '../components/TurkstaligeBankenSteun';

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  return prompt;
}

const stats = [
  { getal: '<5 min', label: 'Gemiddelde aankomsttijd' },
  { getal: '2,0–2,5%', label: 'Totale kosten' },
  { getal: '24/7', label: 'Altijd beschikbaar' },
  { getal: '469K+', label: 'Turken in Nederland' },
];

const stappen = [
  { icoon: '📱', titel: 'Download de app', tekst: 'Registreer in 2 minuten met je e-mailadres.' },
  { icoon: '🪪', titel: 'Verifieer je identiteit', tekst: 'KYC met paspoort of Turks kimlik — binnen 5 minuten goedgekeurd.' },
  { icoon: '💸', titel: 'Maak geld over', tekst: 'Voer het bedrag in, bevestig met iDEAL — klaar.' },
  { icoon: '⚡', titel: 'Ontvanger krijgt TRY', tekst: 'Geld op rekening in Turkije binnen 5 minuten.' },
];

const vergelijking = [
  { naam: 'Traditionele bank',     snelheid: '3–5 dagen',    kosten: '3–5%',    kleur: 'text-red-500' },
  { naam: 'Andere money apps',     snelheid: 'Uren – 2 dgn', kosten: '1,5–3%',  kleur: 'text-orange-500' },
  { naam: 'Wisselkantoren',        snelheid: 'Direct cash',  kosten: '4–7%',    kleur: 'text-orange-500' },
  { naam: 'SwiftBridge',           snelheid: '< 5 minuten ⚡', kosten: '€1,99 + 1,2%', kleur: 'text-green-600', highlight: true },
];


function isIOS() {
  return typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isInStandalone() {
  return typeof window !== 'undefined' && window.navigator.standalone === true;
}

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTaal();
  const [bedrag, setBedrag] = useState(500);
  const [valuta, setValuta] = useState('TRY');
  const installPrompt = useInstallPrompt();
  const [toonIOSUitleg, setToonIOSUitleg] = useState(false);

  const valutaInfo = VALUTAS.find(v => v.code === valuta) ?? VALUTAS[0];
  const bedragNum = Math.max(0, Number(bedrag) || 0);
  const ontvangen = bedragNum * valutaInfo.koers * 0.9775;
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

  async function installeerApp() {
    if (isIOS() && !isInStandalone()) {
      setToonIOSUitleg(true);
      return;
    }
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigatiebalk */}
      <nav className="header-glass-light sticky top-0 z-50 safe-top">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">SwiftBridge</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#hoe-werkt-het" className="hover:text-blue-600 transition">Hoe werkt het?</a>
            <a href="#kosten" className="hover:text-blue-600 transition">Kosten</a>
            <a href="#vergelijking" className="hover:text-blue-600 transition">Vergelijking</a>
          </div>
          <div className="flex items-center gap-1.5">
            <TaalKiezer />
            <button onClick={() => navigate('/login')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 transition">
              Inloggen
            </button>
            <button onClick={() => navigate('/login?tab=register')} className="btn-primary text-sm">
              Gratis starten →
            </button>
          </div>
        </div>
      </nav>

      {/* Live multi-landen koers ticker */}
      <LiveKoersTicker />

      {/* Hero sectie */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500 bg-opacity-50 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Vlag land="NL" size={20} /> Nederland → Turkije <Vlag land="TR" size={20} />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            {t('landing_titel')}<br />
            <span className="text-yellow-300">{t('landing_ondertitel')}<sup className="text-base">*</sup></span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-xl mx-auto">
            {t('landing_uitleg')}
          </p>
          <p className="text-blue-200 text-xs mb-6 max-w-md mx-auto">
            <sup>*</sup> Vanaf je tweede transactie na goedgekeurde KYC. Eerste registratie + identiteitsverificatie duurt 5–15 minuten.
          </p>

          {/* Rekentool */}
          <div className="bg-white text-gray-800 rounded-2xl p-5 max-w-sm mx-auto shadow-xl">
            <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">Jij verstuurt (EUR)</label>
            <div className="flex items-center border-2 border-blue-500 rounded-xl px-4 py-3 mb-3">
              <span className="text-xl font-bold text-gray-400 mr-2">€</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="10"
                value={bedrag}
                onChange={e => setBedragSafe(e.target.value)}
                className="flex-1 text-2xl font-bold text-gray-800 outline-none"
              />
            </div>

            {/* Valuta selector */}
            <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">Ontvanger krijgt in</label>
            <div className="grid grid-cols-5 gap-1.5 mb-3 max-h-32 overflow-y-auto">
              {VALUTAS.map(v => (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => setValuta(v.code)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    valuta === v.code
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={v.naam}
                >
                  <span className="text-base leading-none">{v.vlag}</span>
                  <span className="text-[10px] mt-0.5">{v.code}</span>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl px-4 py-3 mb-2 flex justify-between items-center">
              <span className="text-sm text-gray-500">Ontvanger krijgt</span>
              <span className="text-xl font-bold text-blue-700">
                {valutaInfo.symbool}{ontvangenFmt}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 text-left mb-3">
              Koers: 1 EUR = {valutaInfo.koers.toLocaleString('nl-NL')} {valutaInfo.code}
            </div>
            <div className="text-xs text-gray-400 text-center mb-4">
              Kosten: 2,0% + wisselkoersmarge 0,45%
            </div>
            <button onClick={() => navigate('/login?tab=register')} className="btn-primary w-full py-3 text-sm">
              Nu gratis starten →
            </button>
            {(installPrompt || isIOS()) && !isInStandalone() && (
              <button onClick={installeerApp}
                className="w-full mt-2 border-2 border-blue-600 text-blue-600 font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:bg-blue-50 active:scale-95">
                📲 Download de app
              </button>
            )}
          </div>
        </div>
      </section>

      {/* iOS installatie uitleg popup */}
      {toonIOSUitleg && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4" onClick={() => setToonIOSUitleg(false)}>
          <div className="bg-gray-900 text-white rounded-2xl w-full max-w-sm p-5 space-y-3 mb-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="font-bold">Installeer SwiftBridge</span>
              </div>
              <button onClick={() => setToonIOSUitleg(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <p className="text-gray-400 text-xs">Volg deze 3 stappen in Safari:</p>
            {[
              { stap: '1️⃣', tekst: <>Tik op het <strong className="text-white">Deel-icoon ⬆️</strong> onderaan Safari</> },
              { stap: '2️⃣', tekst: <>Scroll en tik op <strong className="text-white">"Zet op beginscherm"</strong></> },
              { stap: '3️⃣', tekst: <>Tik op <strong className="text-white">"Voeg toe"</strong> — klaar! 🎉</> },
            ].map(({ stap, tekst }) => (
              <div key={stap} className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2.5">
                <span className="text-lg flex-shrink-0">{stap}</span>
                <p className="text-sm text-gray-300">{tekst}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <section className="py-14 px-4 relative" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(239,246,255,0.5) 100%)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={s.getal}
              className="card-glass p-5 text-center animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-br from-blue-500 to-blue-700 bg-clip-text text-transparent">{s.getal}</div>
              <div className="text-xs text-gray-500 mt-1.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Banken trust banner — alle Turkstalige landen */}
      <section className="py-12 px-4 bg-gradient-to-b from-white to-blue-50/50">
        <div className="max-w-4xl mx-auto">
          <TurkstaligeBankenSteun
            titel="Banken in alle Turkstalige landen"
            ondertitel="Stuur naar Turkije, Azerbeidzjan, Kazachstan, Oezbekistan, Turkmenistan, Kirgizië en Tadzjikistan"
            size="sm"
          />
        </div>
      </section>

      {/* Hoe werkt het */}
      <section id="hoe-werkt-het" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-3 tracking-tight">Hoe werkt het?</h2>
          <p className="text-gray-500 text-center mb-10">In 4 stappen geld overmaken naar Turkije</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {stappen.map((s, i) => (
              <div
                key={i}
                className="card-glass p-5 text-center relative animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {i < stappen.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-3 w-6 h-0.5 bg-gradient-to-r from-blue-400 to-transparent z-0" />
                )}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 relative z-10 animate-pulse-glow"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.05))',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}
                >
                  {s.icoon}
                </div>
                <div className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wider">Stap {i + 1}</div>
                <h3 className="font-bold text-gray-800 mb-1">{s.titel}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vergelijking */}
      <section id="vergelijking" className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-3">Vergelijking</h2>
          <p className="text-gray-500 text-center mb-10">SwiftBridge vs. de rest</p>
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Aanbieder</th>
                  <th className="px-5 py-3 text-center">Snelheid</th>
                  <th className="px-5 py-3 text-center">Totale kosten</th>
                  <th className="px-5 py-3 text-center">24/7</th>
                  <th className="px-5 py-3 text-center">Kimlik</th>
                </tr>
              </thead>
              <tbody>
                {vergelijking.map((r, i) => (
                  <tr key={i} className={`border-t ${r.highlight ? 'bg-blue-50' : ''}`}>
                    <td className="px-5 py-4 font-bold text-gray-800">
                      {r.highlight && <span className="text-blue-600">⚡ </span>}{r.naam}
                      {r.highlight && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Aanbevolen</span>}
                    </td>
                    <td className={`px-5 py-4 text-center font-semibold ${r.kleur}`}>{r.snelheid}</td>
                    <td className={`px-5 py-4 text-center font-semibold ${r.kleur}`}>{r.kosten}</td>
                    <td className="px-5 py-4 text-center">{r.highlight ? '✅' : '❌'}</td>
                    <td className="px-5 py-4 text-center">{r.highlight ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Download sectie */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-4">📲</div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Download de app</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Installeer SwiftBridge direct op je telefoon — geen App Store nodig.
            Werkt op Android en iPhone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { stap: '1', tekst: 'Open swiftbridge-app.up.railway.app in je browser' },
              { stap: '2', tekst: 'Tik op "Toevoegen aan beginscherm" of de download-banner' },
              { stap: '3', tekst: 'App staat op je beginscherm — klaar!' },
            ].map(s => (
              <div key={s.stap} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="w-10 h-10 bg-blue-600 text-white font-extrabold text-lg rounded-full flex items-center justify-center mx-auto mb-3">
                  {s.stap}
                </div>
                <p className="text-gray-600 text-sm">{s.tekst}</p>
              </div>
            ))}
          </div>
          {installPrompt ? (
            <button onClick={installeerApp}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg px-8 py-4 rounded-2xl transition shadow-lg flex items-center gap-3 mx-auto active:scale-95">
              📲 Nu installeren
            </button>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 inline-block text-sm text-gray-500">
              📱 Open deze pagina op je telefoon om de app te installeren
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-extrabold mb-3">Klaar om te beginnen?</h2>
        <p className="text-blue-100 mb-8 max-w-md mx-auto">
          Registreer gratis. Eerste transactie met €5 korting.
        </p>
        <button onClick={() => navigate('/login?tab=register')}
          className="bg-white text-blue-600 font-extrabold text-lg px-8 py-4 rounded-2xl hover:bg-blue-50 transition shadow-lg">
          Gratis account aanmaken →
        </button>
        <p className="text-blue-200 text-sm mt-4">Geen abonnement. Geen verborgen kosten.</p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 text-sm">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚡</span>
                <span className="font-bold text-white text-lg">SwiftBridge</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Snel en goedkoop geld overmaken van Nederland naar Turkije. In minder dan 5 minuten op rekening.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Juridisch</h4>
              <ul className="space-y-2">
                <li><a href="/algemene-voorwaarden" className="hover:text-white transition">Algemene Voorwaarden</a></li>
                <li><a href="/privacybeleid" className="hover:text-white transition">Privacybeleid (GDPR)</a></li>
                <li><a href="/aml-beleid" className="hover:text-white transition">AML-beleid</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <ul className="space-y-2">
                <li><a href="mailto:support@swiftbridge.nl" className="hover:text-white transition">support@swiftbridge.nl</a></li>
                <li><a href="mailto:privacy@swiftbridge.nl" className="hover:text-white transition">privacy@swiftbridge.nl</a></li>
                <li><a href="mailto:compliance@swiftbridge.nl" className="hover:text-white transition">compliance@swiftbridge.nl</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p>© 2026 SwiftBridge B.V. · KvK: [invullen]</p>
            <p className="mt-2 text-xs text-gray-600">
              SwiftBridge B.V. is geregistreerd in Nederland. Momenteel in bèta. Bij livegang worden betaaldiensten geleverd via een gelicentieerde EMI-partner (agent-model onder DNB-toezicht via partner). Wij hebben momenteel geen eigen DNB-vergunning.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
