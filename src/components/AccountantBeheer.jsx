/**
 * AccountantBeheer.jsx — beheer read-only deel-links voor accountant (ZZ).
 *
 * Routes (backend):
 *   POST   /accountant/tokens          — nieuwe token aanmaken
 *   GET    /accountant/tokens          — lijst eigen tokens
 *   DELETE /accountant/tokens/:id      — intrekken
 *
 * UX:
 *   - Form: naam + geldigheid (30/60/90 dagen)
 *   - Lijst van eigen tokens met status, deel-URL, intrek-knop
 *   - "Net aangemaakt" token toont URL prominent + copy + WhatsApp
 *   - ConfirmDialog bij intrekken
 */
import { useState, useEffect, useCallback } from 'react';
import { API_URL, apiFetch, parseError } from '../services/api';
import { useTaal } from '../i18n';
import ConfirmDialog from './ConfirmDialog';

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('nl-NL', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

export default function AccountantBeheer() {
  const { t } = useTaal();
  const [tokens, setTokens] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [naam, setNaam] = useState('');
  const [dagen, setDagen] = useState(90);
  const [bezig, setBezig] = useState(false);
  const [recent, setRecent] = useState(null); // net aangemaakt token (toon URL prominent)
  const [verwijderId, setVerwijderId] = useState(null);
  const [verwijderBezig, setVerwijderBezig] = useState(false);
  const [gekopieerd, setGekopieerd] = useState(false);

  const laad = useCallback(async () => {
    setLaden(true);
    try {
      const d = await apiFetch('/accountant/tokens');
      setTokens(d.tokens || []);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }, [t]);

  useEffect(() => { laad(); }, [laad]);

  async function maakAan(e) {
    e?.preventDefault?.();
    if (bezig) return;
    setBezig(true);
    setFout('');
    try {
      const data = await apiFetch('/accountant/tokens', {
        method: 'POST',
        body: { naam: naam.trim() || t('accountant_default_naam'), geldigheidDagen: dagen },
      });
      setRecent(data);
      setNaam('');
      await laad();
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  async function bevestigVerwijder() {
    if (!verwijderId) return;
    setVerwijderBezig(true);
    try {
      await apiFetch(`/accountant/tokens/${verwijderId}`, { method: 'DELETE' });
      await laad();
      // Verwijder uit recent als die net was aangemaakt
      if (recent && tokens.find(t => t.id === verwijderId)) setRecent(null);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setVerwijderBezig(false);
      setVerwijderId(null);
    }
  }

  function urlVoor(token) {
    return `${API_URL}/accountant/export/${token}`;
  }

  async function kopieer(url) {
    try {
      await navigator.clipboard.writeText(url);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2500);
    } catch {
      window.prompt(t('accountant_kopieer_handmatig'), url);
    }
  }

  function whatsapp(url) {
    const bericht = `${t('accountant_wa_bericht')} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(bericht)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="card-glass p-5 animate-fade-up border-l-4 border-teal-500 space-y-4">
      <div>
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-700" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          {t('accountant_titel')}
        </h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
          {t('accountant_uitleg')}
        </p>
      </div>

      {/* Net aangemaakt — toon URL prominent */}
      {recent && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-bold text-emerald-900">
            ✓ {t('accountant_aangemaakt')}
          </p>
          <div className="bg-white rounded-lg px-3 py-2 text-xs font-mono text-gray-700 truncate">
            {urlVoor(recent.token)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => kopieer(urlVoor(recent.token))}
              className="text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 transition"
            >
              {gekopieerd ? `✓ ${t('accountant_gekopieerd')}` : `📋 ${t('accountant_kopieer')}`}
            </button>
            <button
              onClick={() => whatsapp(urlVoor(recent.token))}
              className="text-xs font-bold text-white bg-[#25D366] hover:bg-[#1ebe57] rounded-lg py-2 transition"
            >
              WhatsApp
            </button>
          </div>
          <p className="text-xs text-emerald-800">
            {t('accountant_geldig_tot')}: {formatTime(recent.verloopt_op)}
          </p>
        </div>
      )}

      {/* Aanmaak-form */}
      <form onSubmit={maakAan} className="bg-gray-50 rounded-xl p-4 space-y-2">
        <label className="block text-xs font-semibold text-gray-700">
          {t('accountant_form_naam')}
        </label>
        <input
          type="text"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder={t('accountant_form_naam_placeholder')}
          maxLength={100}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          disabled={bezig}
        />
        <label className="block text-xs font-semibold text-gray-700 mt-2">
          {t('accountant_form_geldigheid')}
        </label>
        <select
          value={dagen}
          onChange={(e) => setDagen(parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          disabled={bezig}
        >
          <option value="30">30 {t('accountant_dagen')}</option>
          <option value="60">60 {t('accountant_dagen')}</option>
          <option value="90">90 {t('accountant_dagen')}</option>
        </select>
        <button
          type="submit"
          disabled={bezig}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-lg transition mt-2"
        >
          {bezig ? `⏳ ${t('accountant_bezig')}` : t('accountant_form_knop')}
        </button>
      </form>

      {fout && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm">
          {fout}
        </div>
      )}

      {/* Lijst eigen tokens */}
      <div>
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
          {t('accountant_lijst_titel')} ({tokens.length})
        </h4>
        {laden ? (
          <p className="text-sm text-gray-500">{t('accountant_laden')}…</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-gray-500 italic">{t('accountant_leeg')}</p>
        ) : (
          <ul className="space-y-2">
            {tokens.map(tk => (
              <li
                key={tk.id}
                className={`bg-white rounded-lg border p-3 ${
                  tk.actief ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {tk.naam || t('accountant_default_naam')}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {tk.ingetrokken_op
                        ? `${t('accountant_ingetrokken')} ${formatTime(tk.ingetrokken_op)}`
                        : tk.verlopen
                          ? `${t('accountant_verlopen_op')} ${formatTime(tk.verloopt_op)}`
                          : `${t('accountant_geldig_tot')}: ${formatTime(tk.verloopt_op)}`
                      }
                    </div>
                    {tk.aantal_keer_gebruikt > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {tk.aantal_keer_gebruikt}× {t('accountant_gebruikt')}
                      </div>
                    )}
                  </div>
                  {tk.actief && (
                    <button
                      onClick={() => setVerwijderId(tk.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded px-2 py-1 transition flex-shrink-0"
                    >
                      {t('accountant_intrekken')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!verwijderId}
        onClose={() => !verwijderBezig && setVerwijderId(null)}
        onConfirm={bevestigVerwijder}
        title={t('accountant_intrek_titel')}
        message={t('accountant_intrek_bericht')}
        variant="destructive"
        busy={verwijderBezig}
      />
    </div>
  );
}
