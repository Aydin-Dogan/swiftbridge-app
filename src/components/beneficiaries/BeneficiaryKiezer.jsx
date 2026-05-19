/**
 * BeneficiaryKiezer.jsx — Dropdown/picker voor in PaymentFlow
 * Toont een collapsible lijst met search; klik = roept onSelect callback aan
 * met de beneficiary data. Haalt zelf de lijst op via /beneficiaries.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTaal } from '../../i18n';
import { parseError } from '../../services/api';
import { maskeerIban } from './BeneficiaryKaart';
import { getValuta } from '../../services/currencies';
import Vlag from '../Vlag';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function leesCsrf() {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const match = document.cookie.match(/(?:^|;\s*)sb_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function BeneficiaryKiezer({ token, onSelect }) {
  const { t } = useTaal();
  const [open, setOpen] = useState(false);
  const [lijst, setLijst] = useState([]);
  const [laden, setLaden] = useState(false);
  const [fout, setFout] = useState('');
  const [zoek, setZoek] = useState('');

  async function laad() {
    setLaden(true);
    setFout('');
    try {
      const headers = {};
      const csrf = leesCsrf();
      if (csrf) headers['X-CSRF-Token'] = csrf;
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}/beneficiaries`, { credentials: 'include', headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFout(parseError({ ...data, status: res.status }, t));
        return;
      }
      const items = Array.isArray(data) ? data : (data.items || data.beneficiaries || []);
      const sorted = [...items].sort((a, b) => {
        const da = a.laatst_gebruikt_op ? new Date(a.laatst_gebruikt_op).getTime() : 0;
        const db = b.laatst_gebruikt_op ? new Date(b.laatst_gebruikt_op).getTime() : 0;
        return db - da;
      });
      setLijst(sorted);
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setLaden(false);
    }
  }

  useEffect(() => {
    if (open && lijst.length === 0 && !laden) laad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return lijst;
    return lijst.filter(b => {
      const n = (b.naam || '').toLowerCase();
      const bn = (b.bijnaam || b.label || '').toLowerCase();
      const i = (b.iban || '').toLowerCase();
      const bk = (b.bank || '').toLowerCase();
      return n.includes(q) || bn.includes(q) || i.includes(q) || bk.includes(q);
    });
  }, [lijst, zoek]);

  function kies(b) {
    setOpen(false);
    setZoek('');
    if (onSelect) onSelect(b);
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">👥</span>
          <span className="text-sm font-semibold text-gray-700">{t('benef_kies_bestaande')}</span>
        </span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="border-t border-white/20 p-3 space-y-2">
          {/* Search */}
          <input
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            placeholder={t('benef_zoek_placeholder')}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          {laden && (
            <p className="text-xs text-gray-500 text-center py-3">⏳ {t('laden')}</p>
          )}

          {!laden && fout && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1.5">
              ❌ {fout}
            </div>
          )}

          {!laden && !fout && lijst.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-3">{t('benef_kiezer_leeg')}</p>
          )}

          {!laden && !fout && lijst.length > 0 && gefilterd.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-3">{t('benef_geen_match')}</p>
          )}

          {!laden && gefilterd.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {gefilterd.map(b => {
                const valutaInfo = b.valuta ? getValuta(b.valuta) : null;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => kies(b)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-50 transition text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-base font-bold text-blue-700 flex-shrink-0">
                      {b.naam?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-800 text-sm truncate">{b.naam}</span>
                        {(b.bijnaam || b.label) && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                            {b.bijnaam || b.label}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono truncate">
                        {maskeerIban(b.iban || '')}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        {b.bank && <span className="truncate">🏦 {b.bank}</span>}
                        {valutaInfo && (
                          <span className="flex items-center gap-1">
                            <Vlag land={valutaInfo.landCode} size={10} />
                            {valutaInfo.code}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-blue-500 text-sm">→</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
