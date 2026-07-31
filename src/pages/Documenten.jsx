/**
 * Documenten.jsx — "Meer → Documenten" (bank-concept).
 * Alle downloads op één plek, via bestaande endpoints:
 * maand-afschrift (CSV), jaaroverzicht (CSV), AVG-gegevensexport (JSON).
 * PDF-bonnen per overboeking zitten in de transactie-details.
 */
import { useTaal } from '../i18n';
import { maandAfschriftUrl, jaarOverzichtUrl } from '../components/dashboard/ActieCirkels';
import { Download, Clipboard, Shield, Info } from '../components/icons/Icons';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Rij({ Icoon, titel, sub, href }) {
  return (
    <a href={href} download
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition focus:outline-none focus:bg-surface-2">
      <span className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <Icoon className="w-4 h-4 text-brand-600" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-ink-1">{titel}</span>
        <span className="block text-[11px] text-ink-3 mt-0.5">{sub}</span>
      </span>
      <span className="text-ink-3" aria-hidden="true">›</span>
    </a>
  );
}

export default function Documenten() {
  const { t } = useTaal();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink-1">{t('documenten_titel')}</h1>
      <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden divide-y divide-border-subtle">
        <Rij Icoon={Download} titel={t('direct_afschrift')} sub={t('documenten_afschrift_sub')} href={maandAfschriftUrl()} />
        <Rij Icoon={Clipboard} titel={t('direct_jaaroverzicht')} sub={t('documenten_jaaroverzicht_sub')} href={jaarOverzichtUrl()} />
        <Rij Icoon={Shield} titel={t('documenten_avg')} sub={t('documenten_avg_sub')} href={`${API}/users/me/export`} />
      </section>
      <p className="flex items-start gap-2 text-xs text-ink-3 px-1">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        {t('documenten_bon_uitleg')}
      </p>
    </div>
  );
}
