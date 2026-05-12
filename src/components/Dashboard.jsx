/**
 * Dashboard.jsx — Persoonlijk overzicht voor SwiftBridge gebruiker
 * - Live EUR/TRY koers via SwiftNews API
 * - Echte transactiehistorie uit localStorage
 * - Persoonlijke statistieken
 */
import { useState, useEffect, useCallback } from 'react';

const SWIFTNEWS = import.meta.env.VITE_SWIFTNEWS_URL || 'https://news-production-8477.up.railway.app';
const TX_KEY    = 'swiftbridge_transacties';

// ── Helpers ───────────────────────────────────────────────────────────────────
function laadTransacties() {
  try { return JSON.parse(localStorage.getItem(TX_KEY) || '[]'); }
  catch { return []; }
}

function tijdGeleden(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'zojuist';
  if (m < 60) return `${m} min geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} uur geleden`;
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function fmtTry(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n || 0);
}

// ── Live koers kaart ──────────────────────────────────────────────────────────
function LiveKoersKaart({ koers, laden }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💱</span>
          <span className="font-semibold text-blue-100 text-sm">Live wisselkoers</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${laden ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-blue-200 text-xs">{laden ? 'bijwerken...' : 'live'}</span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-4xl font-extrabold font-mono">
            {koers ? koers.toFixed(4) : '—'}
          </div>
          <div className="text-blue-200 text-sm mt-1">TRY per 1 EUR</div>
        </div>
        <div className="text-right">
          <div className="text-blue-100 text-xs mb-1">SwiftBridge koers</div>
          <div className="text-white font-bold text-lg">
            {koers ? (koers * 0.978).toFixed(4) : '—'}
          </div>
          <div className="text-blue-200 text-xs">na 2,2% kosten</div>
        </div>
      </div>

      <div className="mt-4 bg-blue-500/40 rounded-xl p-3 flex justify-between items-center">
        <span className="text-blue-100 text-sm">€500 ontvangt →</span>
        <span className="text-white font-bold text-lg">
          {koers ? fmtTry(500 * koers * 0.978) : '...'}
        </span>
      </div>
    </div>
  );
}

