import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
  { naam: 'Bank', snelheid: '3–5 dagen', kosten: '3–5%', kleur: 'text-red-500' },
  { naam: 'Wise', snelheid: 'Min.–2 dagen', kosten: '0,4–1,5%', kleur: 'text-orange-500' },
  { naam: 'Revolut', snelheid: '2–3 dagen', kosten: '2–6%', kleur: 'text-orange-500' },
  { naam: 'SwiftBridge', snelheid: '< 5 minuten ⚡', kosten: '2,0–2,5%', kleur: 'text-green-600', highlight: true },
];

function LiveKoers() {
  const [koers, setKoers] = useState(36.20);
  useEffect(() => {
    const interval = setInterval(() => {
      setKoers(prev => parseFloat((prev + (Math.random() - 0.5) * 0.05).toFixed(4)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="font-mono font-bold text-green-400">1 EUR = {koers} TRY</span>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [bedrag, setBedrag] = useState(500);
  const installPrompt = useInstallPrompt();

  async function installeerApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigatiebalk */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-extrabold text-gray-900">SwiftBridge</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#hoe-werkt-het" className="hover:text-blue-600">Hoe werkt het?</a>
            <a href="#kosten" className="hover:text-blue-600">Kosten</a>
            <a href="#vergelijking" className="hover:text-blue-600">Vergelijking</a>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/login')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 px-3 py-2">
              Inloggen
            </button>
            <button onClick={() => navigate('/login?tab=register')}
              className="text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">
              Gratis starten →
            </button>
          </div>
        </div>
      </nav>

      {/* Live koers ticker */}
      <div className="bg-gray-900 text-sm py-2 text-center text-gray-400">
        📡 Live wisselkoers &nbsp;·&nbsp; <LiveKoers /> &nbsp;·&nbsp; Bijgewerkt elke 90 seconden
      </div>

      {/* Hero sectie */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500 bg-opacity-50 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            🇳🇱 Nederland → Turkije 🇹🇷
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            Geld naar Turkije<br />
            <span className="text-yellow-300">in minder dan 5 minuten</span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-xl mx-auto">
            Goedkoper dan je bank. Sneller dan Wise. 24/7 beschikbaar. Met Turks kimlik.
          </p>

          {/* Rekentool */}
          <div className="bg-white text-gray-800 rounded-2xl p-5 max-w-sm mx-auto shadow-xl">
            <label className="block text-xs font-semibold text-gray-500 mb-1 text-left">Jij verstuurt (EUR)</label>
            <div className="flex items-center border-2 border-blue-500 rounded-xl px-4 py-3 mb-3">
              <span className="text-xl font-bold text-gray-400 mr-2">€</span>
              <input type="number" value={bedrag} onChange={e => setBedrag(e.target.value)}
                className="flex-1 text-2xl font-bold text-gray-800 outline-none" />
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">Ontvanger krijgt</span>
              <span className="text-xl font-bold text-blue-700">
                ₺{Math.round(bedrag * 36.20 * 0.9775).toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="text-xs text-gray-400 text-center mb-4">
              Kosten: 2,0% + wisselkoersmarge 0,45%
            </div>
            <button onClick={() => navigate('/login?tab=register')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm">
              Nu gratis starten →
            </button>
            {installPrompt && (
              <button onClick={installeerApp}
                className="w-full mt-2 border-2 border-blue-600 text-blue-600 font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 hover:bg-blue-50 active:scale-95">
                📲 Download de app
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.getal} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-blue-600">{s.getal}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Hoe werkt het */}
      <section id="hoe-werkt-het" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-3">Hoe werkt het?</h2>
          <p className="text-gray-500 text-center mb-10">In 4 stappen geld overmaken naar Turkije</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stappen.map((s, i) => (
              <div key={i} className="text-center relative">
                {i < stappen.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-3/4 w-1/2 h-0.5 bg-blue-200 z-0" />
                )}
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 relative z-10">
                  {s.icoon}
                </div>
                <div className="text-xs font-bold text-blue-600 mb-1">STAP {i + 1}</div>
                <h3 className="font-bold text-gray-800 mb-1">{s.titel}</h3>
                <p className="text-sm text-gray-500">{s.tekst}</p>
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
            <p>© 2026 SwiftBridge B.V. · KvK: [invullen] · DNB-registratie in behandeling</p>
            <p className="mt-2 text-xs text-gray-600">
              SwiftBridge B.V. is geregistreerd in Nederland. Momenteel in bèta — DNB-registratie als betaaldienstverlener (PSD2) is in behandeling.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
