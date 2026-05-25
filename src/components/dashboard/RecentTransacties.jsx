/**
 * RecentTransacties.jsx — Lijst van de laatste 5 transacties
 *
 * - Tabel/lijst: ontvanger, bedrag EUR, ontvangen valuta, status badge, datum
 * - Status badges (groen/amber/rood) via .pill-* classes in index.css
 * - "Bekijk alle" link onderaan (navigeert naar betaling tab — later kan dit een
 *   eigen historie pagina worden)
 * - Lege state: uitnodigende CTA "Begin je eerste overboeking" (a11y CTA behouden)
 * - Klik op rij → opent de bestaande TransactieReceipt modal
 * - Skeleton loaders tijdens laden
 */
import { useState } from 'react';
import TransactieReceipt from '../TransactieReceipt';
import { formatBedrag } from '../../services/currencies';
import { useTaal } from '../../i18n';

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function fmtOntvangen(tx) {
  if (tx?.valuta && tx?.ontvangenBedrag != null) {
    return formatBedrag(tx.ontvangenBedrag, tx.valuta);
  }
  // Legacy fallback voor TRY
  if (tx?.tryBedrag != null) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(tx.tryBedrag);
  }
  return '—';
}

function relatieveTijd(iso, t) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('zojuist') || 'zojuist';
  if (min < 60) return `${min} min`;
  const u = Math.floor(min / 60);
  if (u < 24) return `${u} u`;
  const d = Math.floor(u / 24);
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function StatusBadge({ status, t }) {
  const map = {
    voltooid:       { pill: 'pill-success', icoon: '✅', label: t('status_voltooid') },
    in_behandeling: { pill: 'pill-warning', icoon: '⏳', label: t('status_in_behandeling') },
    wacht_op_betaling: { pill: 'pill-warning', icoon: '⏳', label: t('status_in_behandeling') },
    mislukt:        { pill: 'pill-error',   icoon: '❌', label: t('status_mislukt') },
    geannuleerd:    { pill: 'pill-neutral', icoon: '🚫', label: t('status_geannuleerd') },
  };
  const s = map[status] || map.in_behandeling;
  return (
    <span className={`inline-flex items-center gap-1 ${s.pill}`}>
      <span aria-hidden="true">{s.icoon}</span>
      <span className="hidden sm:inline">{s.label}</span>
    </span>
  );
}

function RijSkeleton({ delay }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full animate-shimmer" />
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-md animate-shimmer" />
          <div className="h-3 w-16 rounded-md animate-shimmer" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 rounded-md animate-shimmer" />
        <div className="h-3 w-12 rounded-md animate-shimmer ml-auto" />
      </div>
    </div>
  );
}

