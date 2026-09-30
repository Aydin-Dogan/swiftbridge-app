/**
 * AdminErrors.jsx — viewer voor frontend-errors die via ErrorBoundary
 * naar /errors/frontend zijn gepost (Verbetering Z).
 *
 * Auth:
 * - Vereist ingelogde admin (cookie-based JWT)
 * - X-Admin-Secret header via ?secret= query (legacy pad)
 *
 * Filtering:
 * - ?errorId=ERR-XXXX (exact match)
 * - ?days=7 (default 7, max 90)
 *
 * UX:
 * - Tabel met error-ID, message, URL, time
 * - Klik op rij → toon details (stack + componentStack) inline
 * - Refresh-knop + copy-error-ID knop
 */
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import { useTaal } from '../i18n';
import { CheckCircle } from '../components/icons/Icons';

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('nl-NL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function truncate(s, max = 80) {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export default function AdminErrors() {
  const { t } = useTaal();
  const [params, setParams] = useSearchParams();
  const [errors, setErrors] = useState([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState('');
  const [openId, setOpenId] = useState(null);

  const secret = params.get('secret') || '';
  const errorId = params.get('errorId') || '';
  const days = Math.min(90, Math.max(1, parseInt(params.get('days')) || 7));

  const laad = useCallback(async () => {
    setLaden(true);
    setFout('');
    try {
      const q = new URLSearchParams();
      q.set('days', String(days));
      if (errorId) q.set('errorId', errorId);
      q.set('limit', '200');

      const res = await fetch(`${API_URL}/errors/frontend/list?${q.toString()}`, {
        credentials: 'include',
        headers: secret ? { 'X-Admin-Secret': secret } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error(t('admin_errors_geen_auth'));
        if (res.status === 403) throw new Error(t('admin_errors_geen_admin'));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setErrors(data.errors || []);
    } catch (e) {
      setFout(e.message);
    } finally {
      setLaden(false);
    }
  }, [secret, errorId, days, t]);

  useEffect(() => {
    laad();
  }, [laad]);

  useEffect(() => {
    document.title = `${t('admin_errors_titel')} — SwiftBridge`;
  }, [t]);

  function updateFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  async function copyId(id) {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      // silent
    }
  }

  return (
    <div className="min-h-screen bg-surface-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <nav className="text-sm mb-2">
              <Link to="/" className="text-brand-700 font-semibold hover:underline underline-offset-4">SwiftBridge</Link>
              <span className="text-gray-500 mx-2">/</span>
              <span className="text-gray-500">Admin</span>
              <span className="text-gray-500 mx-2">/</span>
              <span className="text-ink-2">Errors</span>
            </nav>
            <h1 className="font-display text-2xl font-medium text-ink-1">
              {t('admin_errors_titel')}
            </h1>
            <p className="text-sm text-ink-2 mt-1">
              {t('admin_errors_subtitel')}
            </p>
          </div>
          <button
            onClick={laad}
            disabled={laden}
            className="text-sm font-semibold text-brand-700 hover:text-brand-800 disabled:opacity-50 bg-brand-50 hover:bg-brand-100 rounded-md px-4 py-2 transition inline-flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={laden ? 'animate-spin' : ''} aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {t('admin_errors_refresh')}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-md border border-border p-4 mb-4 flex flex-col sm:flex-row gap-3 shadow-soft">
          <div className="flex-1">
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1">
              {t('admin_errors_filter_id')}
            </label>
            <input
              type="text"
              value={errorId}
              onChange={(e) => updateFilter('errorId', e.target.value.trim())}
              placeholder="ERR-XXXXXXX"
              className="w-full text-sm font-mono border border-border rounded-md px-3 py-2 bg-surface text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            />
          </div>
          <div className="sm:w-32">
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500 mb-1">
              {t('admin_errors_filter_days')}
            </label>
            <select
              value={days}
              onChange={(e) => updateFilter('days', e.target.value)}
              className="w-full text-sm border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 bg-surface text-ink-1"
            >
              <option value="1">1 dag</option>
              <option value="7">7 dagen</option>
              <option value="30">30 dagen</option>
              <option value="90">90 dagen</option>
            </select>
          </div>
        </div>

        {/* Status/error */}
        {fout && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-sm text-red-700">
            <strong>{t('admin_errors_fout')}:</strong> {fout}
            {fout === t('admin_errors_geen_admin') && (
              <p className="text-xs text-red-600 mt-1">
                {t('admin_errors_hint_secret')}
              </p>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-surface rounded-md border border-border overflow-hidden shadow-soft">
          {laden ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              {t('admin_errors_laden')}…
            </div>
          ) : errors.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-success-500" aria-hidden="true" />
              <h3 className="font-display font-medium text-ink-1 mb-1">{t('admin_errors_leeg_titel')}</h3>
              <p className="text-sm text-ink-2">{t('admin_errors_leeg_subtitel')}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-3 border-b border-border text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">{t('admin_errors_col_message')}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">URL</th>
                  <th className="text-right px-4 py-3 whitespace-nowrap">{t('admin_errors_col_time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {errors.map((err) => (
                  <Fragment key={err.id}>
                    <tr
                      className="hover:bg-surface-3 cursor-pointer"
                      onClick={() => setOpenId(openId === err.id ? null : err.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        <button
                          onClick={(e) => { e.stopPropagation(); copyId(err.error_id); }}
                          className="text-brand-700 hover:underline underline-offset-4"
                          title={t('admin_errors_copy_id')}
                        >
                          {err.error_id}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-ink-2 break-words max-w-md">
                        {truncate(err.message, 120)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell truncate max-w-xs">
                        {truncate(err.url, 60)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500 whitespace-nowrap tabular-nums">
                        {formatTime(err.ontvangen_op)}
                      </td>
                    </tr>
                    {openId === err.id && (
                      <tr className="bg-surface-3">
                        <td colSpan="4" className="px-4 py-4">
                          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">{t('admin_errors_col_url')}</dt>
                              <dd className="font-mono text-ink-1 break-all">{err.url || '—'}</dd>
                            </div>
                            <div>
                              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">{t('admin_errors_col_ua')}</dt>
                              <dd className="font-mono text-ink-1 break-words">{err.user_agent || '—'}</dd>
                            </div>
                            <div>
                              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">{t('admin_errors_col_user')}</dt>
                              <dd className="font-mono text-ink-1">{err.user_id || t('admin_errors_geen_user')}</dd>
                            </div>
                            <div>
                              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-gray-500 mb-1">{t('admin_errors_col_opgetreden')}</dt>
                              <dd className="font-mono text-ink-1">{formatTime(err.opgetreden_op)}</dd>
                            </div>
                          </dl>
                          <Link
                            to={`/admin/errors?errorId=${encodeURIComponent(err.error_id)}${secret ? `&secret=${encodeURIComponent(secret)}` : ''}`}
                            className="inline-block mt-3 text-xs font-semibold text-brand-700 hover:underline underline-offset-4"
                          >
                            {t('admin_errors_zoek_alle')} →
                          </Link>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          {t('admin_errors_count', { n: errors.length })}
        </p>
      </div>
    </div>
  );
}