// ── Statistieken ──────────────────────────────────────────────────────────────
function StatsRij({ transacties }) {
  const totaalEur = transacties.reduce((s, t) => s + (t.eurBedrag || 0), 0);
  const totaalTry = transacties.reduce((s, t) => s + (t.tryBedrag || 0), 0);
  const voltooide = transacties.filter(t => t.status === 'voltooid').length;
  const gemBedrag = transacties.length > 0 ? totaalEur / transacties.length : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Totaal verstuurd',  waarde: fmtEur(totaalEur), icoon: '💶', kleur: 'text-blue-600'   },
        { label: 'Ontvangen in TRY',  waarde: fmtTry(totaalTry), icoon: '🇹🇷', kleur: 'text-green-600'  },
        { label: 'Transacties',       waarde: voltooide,          icoon: '✅', kleur: 'text-purple-600' },
        { label: 'Gemiddeld bedrag',  waarde: fmtEur(gemBedrag),  icoon: '📊', kleur: 'text-amber-600'  },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-2xl mb-2">{s.icoon}</div>
          <div className={`text-lg font-bold ${s.kleur}`}>{s.waarde}</div>
          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Alle transacties modal ────────────────────────────────────────────────────
function AlleTransactiesModal({ transacties, onSluit }) {
  const gesorteerd = [...transacties].sort((a, b) => new Date(b.datum) - new Date(a.datum));
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">📋 Alle transacties</h3>
          <button onClick={onSluit} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {gesorteerd.map((t, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {t.status === 'voltooid' ? '✅' : t.status === 'mislukt' ? '❌' : '⏳'}
                </span>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{t.ontvangerNaam}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(t.datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {t.methode && <div className="text-xs text-blue-500">{t.methode}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-sm">{fmtEur(t.eurBedrag)}</div>
                <div className="text-xs text-green-600">{fmtTry(t.tryBedrag)}</div>
                <div className={`text-xs font-medium mt-0.5 ${
                  t.status === 'voltooid' ? 'text-green-500' :
                  t.status === 'mislukt'  ? 'text-red-500'   : 'text-amber-500'}`}>
                  {t.status === 'voltooid' ? 'Voltooid' : t.status === 'mislukt' ? 'Mislukt' : 'In behandeling'}
                </div>
              </div>
            </div>
          ))}
          {gesorteerd.length === 0 && (
            <div className="text-center text-gray-400 py-8">Geen transacties gevonden</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Transactiehistorie ────────────────────────────────────────────────────────
function TransactieHistorie({ transacties, onAlles }) {
  const recent = [...transacties]
    .sort((a, b) => new Date(b.datum) - new Date(a.datum))
    .slice(0, 5);

  if (transacties.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="text-4xl mb-3">💸</div>
        <h3 className="font-bold text-gray-700 mb-1">Nog geen transacties</h3>
        <p className="text-gray-400 text-sm">Maak je eerste overschrijving naar Turkije</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">⚡ Recente transacties</h3>
        {transacties.length > 5 && (
          <button onClick={onAlles} className="text-xs text-blue-600 font-medium hover:underline">
            Alle {transacties.length} bekijken →
          </button>
        )}
      </div>
      <div className="space-y-3">
        {recent.map((t, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-base">
                {t.status === 'voltooid' ? '✅' : t.status === 'mislukt' ? '❌' : '⏳'}
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{t.ontvangerNaam}</div>
                <div className="text-xs text-gray-400">{tijdGeleden(t.datum)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-sm">{fmtEur(t.eurBedrag)}</div>
              <div className="text-xs text-green-600 font-medium">{fmtTry(t.tryBedrag)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function Dashboard({ gebruiker }) {
  const [koers,       setKoers      ] = useState(null);
  const [ladenKoers,  setLadenKoers ] = useState(true);
  const [transacties, setTransacties] = useState([]);
  const [toonAlles,   setToonAlles  ] = useState(false);

  const haalKoers = useCallback(async () => {
    setLadenKoers(true);
    try {
      const res  = await fetch(`${SWIFTNEWS}/api/forex`);
      const json = await res.json();
      if (json.rate) setKoers(json.rate);
    } catch { /* gebruik laatste bekende koers */ }
    finally { setLadenKoers(false); }
  }, []);

  useEffect(() => {
    haalKoers();
    const id = setInterval(haalKoers, 90_000);
    return () => clearInterval(id);
  }, [haalKoers]);

  useEffect(() => {
    setTransacties(laadTransacties());
    const handler = () => setTransacties(laadTransacties());
    window.addEventListener('swiftbridge_tx_update', handler);
    return () => window.removeEventListener('swiftbridge_tx_update', handler);
  }, []);

  const kycGoedgekeurd = gebruiker?.kycStatus === 'goedgekeurd';

  return (
    <div className="space-y-4">
      {/* Welkom */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">
            Hallo {gebruiker?.naam?.split(' ')[0] || 'daar'} 👋
          </h2>
          <p className="text-gray-500 text-sm">Geld overmaken naar Turkije</p>
        </div>
        <button onClick={haalKoers} className="text-gray-400 hover:text-blue-600 transition text-xl" title="Vernieuwen">
          🔄
        </button>
      </div>

      {/* KYC waarschuwing */}
      {!kycGoedgekeurd && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <span className="text-2xl">🪪</span>
          <div>
            <div className="font-bold text-amber-800 text-sm">KYC verificatie vereist</div>
            <div className="text-amber-600 text-xs mt-1">
              Verifieer je identiteit om geld over te kunnen maken. Duurt minder dan 5 minuten.
            </div>
          </div>
        </div>
      )}

      {/* Live koers */}
      <LiveKoersKaart koers={koers} laden={ladenKoers} />

      {/* Statistieken — alleen als er transacties zijn */}
      {transacties.length > 0 && <StatsRij transacties={transacties} />}

      {/* Transactiehistorie */}
      <TransactieHistorie transacties={transacties} onAlles={() => setToonAlles(true)} />

      {/* Info balk */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icoon: '⚡', tekst: '< 5 min aankomst'      },
          { icoon: '🔒', tekst: 'DNB gereguleerd'        },
          { icoon: '💶', tekst: '2,0–2,5% alles-in'     },
        ].map(({ icoon, tekst }) => (
          <div key={tekst} className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="text-xl mb-1">{icoon}</div>
            <div className="text-xs text-gray-500 font-medium">{tekst}</div>
          </div>
        ))}
      </div>

      {toonAlles && (
        <AlleTransactiesModal transacties={transacties} onSluit={() => setToonAlles(false)} />
      )}
    </div>
  );
}
