/**
 * LoginHistory.jsx — toont recente logins voor security-awareness.
 *
 * Verbetering JJ — user kan verdachte logins detecteren door:
 *   - Datum/tijd te checken
 *   - IP-prefix te vergelijken met thuislocatie (83.84.118.x = thuis)
 *   - Succes vs mislukt te zien
 *
 * Backend endpoint: GET /users/me/login-history (max 20 events).
 * IP wordt server-side gemaskeerd (laatste octet weg).
 */
import { useState, useEffect } from 'react';
import { apiFetch, parseError } from '../services/api';
import { useTaal } from '../i18n';

function ActieIcoon({ actie, succes }) {
  if (!succes) {
    return (
      <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
  }
  if (actie === 'logout') {
    return (
      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </span>
    );
  }
  return (
    <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('nl-NL', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function LoginHistory() {
  const { t } = useTaal();
  const [items, setItems] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');

  useEffect(() => {
    let geannuleerd = false;
    apiFetch('/users/me/login-history')
      .then(d => {
        if (!geannuleerd) setItems(d.history || []);
      })
      .catch(e => {
        if (!geannuleerd) setFout(parseError(e, t));
      })
      .finally(() => {
        if (!geannuleerd) setLaden(false);
      });
    return () => { geannuleerd = true; };
  }, [t]);

  const actieLabel = (actie) => {
    if (actie === 'login') return t('login_history_actie_login');
    if (actie === 'login_2fa') return t('login_history_actie_login_2fa');
    if (actie === 'login_mislukt') return t('login_history_actie_mislukt');
    if (actie === 'logout') return t('login_history_actie_logout');
    return actie;
  };

  return (
    <div className="card-glass p-5 animate-fade-up border-l-4 border-slate-400 space-y-3">
      <div>
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {t('login_history_titel')}
        </h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
          {t('login_history_uitleg')}
        </p>
      </div>

      {laden ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full animate-shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded animate-shimmer" />
                <div className="h-2.5 w-24 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : fout ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm">
          {fout}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-4 text-center">
          {t('login_history_leeg')}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <ActieIcoon actie={item.actie} succes={item.succes} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">
                  {actieLabel(item.actie)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTime(item.timestamp)} · IP {item.ipMasked}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
        {t('login_history_disclaimer')}
      </p>
    </div>
  );
}
