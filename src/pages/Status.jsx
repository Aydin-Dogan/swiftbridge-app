/**
 * Status.jsx — publieke status page voor SwiftBridge.
 *
 * Toont live health van:
 *   - SwiftBridge API (backend /health)
 *   - SwiftBridge DB (backend /readyz — DB-roundtrip)
 *   - EUR→TRY koers-service (publieke wisselkoers-API)
 *
 * Filosofie:
 *   - Geen auth-vereist — bouwt vertrouwen tijdens incidenten.
 *   - Refresh elke 30s automatisch, knop voor handmatige refresh.
 *   - Groen/oranje/rood — kleurenblind-vriendelijk (icoon + tekst).
 *   - Toont last-checked + response-tijd per service.
 *   - Mollie/KYC zijn upstream-dependencies — niet zelf pingen
 *     omdat dat rate-limits triggert. Status volgt uit backend health.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTaal } from '../i18n';
import { API_URL } from '../services/api';

const REFRESH_INTERVAL_MS = 30_000;
const TIMEOUT_MS = 8000;

// Vriendelijke labels voor de breaker-keys uit /health/dependencies
const BREAKER_LABELS = {
  'fx-api-fetch':            { name: 'Wisselkoersen API',     desc: 'Live EUR-koers (open.er-api.com)' },
  'eu-sanctielijst-fetch':   { name: 'EU sanctielijst',        desc: 'Wwft Art. 33 screening (webgate.ec.europa.eu)' },
  'resend-email':            { name: 'E-mail verzending',      desc: 'Transactionele mails via Resend' },
  'mollie-payments-create':  { name: 'Mollie betaling starten', desc: 'iDEAL / Bancontact / Card initiatie' },
  'mollie-payments-get':     { name: 'Mollie betaling status',  desc: 'Status-polling fallback voor webhook' },
  'mollie-methods-list':     { name: 'Mollie methodes',         desc: 'Beschikbare betaalmethodes lijst' },
};

// Map breaker-state → Status-page status-key
function breakerToStatus(breaker) {
  if (!breaker) return 'checking';
  if (breaker.state === 'open') return 'down';
  if (breaker.state === 'half-open') return 'degraded';
  // closed maar success rate < 90% = degraded
  if (breaker.state === 'closed' && breaker.stats?.successRate < 90 && breaker.stats?.fires >= 5) {
    return 'degraded';
  }
  return 'up';
}

// Eén checker per dienst — returnt { status, responseMs, message }
async function checkUrl(url, options = {}) {
  const start = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      ...options,
    });
    const responseMs = Math.round(performance.now() - start);
    if (!res.ok) {
      return { status: 'down', responseMs, message: `HTTP ${res.status}` };
    }
    // Trage response is degraded maar nog up
    const status = responseMs > 3000 ? 'degraded' : 'up';
    return { status, responseMs };
  } catch (err) {
    const responseMs = Math.round(performance.now() - start);
    const message = err.name === 'AbortError' ? 'Timeout' : err.message;
    return { status: 'down', responseMs, message };
  } finally {
    clearTimeout(timer);
  }
}

const STATUS_META = {
  up: {
    color: 'bg-green-50 border-green-200 text-green-800',
    dot: 'bg-green-500',
    icon: 'CheckCircle',
  },
  degraded: {
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    dot: 'bg-amber-500',
    icon: 'AlertTriangle',
  },
  down: {
    color: 'bg-red-50 border-red-200 text-red-800',
    dot: 'bg-red-500',
    icon: 'XCircle',
  },
  checking: {
    color: 'bg-gray-50 border-gray-200 text-gray-600',
    dot: 'bg-gray-400 animate-pulse',
    icon: 'Clock',
  },
};

function StatusDot({ status }) {
  const meta = STATUS_META[status] || STATUS_META.checking;
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${meta.dot}`}
      aria-hidden="true"
    />
  );
}

function ServiceRow({ name, description, result }) {
  const { t } = useTaal();
  const status = result?.status ?? 'checking';
  const meta = STATUS_META[status];
  const label =
    status === 'up'
      ? t('status_label_up')
      : status === 'degraded'
        ? t('status_label_degraded')
        : status === 'down'
          ? t('status_label_down')
          : t('status_label_checking');

  return (
    <div className={`border rounded-xl p-4 sm:p-5 ${meta.color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <StatusDot status={status} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold">{label}</div>
          {result?.responseMs !== undefined && (
            <div className="text-xs text-gray-500 mt-0.5">
              {result.responseMs} ms
            </div>
          )}
        </div>
      </div>
      {result?.message && status !== 'up' && (
        <div className="mt-3 text-xs font-mono bg-white/60 rounded px-2 py-1 text-gray-700">
          {result.message}
        </div>
      )}
    </div>
  );
}

export default function Status() {
  const { t } = useTaal();
  const [results, setResults] = useState({
    api: null,
    database: null,
    rates: null,
  });
  // RES-6: per-dependency breakers + DB + jobQueue uit /health/dependencies
  const [deps, setDeps] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // FF: real-time SSE-stream voor breakers (geen polling-lag bij state changes)
  const [streamLive, setStreamLive] = useState(false);

  // Lichte checks die NIET via SSE komen (api, db, rates)
  const runChecks = useCallback(async () => {
    setRefreshing(true);
    const [api, database, rates] = await Promise.all([
      checkUrl(`${API_URL}/health`),
      checkUrl(`${API_URL}/readyz`),
      // Wise-public-api voor EUR→TRY — externe diversification, naast
      // onze eigen FX-API check (die zit in /health/dependencies).
      checkUrl('https://wise.com/rates/live?source=EUR&target=TRY', {
        mode: 'no-cors',
      }),
    ]);
    setResults({ api, database, rates });
    setLastCheckedAt(new Date());
    setRefreshing(false);
  }, []);

  // Fallback: één-shot fetch van /health/dependencies als SSE niet werkt
  const fetchDepsOnce = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/health/dependencies`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const json = await res.json();
      setDeps(json);
    } catch { /* stil — UI toont wat het had */ }
  }, []);

  useEffect(() => {
    document.title = `${t('status_page_title')} — SwiftBridge`;
    runChecks();
    const interval = setInterval(runChecks, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [runChecks, t]);

  // FF: SSE-stream voor breakers + jobQueue + DB-status
  useEffect(() => {
    // Detect EventSource support; sommige oudere browsers / privacy-mode hebben 'em niet
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      // Fallback: poll dependencies
      fetchDepsOnce();
      const i = setInterval(fetchDepsOnce, REFRESH_INTERVAL_MS);
      return () => clearInterval(i);
    }

    let es;
    let reconnectTimer;
    let reconnectAttempts = 0;
    let stopped = false;

    function connect() {
      if (stopped) return;
      try {
        es = new EventSource(`${API_URL}/health/dependencies/stream`);
      } catch (e) {
        // CSP / netwerk / cors — fallback polling
        fetchDepsOnce();
        return;
      }
      es.addEventListener('open', () => {
        reconnectAttempts = 0;
        setStreamLive(true);
      });
      function applySnapshot(ev) {
        try {
          const payload = JSON.parse(ev.data);
          // Update alleen het breakers-deel; DB/jobQueue komen nog uit polling
          setDeps((huidig) => {
            const basis = huidig || { status: 'up', checks: {} };
            return {
              ...basis,
              checks: { ...basis.checks, breakers: payload.breakers || {} },
              timestamp: payload.at,
              source: 'sse',
            };
          });
          setLastCheckedAt(new Date());
        } catch {/* malformed event */}
      }
      es.addEventListener('snapshot', applySnapshot);
      es.addEventListener('change', applySnapshot);

      es.addEventListener('error', () => {
        setStreamLive(false);
        // Auto-reconnect EventSource doet zelf — maar bij hard close moeten we
        // opnieuw connect. Backoff 2s, 4s, 8s, cap 30s.
        if (es.readyState === EventSource.CLOSED) {
          try { es.close(); } catch {}
          const wait = Math.min(30_000, 2_000 * 2 ** reconnectAttempts);
          reconnectAttempts++;
          reconnectTimer = setTimeout(connect, wait);
          // Fallback poll terwijl SSE-stream weg is
          fetchDepsOnce();
        }
      });
    }

    // Initiele depsRes via fetch zodat UI direct iets toont
    fetchDepsOnce();
    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { es?.close(); } catch {}
      setStreamLive(false);
    };
  }, [fetchDepsOnce]);

  // Overall status = slechtste van de individuele statussen
  const statuses = Object.values(results).map((r) => r?.status).filter(Boolean);
  const overall = statuses.includes('down')
    ? 'down'
    : statuses.includes('degraded')
      ? 'degraded'
      : statuses.length === 3
        ? 'up'
        : 'checking';

  const overallLabel = overall === 'up'
    ? t('status_overall_up')
    : overall === 'degraded'
      ? t('status_overall_degraded')
      : overall === 'down'
        ? t('status_overall_down')
        : t('status_overall_checking');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <Link to="/" className="text-blue-600 hover:underline">
            SwiftBridge
          </Link>
          <span className="text-gray-400 mx-2">/</span>
          <span className="text-gray-700">{t('status_breadcrumb')}</span>
        </nav>

        {/* Hero status */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            {t('status_page_title')}
          </h1>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            {t('status_page_intro')}
          </p>
          <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-full font-bold ${STATUS_META[overall].color} border`}>
            <StatusDot status={overall} />
            {overallLabel}
          </div>
        </div>

        {/* Kernservices */}
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Kernservices
        </h2>
        <div className="space-y-3 mb-8">
          <ServiceRow
            name={t('status_svc_api_name')}
            description={t('status_svc_api_desc')}
            result={results.api}
          />
          <ServiceRow
            name={t('status_svc_db_name')}
            description={t('status_svc_db_desc')}
            result={results.database}
          />
          <ServiceRow
            name={t('status_svc_rates_name')}
            description={t('status_svc_rates_desc')}
            result={results.rates}
          />
        </div>

        {/* RES-6: Externe afhankelijkheden met circuit-breaker state */}
        {deps?.checks?.breakers && Object.keys(deps.checks.breakers).length > 0 && (
          <>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Externe afhankelijkheden
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Live status van circuit breakers rond externe APIs.
              Bij meer dan 50% fouten in 60s opent de breaker en wordt verkeer
              tijdelijk omgeleid — voorkomt timeout-wait bij outage.
            </p>
            <div className="space-y-3 mb-8">
              {Object.entries(deps.checks.breakers).map(([key, breaker]) => {
                const label = BREAKER_LABELS[key] || { name: key, desc: '' };
                const status = breakerToStatus(breaker);
                const successRate = breaker.stats?.successRate ?? 100;
                const meta = STATUS_META[status];
                return (
                  <div key={key} className={`border rounded-xl p-4 sm:p-5 ${meta.color}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <StatusDot status={status} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-gray-900">{label.name}</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{label.desc}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold capitalize">{breaker.state}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {successRate}% succes
                        </div>
                      </div>
                    </div>
                    {breaker.stats?.fires > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-wider text-gray-500">
                        <div><span className="font-bold text-gray-700 text-sm block">{breaker.stats.successes}</span>OK</div>
                        <div><span className="font-bold text-gray-700 text-sm block">{breaker.stats.failures}</span>Fouten</div>
                        <div><span className="font-bold text-gray-700 text-sm block">{breaker.stats.timeouts}</span>Timeouts</div>
                        <div><span className="font-bold text-gray-700 text-sm block">{breaker.stats.rejects}</span>Geblokt</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Database + job queue als laatste 2 service-rows */}
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Interne infrastructuur
            </h2>
            <div className="space-y-3 mb-6">
              <div className={`border rounded-xl p-4 sm:p-5 ${STATUS_META[deps.checks.db?.state === 'up' ? 'up' : 'down'].color}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <StatusDot status={deps.checks.db?.state === 'up' ? 'up' : 'down'} />
                    <div>
                      <h3 className="font-bold text-base text-gray-900">Database</h3>
                      <p className="text-sm text-gray-600 mt-0.5">PostgreSQL via Neon — primaire opslag</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-right">
                    {deps.checks.db?.state === 'up' ? 'Werkt' : 'Probleem'}
                    <div className="text-xs text-gray-500 mt-0.5">{deps.checks.db?.type || '—'}</div>
                  </div>
                </div>
              </div>
              <div className={`border rounded-xl p-4 sm:p-5 ${STATUS_META[deps.checks.jobQueue?.state === 'up' ? 'up' : 'degraded'].color}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <StatusDot status={deps.checks.jobQueue?.state === 'up' ? 'up' : 'degraded'} />
                    <div>
                      <h3 className="font-bold text-base text-gray-900">Job queue</h3>
                      <p className="text-sm text-gray-600 mt-0.5">Async taken (e-mails, push, retentie)</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-right">
                    {deps.checks.jobQueue?.state === 'up' ? 'Werkt' : 'Probleem'}
                    <div className="text-xs text-gray-500 mt-0.5">{deps.checks.jobQueue?.mode || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Refresh + last-checked */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            {lastCheckedAt ? (
              <>
                {t('status_last_checked')}{' '}
                <time dateTime={lastCheckedAt.toISOString()}>
                  {lastCheckedAt.toLocaleTimeString()}
                </time>
                {' · '}
                {t('status_auto_refresh')}
              </>
            ) : (
              t('status_label_checking') + '...'
            )}
          </div>
          <button
            onClick={runChecks}
            disabled={refreshing}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={refreshing ? 'animate-spin' : ''}
              aria-hidden="true"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {t('status_refresh')}
          </button>
        </div>

        {/* Help section */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="font-bold text-lg text-gray-900 mb-2">
            {t('status_help_title')}
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            {t('status_help_desc')}
          </p>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-semibold text-gray-700">E-mail: </span>
              <a href="mailto:support@swiftbridge.tr" className="text-blue-600 hover:underline">
                support@swiftbridge.tr
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
