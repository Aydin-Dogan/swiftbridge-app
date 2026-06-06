/**
 * RecentTransacties.jsx — Lijst van de laatste 5 transacties
 *
 * - Tabel/lijst: ontvanger, bedrag EUR, ontvangen valuta, status badge, datum
 * - Status badges (groen/amber/rood) via .pill-* classes in index.css
 * - "Bekijk alle" link onderaan (navigeert naar betaling tab — later kan dit een
 * eigen historie pagina worden)
 * - Lege state: uitnodigende CTA "Begin je eerste overboeking" (a11y CTA behouden)
 * - Klik op rij → opent de bestaande TransactieReceipt modal
 * - Skeleton loaders tijdens laden
 */
import { useState } from 'react';
import TransactieReceipt from '../TransactieReceipt';
import { formatBedrag } from '../../services/currencies';
import { useTaal } from '../../i18n';
import { CheckCircle, Clock, XCircle, X as XIcon, Zap } from '../icons/Icons';

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
    voltooid: { pill: 'pill-success', Icoon: CheckCircle, label: t('status_voltooid') },
    in_behandeling: { pill: 'pill-warning', Icoon: Clock, label: t('status_in_behandeling') },
    wacht_op_betaling: { pill: 'pill-warning', Icoon: Clock, label: t('status_in_behandeling') },
    mislukt: { pill: 'pill-error', Icoon: XCircle, label: t('status_mislukt') },
    geannuleerd: { pill: 'pill-neutral', Icoon: XIcon, label: t('status_geannuleerd') },
  };
  const s = map[status] || map.in_behandeling;
  return (
    <span className={`inline-flex items-center gap-1 ${s.pill}`}>
      <s.Icoon className="w-3.5 h-3.5" />
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

  // Zoek + filter state (Verbetering NNN)
  // Toon zoekbalk pas vanaf 5 transacties (anders overbodig).
  const [zoekTerm, setZoekTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');

  const gefilterd = transacties.filter(tx => {
    if (statusFilter !== 'alle' && tx.status !== statusFilter) return false;
    if (zoekTerm) {
      const term = zoekTerm.toLowerCase().trim();
      const naam = (tx.ontvangerNaam || tx.ontvanger_naam || '').toLowerCase();
      const bedrag = String(tx.eurBedrag || '');
      if (!naam.includes(term) && !bedrag.includes(term)) return false;
    }
    return true;
  });

  const recent = [...gefilterd]
    .sort((a, b) => new Date(b.aangemaaktOp || b.datum || 0) - new Date(a.aangemaaktOp || a.datum || 0))
    .slice(0, 5);

  const toonFilter = transacties.length >= 5;

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
          {/* Bron — EUR circle (Wise-stijl met currency-code ipv vlag) */}
          <circle cx="25" cy="40" r="20" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
          <text x="25" y="46" textAnchor="middle" fontSize="14" fill="#2563eb" fontWeight="bold">EUR</text>
          {/* Pijl met euro */}
          <path d="M 50 40 L 105 40" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
          <polygon points="105,35 115,40 105,45" fill="#2563EB" />
          <circle cx="80" cy="40" r="14" fill="#fff" stroke="#2563EB" strokeWidth="2" />
          <text x="80" y="46" textAnchor="middle" fontSize="14" fill="#2563EB" fontWeight="bold">€</text>
          {/* Bestemming — TRY circle */}
          <circle cx="135" cy="40" r="20" fill="#fef2f2" stroke="#fecaca" strokeWidth="1.5" />
          <text x="135" y="46" textAnchor="middle" fontSize="14" fill="#dc2626" fontWeight="bold">TRY</text>
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
          <span aria-hidden="true"></span>
          {t('dashboard_recent_titel')}
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          {gefilterd.length}{gefilterd.length !== transacties.length && ` / ${transacties.length}`}
        </span>
      </div>

      {/* Zoek + filter (Verbetering NNN) — alleen vanaf 5 transacties */}
      {toonFilter && !laden && (
        <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex gap-2 items-center">
          <input
            type="search"
            value={zoekTerm}
            onChange={(e) => setZoekTerm(e.target.value)}
            placeholder={t('dashboard_recent_zoek_placeholder')}
            className="flex-1 text-xs border border-slate-200 bg-white rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label={t('dashboard_recent_zoek_aria')}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 bg-white rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label={t('dashboard_recent_status_aria')}
          >
            <option value="alle">{t('dashboard_recent_status_alle')}</option>
            <option value="voltooid">{t('status_voltooid')}</option>
            <option value="in_behandeling">{t('status_in_behandeling')}</option>
            <option value="mislukt">{t('status_mislukt')}</option>
          </select>
        </div>
      )}

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
                    {tx.status === 'voltooid' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                     tx.status === 'mislukt' ? <XCircle className="w-5 h-5 text-red-600" /> :
                     tx.status === 'geannuleerd' ? <XIcon className="w-5 h-5 text-slate-500" /> :
                     <Clock className="w-5 h-5 text-amber-600" />}
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
                  {/* EE++ ING-stijl financial semantics:
                      - EUR-bedrag = uitgaand (geld weg) → fg-minus met '−' prefix
                        bij voltooide tx. Bij andere statussen neutraal (geen
                        '−' want is nog niet weg).
                      - Ontvangen bedrag = wat ontvanger krijgt → fg-plus
                        (positieve framing voor de gebruiker). */}
                  <div className={`font-bold text-sm font-mono tabular-nums ${
                    tx.status === 'voltooid' ? 'text-fg-minus' : 'text-ink-1'
                  }`}>
                    {tx.status === 'voltooid' ? '−' : ''}{fmtEur(tx.eurBedrag)}
                  </div>
                  <div className="text-[11px] text-fg-plus font-semibold font-mono tabular-nums">
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
