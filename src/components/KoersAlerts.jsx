/**
 * KoersAlerts.jsx — Wisselkoers alerts
 * Klant stelt target koers + richting in, krijgt push wanneer behaald
 */
import { useState, useEffect } from 'react';
import { VALUTAS, getValuta } from '../services/currencies';
import { parseError } from '../services/api';
import { useTaal } from '../i18n';
import Vlag from './Vlag';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function KoersAlerts({ token }) {
  const { t } = useTaal();
  const [alerts, setAlerts] = useState([]);
  const [laden, setLaden] = useState(true);
  const [valuta, setValuta] = useState('TRY');
  const [target, setTarget] = useState('');
  const [richting, setRichting] = useState('boven');
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  async function laad() {
    setLaden(true);
    try {
      const res = await fetch(`${API}/alerts`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      setAlerts(data.alerts || []);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }

  useEffect(() => { laad(); }, []);

  async function maakAlert(e) {
    e.preventDefault();
    setFout('');
    const koers = parseFloat(target);
    if (!koers || koers <= 0) return setFout(parseError({ errorCode: 'INVALID_INPUT' }, t));
    setBezig(true);
    try {
      const res = await fetch(`${API}/alerts`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ valuta, target_koers: koers, richting }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...d, status: res.status }, t));
        return;
      }
      setTarget('');
      await laad();
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  async function toggleAlert(id) {
    await fetch(`${API}/alerts/${id}/toggle`, {
        credentials: 'include',
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    await laad();
  }

  async function verwijderAlert(id) {
    if (!confirm('Alert verwijderen?')) return;
    await fetch(`${API}/alerts/${id}`, {
        credentials: 'include',
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await laad();
  }

  return (
    <div className="space-y-4">
      <div className="card-glass p-5 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔔</span>
          <h2 className="text-xl font-bold text-gray-800">Koers Alerts</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Krijg een melding wanneer de wisselkoers jouw doel bereikt. Perfect om geld te sturen op het beste moment.
        </p>

        <form onSubmit={maakAlert} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Valuta</label>
              <select
                value={valuta}
                onChange={(e) => setValuta(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500"
              >
                {VALUTAS.filter(v => v.code !== 'EUR').map(v => (
                  <option key={v.code} value={v.code}>{v.code} — {v.naam} ({v.land})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Richting</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRichting('boven')}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    richting === 'boven' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  ▲ Boven
                </button>
                <button
                  type="button"
                  onClick={() => setRichting('onder')}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    richting === 'onder' ? 'bg-rose-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  ▼ Onder
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Meld mij wanneer 1 EUR {richting === 'boven' ? '≥' : '≤'} ... {valuta}
            </label>
            <div className="flex items-center border-2 border-blue-500 rounded-xl px-4 py-2.5 bg-blue-50/50">
              <span className="text-lg font-bold text-gray-400 mr-2">{getValuta(valuta).symbool}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="bv 37.00"
                className="flex-1 text-lg font-bold text-gray-800 outline-none bg-transparent"
              />
            </div>
          </div>

          {fout && <div className="text-rose-600 text-sm">{fout}</div>}

          <button type="submit" disabled={bezig} className="btn-primary w-full py-3">
            {bezig ? '⏳ Aanmaken...' : '🔔 Alert aanmaken'}
          </button>
        </form>
      </div>

      <div className="card-glass p-5 animate-fade-up">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          📋 Mijn alerts
          <span className="pill-neutral">{alerts.length}</span>
        </h3>

        {laden ? (
          <div className="space-y-2">
            <div className="h-12 animate-shimmer rounded-xl" />
            <div className="h-12 animate-shimmer rounded-xl" />
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-6">
            Nog geen alerts ingesteld. Maak er hierboven één aan!
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.map(a => {
              const v = getValuta(a.valuta);
              const isGetriggerd = !!a.getriggerd_op;
              return (
                <div
                  key={a.id}
                  className={`rounded-xl p-3 flex items-center justify-between transition-all ${
                    isGetriggerd
                      ? 'bg-emerald-50 border border-emerald-200'
                      : a.actief
                      ? 'bg-blue-50 border border-blue-100'
                      : 'bg-gray-50 border border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Vlag land={v.landCode} size={22} />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        1 EUR {a.richting === 'boven' ? '≥' : '≤'} <span className="font-mono">{Number(a.target_koers).toFixed(4)}</span> {a.valuta}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {isGetriggerd ? (
                          <>✅ Behaald op {new Date(a.getriggerd_op).toLocaleString('nl-NL')}</>
                        ) : a.laatste_koers ? (
                          <>Huidig: <span className="font-mono">{Number(a.laatste_koers).toFixed(4)}</span></>
                        ) : (
                          <>Wacht op eerste check...</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!isGetriggerd && (
                      <button
                        onClick={() => toggleAlert(a.id)}
                        className={`text-xs px-2 py-1 rounded-lg ${
                          a.actief ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {a.actief ? '⏸️ Pauze' : '▶️ Aan'}
                      </button>
                    )}
                    <button
                      onClick={() => verwijderAlert(a.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-gray-400 mt-3 text-center">
          Alerts worden elke 5 minuten gecheckt. Push notificatie aanzetten in instellingen.
        </p>
      </div>
    </div>
  );
}
