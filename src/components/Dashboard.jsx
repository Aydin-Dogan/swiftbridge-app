/**
 * Dashboard.jsx — Persoonlijk overzicht voor SwiftBridge gebruiker
 * - Live EUR/TRY koers via backend API
 * - Echte transactiehistorie uit de database
 * - Weeklimiet voortgangsbalk
 * - Filters: alle / voltooid / in behandeling
 */
import { useState, useEffect, useCallback } from 'react';
import NotificatieInstellingen from './NotificatieInstellingen';
import TweeFactorInstellingen from './TweeFactorInstellingen';
import FeestKalender from './FeestKalender';
import { getValuta, formatBedrag } from '../services/currencies';
import { useTaal } from '../i18n';
import TransactieReceipt from './TransactieReceipt';

const API    = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TX_KEY = 'swiftbridge_transacties';

// ── Helpers ───────────────────────────────────────────────────────────────────
function laadLokaleTransacties() {
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
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}
function fmtTry(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n || 0);
}

// Toont ontvangen bedrag in de juiste valuta van de transactie (zonder emoji vlag voor consistentie)
function fmtOntvangen(tx) {
  if (tx?.valuta && tx?.ontvangenBedrag != null) {
    return formatBedrag(tx.ontvangenBedrag, tx.valuta);
  }
  // Legacy: oude transacties hebben alleen tryBedrag
  return fmtTry(tx?.tryBedrag);
}

// ── Statusbadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    voltooid:       { pill: 'pill-success', icoon: '✅', label: 'Voltooid'        },
    in_behandeling: { pill: 'pill-warning', icoon: '⏳', label: 'In behandeling'  },
    mislukt:        { pill: 'pill-error',   icoon: '❌', label: 'Mislukt'          },
    geannuleerd:    { pill: 'pill-neutral', icoon: '🚫', label: 'Geannuleerd'      },
  };
  const s = map[status] || map.in_behandeling;
  return (
    <span className={`inline-flex items-center gap-1 ${s.pill}`}>
      {s.icoon} {s.label}
    </span>
  );
}

// ── Weeklimiet balk ───────────────────────────────────────────────────────────
function WeeklimietBalk({ weekTotaal, weekLimiet }) {
  const { t } = useTaal();
  const pct = Math.min(100, (weekTotaal / weekLimiet) * 100);
  const resterend = Math.max(0, weekLimiet - weekTotaal);
  const barGradient = pct >= 90
    ? 'linear-gradient(90deg, #f43f5e, #fb7185)'
    : pct >= 70
    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
    : 'linear-gradient(90deg, #10b981, #34d399)';
  const glowColor = pct >= 90 ? 'rgba(244,63,94,0.5)' : pct >= 70 ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)';

  return (
    <div className="card-glass p-4 space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <span className="font-semibold text-gray-800 text-sm">{t('weeklimiet')}</span>
        </div>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{t('weeklimiet_resets')}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
        <div
          className="h-3 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: barGradient,
            boxShadow: `0 0 12px ${glowColor}`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span dangerouslySetInnerHTML={{ __html: t('weeklimiet_gebruikt', { bedrag: `<strong class="text-gray-800 font-mono">${fmtEur(weekTotaal)}</strong>` }) }} />
        <span dangerouslySetInnerHTML={{ __html: t('weeklimiet_beschikbaar', { bedrag: `<strong class="font-mono ${resterend < 500 ? 'text-rose-600' : 'text-emerald-600'}">${fmtEur(resterend)}</strong>` }) }} />
      </div>
      <div className="text-right text-[10px] text-gray-400 uppercase tracking-wider">{t('weeklimiet_limiet', { bedrag: fmtEur(weekLimiet) })}</div>
    </div>
  );
}