export default function RecentTransacties({ transacties = [], laden = false }) {
  const { t } = useTaal();
  const [detailTx, setDetailTx] = useState(null);

  const recent = [...transacties]
    .sort((a, b) => new Date(b.aangemaaktOp || b.datum || 0) - new Date(a.aangemaaktOp || a.datum || 0))
    .slice(0, 5);

  // Lege state — rijke empty state met SVG-illustratie, 3-staps preview
  // en dubbele CTA (start meteen / bereken eerst).
  if (!laden && transacties.length === 0) {
    return (
      <section
        aria-label={t('dashboard_recent_titel')}
        className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-lg p-6 sm:p-8 text-center shadow-sm animate-fade-up"
      >
        {/* SVG illustratie — vriendelijke geld-stroom NL→TR */}
        <svg
          width="160"
          height="80"
          viewBox="0 0 160 80"
          fill="none"
          aria-hidden="true"
          className="mx-auto mb-4"
        >
          {/* NL flag circle */}
          <circle cx="25" cy="40" r="20" fill="#fef3c7" />
          <text x="25" y="46" textAnchor="middle" fontSize="20">🇳🇱</text>
          {/* Pijl met euro */}
          <path d="M 50 40 L 105 40" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
          <polygon points="105,35 115,40 105,45" fill="#2563EB" />
          <circle cx="80" cy="40" r="14" fill="#fff" stroke="#2563EB" strokeWidth="2" />
          <text x="80" y="46" textAnchor="middle" fontSize="14" fill="#2563EB" fontWeight="bold">€</text>
          {/* TR flag circle */}
          <circle cx="135" cy="40" r="20" fill="#fee2e2" />
          <text x="135" y="46" textAnchor="middle" fontSize="20">🇹🇷</text>
        </svg>

        <h3 className="font-bold text-slate-800 mb-1 text-lg">
          {t('dashboard_recent_leeg_titel')}
        </h3>
        <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
          {t('dashboard_recent_leeg_uitleg')}
        </p>

        {/* 3-stappen preview — verlaagt drempel */}
        <ol className="grid grid-cols-3 gap-2 max-w-sm mx-auto mb-6 text-xs">
          {[1, 2, 3].map((n) => (
            <li key={n} className="bg-slate-50 rounded-xl px-2 py-3">
              <div className="w-6 h-6 mx-auto mb-1.5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                {n}
              </div>
              <div className="text-slate-700 font-medium leading-tight">
                {t(`dashboard_recent_leeg_stap${n}`)}
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))}
            className="btn-primary inline-flex items-center justify-center gap-2 min-h-[44px]"
            aria-label={t('dashboard_recent_leeg_cta')}
          >
            <span>{t('dashboard_recent_leeg_cta')} →</span>
          </button>
          <a
            href="/calculator"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl px-5 py-3 transition inline-flex items-center justify-center min-h-[44px]"
          >
            {t('dashboard_recent_leeg_bereken')}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={t('dashboard_recent_titel')}
      className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-lg shadow-sm animate-fade-up overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-sm">
          <span aria-hidden="true">⚡ </span>
          {t('dashboard_recent_titel')}
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          {transacties.length}
        </span>
      </div>

      {laden ? (
        <div className="divide-y divide-slate-50">
          {[0, 1, 2].map(i => <RijSkeleton key={i} delay={i * 80} />)}
        </div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {recent.map((tx, i) => (
            <li key={tx.id || i}>
              <button
                onClick={() => setDetailTx(tx)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition text-left focus:outline-none focus:bg-slate-50"
                aria-label={`Transactie ${tx.ontvangerNaam || ''} ${fmtEur(tx.eurBedrag)}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
                      tx.status === 'voltooid'
                        ? 'bg-emerald-100'
                        : tx.status === 'mislukt' || tx.status === 'geannuleerd'
                          ? 'bg-rose-100'
                          : 'bg-amber-100'
                    }`}
                    aria-hidden="true"
                  >
                    {tx.status === 'voltooid' ? '✅' : tx.status === 'mislukt' ? '❌' : tx.status === 'geannuleerd' ? '🚫' : '⏳'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">
                      {tx.ontvangerNaam || tx.ontvanger_naam || '—'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusBadge status={tx.status} t={t} />
                      <span className="text-[11px] text-slate-400">
                        {relatieveTijd(tx.aangemaaktOp || tx.datum, t)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-slate-900 text-sm font-mono">
                    {fmtEur(tx.eurBedrag)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold font-mono">
                    {fmtOntvangen(tx)}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!laden && transacties.length > 5 && (
        <div className="border-t border-slate-100 px-4 py-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))}
            className="w-full text-center text-sm text-blue-600 font-semibold hover:underline focus:outline-none focus:underline"
          >
            {t('dashboard_recent_bekijk_alle')}
          </button>
        </div>
      )}

      <TransactieReceipt
        tx={detailTx}
        onSluit={() => setDetailTx(null)}
        onHerhaal={(tx) => {
          localStorage.setItem('swiftbridge_repeat_tx', JSON.stringify({
            ontvanger: tx.ontvangerNaam || tx.ontvanger_naam,
            iban: tx.ontvangerIBAN || tx.ontvanger_iban,
            bedrag: tx.eurBedrag || tx.eur_bedrag,
            valuta: tx.valuta || 'TRY',
          }));
          setDetailTx(null);
          window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }));
        }}
      />
    </section>
  );
}