// ── Live koers kaart ──────────────────────────────────────────────────────────
function LiveKoersKaart({ koers, laden }) {
  const { t } = useTaal();
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💱</span>
          <span className="font-semibold text-blue-100 text-sm">{t('dashboard_live_koers')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${laden ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-blue-200 text-xs">{laden ? '...' : 'live'}</span>
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
          <div className="text-blue-100 text-xs mb-1">{t('dashboard_swiftbridge_koers')}</div>
          <div className="text-white font-bold text-lg">
            {koers ? (koers * 0.978).toFixed(4) : '—'}
          </div>
          <div className="text-blue-200 text-xs">{t('dashboard_na_kosten')}</div>
        </div>
      </div>
      <div className="mt-4 bg-blue-500/40 rounded-xl p-3 flex justify-between items-center">
        <span className="text-blue-100 text-sm">{t('dashboard_500_ontvangt')}</span>
        <span className="text-white font-bold text-lg">
          {koers ? fmtTry(500 * koers * 0.978) : '...'}
        </span>
      </div>
    </div>
  );
}

// ── Statistieken ──────────────────────────────────────────────────────────────
function StatsRij({ transacties }) {
  const { t } = useTaal();
  // Tel ook in_behandeling en wacht_op_betaling mee — alleen mislukt/geannuleerd uitsluiten
  const actieve    = transacties.filter(tx => !['mislukt', 'geannuleerd'].includes(tx.status));
  const totaalEur  = actieve.reduce((s, tx) => s + (tx.eurBedrag || 0), 0);
  const totaalTry  = actieve.reduce((s, tx) => s + (tx.tryBedrag || 0), 0);
  const gemBedrag  = actieve.length > 0 ? totaalEur / actieve.length : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: t('stats_totaal_verstuurd'), waarde: fmtEur(totaalEur), icoon: '💶', kleur: 'text-blue-600'   },
        { label: t('stats_ontvangen_try'),    waarde: fmtTry(totaalTry), icoon: '🇹🇷', kleur: 'text-green-600'  },
        { label: t('stats_transacties'),      waarde: actieve.length,    icoon: '✅', kleur: 'text-purple-600' },
        { label: t('stats_gemiddeld'),        waarde: fmtEur(gemBedrag), icoon: '📊', kleur: 'text-amber-600'  },
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

// ── Transactiedetail modal ────────────────────────────────────────────────────
function TransactieDetailModal({ tx, onSluit }) {
  if (!tx) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onSluit}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-gray-800 text-lg">Transactiedetails</h3>
          <button
            onClick={onSluit}
            className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          {[
            ['Status',        <StatusBadge status={tx.status} />],
            ['Bedrag',        <span className="font-bold">{fmtEur(tx.eurBedrag)}</span>],
            ['Ontvanger krijgt', <span className="font-bold text-emerald-600">{fmtOntvangen(tx)}</span>],
            ['Wisselkoers',   <span className="font-mono text-sm">{tx.wisselKoers ? `1 EUR = ${tx.wisselKoers} ${tx.valuta || 'TRY'}` : '—'}</span>],
            ['Kosten',        <span className="text-red-500">{fmtEur(tx.feeEur)}</span>],
            ['Ontvanger',     <span>{tx.ontvangerNaam}</span>],
            ['Bank',          <span>{tx.ontvangerBank || 'Garanti BBVA'}</span>],
            ['Datum',         <span className="text-gray-600">{new Date(tx.aangemaaktOp || tx.datum).toLocaleString('nl-NL')}</span>],
            ['Transactie ID', <span className="font-mono text-xs text-gray-400 break-all">{tx.id}</span>],
          ].map(([label, waarde]) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-500 text-sm flex-shrink-0">{label}</span>
              <span className="text-sm text-right">{waarde}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Transactiehistorie ────────────────────────────────────────────────────────
function TransactieHistorie({ transacties, laden }) {
  const { t } = useTaal();
  const [filter,    setFilter   ] = useState('alle');
  const [toonAlles, setToonAlles] = useState(false);
  const [detailTx,  setDetailTx ] = useState(null);

  const gefilterd = transacties.filter(tx => {
    if (filter === 'voltooid')       return tx.status === 'voltooid';
    if (filter === 'in_behandeling') return tx.status === 'in_behandeling';
    return true;
  });

  const getoond = toonAlles ? gefilterd : gefilterd.slice(0, 5);

  if (laden) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="text-2xl animate-pulse mb-2">⏳</div>
        <p className="text-gray-400 text-sm">{t('laden')}</p>
      </div>
    );
  }

  if (transacties.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="text-4xl mb-3" aria-hidden="true">💸</div>
        <h3 className="font-bold text-gray-700 mb-1">{t('transacties_geen')}</h3>
        <p className="text-gray-400 text-sm mb-4">{t('transacties_eerste')}</p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))}
          className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2"
        >
          <span aria-hidden="true">💸</span>
          Begin je eerste overboeking
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">⚡ {t('transacties')}</h3>
          <span className="text-xs text-gray-400">{transacties.length} totaal</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'alle',           label: 'Alle'           },
            { id: 'voltooid',       label: '✅ Voltooid'    },
            { id: 'in_behandeling', label: '⏳ In behandeling' },
          ].map(f => (
            <button key={f.id} onClick={() => { setFilter(f.id); setToonAlles(false); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {getoond.map((t, i) => (
          <button key={t.id || i} onClick={() => setDetailTx(t)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition text-left">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
                t.status === 'voltooid' ? 'bg-green-100' :
                t.status === 'mislukt'  ? 'bg-red-100'   : 'bg-amber-100'}`}>
                {t.status === 'voltooid' ? '✅' : t.status === 'mislukt' ? '❌' : '⏳'}
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{t.ontvangerNaam}</div>
                <div className="text-xs text-gray-400">{tijdGeleden(t.aangemaaktOp || t.datum)}</div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-gray-800 text-sm">{fmtEur(t.eurBedrag)}</div>
              <div className="text-xs text-emerald-600 font-medium">{fmtOntvangen(t)}</div>
            </div>
          </button>
        ))}
      </div>

      {gefilterd.length > 5 && (
        <div className="p-4 border-t border-gray-50">
          <button onClick={() => setToonAlles(!toonAlles)}
            className="w-full text-center text-sm text-blue-600 font-medium hover:underline">
            {toonAlles ? 'Minder tonen ↑' : `Alle ${gefilterd.length} transacties tonen ↓`}
          </button>
        </div>
      )}

      {gefilterd.length === 0 && (
        <div className="p-6 text-center text-gray-400 text-sm">Geen transacties gevonden</div>
      )}

      <TransactieReceipt
        tx={detailTx}
        onSluit={() => setDetailTx(null)}
        onHerhaal={(tx) => {
          // Sla ontvanger op localStorage zodat PaymentFlow het kan voorvullen
          localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
            ontvanger: tx.ontvangerNaam || tx.ontvanger_naam,
            iban: tx.ontvangerIBAN || tx.ontvanger_iban,
            bedrag: tx.eurBedrag || tx.eur_bedrag,
            valuta: tx.valuta || 'TRY',
          }));
          setDetailTx(null);
          window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: { tab: 'betaling' } }));
        }}
      />
    </div>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function Dashboard({ gebruiker }) {
  const { t } = useTaal();
  const [koers,       setKoers      ] = useState(null);
  const [ladenKoers,  setLadenKoers ] = useState(true);
  const [transacties, setTransacties] = useState([]);
  const [ladenTx,     setLadenTx    ] = useState(true);
  const [weekData,    setWeekData   ] = useState({ weekTotaal: 0, weekLimiet: 5000 });

  const token = localStorage.getItem('sb_token');

  // Haal live FX koers op via backend
  const haalKoers = useCallback(async () => {
    setLadenKoers(true);
    try {
      const res  = await fetch(`${API}/transactions/koersen`);
      const json = await res.json();
      if (json.koersen?.TRY) setKoers(json.koersen.TRY);
    } catch { /* gebruik laatste bekende koers */ }
    finally { setLadenKoers(false); }
  }, []);

  // Haal transacties op uit de database
  const haalTransacties = useCallback(async () => {
    setLadenTx(true);
    try {
      const res  = await fetch(`${API}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Niet ingelogd');
      const json = await res.json();
      setTransacties(json.transacties || []);
      setWeekData({
        weekTotaal: json.weekTotaal || 0,
        weekLimiet: json.weekLimiet || 5000,
      });
    } catch {
      // Fallback op localStorage
      setTransacties(laadLokaleTransacties());
    } finally {
      setLadenTx(false);
    }
  }, [token]);

  useEffect(() => {
    haalKoers();
    const id = setInterval(haalKoers, 60_000);
    return () => clearInterval(id);
  }, [haalKoers]);

  useEffect(() => {
    haalTransacties();
    const handler = () => haalTransacties();
    window.addEventListener('swiftbridge_tx_update', handler);
    return () => window.removeEventListener('swiftbridge_tx_update', handler);
  }, [haalTransacties]);

  const kycGoedgekeurd = gebruiker?.kycStatus === 'goedgekeurd';

  return (
    <div className="space-y-4">
      {/* Welkom */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">
            {t('dashboard_hallo', { naam: gebruiker?.naam?.split(' ')[0] || '' })}
          </h2>
          <p className="text-gray-500 text-sm">{t('dashboard_subtitel')}</p>
        </div>
        <button onClick={() => { haalKoers(); haalTransacties(); }}
          className="text-gray-400 hover:text-blue-600 active:scale-95 transition text-xl w-11 h-11 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-300"
          title="Vernieuwen"
          aria-label="Dashboard vernieuwen">
          <span aria-hidden="true">🔄</span>
        </button>
      </div>

      {/* Welkomst-deal — eerste transactie gratis */}
      {gebruiker?.gratisEersteTx && kycGoedgekeurd && (
        <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-2xl p-4 text-white shadow-lg animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="text-4xl flex-shrink-0">🎁</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">Welkomst-deal: 1e transactie GRATIS!</div>
              <div className="text-xs text-white/90 mt-0.5">Geen servicekosten op je eerste overboeking (tot €800)</div>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: { tab: 'betaling' } }))}
            className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 rounded-xl text-sm active:scale-95"
          >
            💸 Verstuur je eerste gratis transactie →
          </button>
        </div>
      )}

      {/* Culturele kalender — Bayram/Ramadan herinneringen */}
      {kycGoedgekeurd && (
        <FeestKalender onOvermaken={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))} />
      )}

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

      {/* Weeklimiet — alleen tonen als KYC goedgekeurd */}
      {kycGoedgekeurd && (
        <WeeklimietBalk
          weekTotaal={weekData.weekTotaal}
          weekLimiet={weekData.weekLimiet}
        />
      )}

      {/* Statistieken — alleen als er transacties zijn */}
      {transacties.length > 0 && <StatsRij transacties={transacties} />}

      {/* Transactiehistorie */}
      <TransactieHistorie transacties={transacties} laden={ladenTx} />

      {/* Beveiliging — 2FA toggle, alleen als ingelogd */}
      {token && (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-700 text-sm px-1">🔒 Beveiliging</h3>
          <TweeFactorInstellingen
            token={token}
            twofaIngeschakeld={!!gebruiker?.twofaIngeschakeld}
          />
        </div>
      )}

      {/* Notificatie instellingen — alleen als KYC goedgekeurd */}
      {kycGoedgekeurd && token && <NotificatieInstellingen token={token} />}

      {/* Info balk */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icoon: '⚡', tekst: '< 5 min aankomst'  },
          { icoon: '🔒', tekst: 'Veilig via licentiepartner' },
          { icoon: '💶', tekst: '2,0–2,5% alles-in'  },
        ].map(({ icoon, tekst }) => (
          <div key={tekst} className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="text-xl mb-1">{icoon}</div>
            <div className="text-xs text-gray-500 font-medium">{tekst}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
