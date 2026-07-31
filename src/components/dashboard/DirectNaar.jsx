/**
 * DirectNaar.jsx — "Direct naar" / "Beheer zelf" linkkaart (bank-concept).
 * Alle regels zijn échte functies: ingeplande opdrachten (recurring),
 * bevoegdheden (profiel), limieten (rekening-detail), afschrift- en
 * jaaroverzicht-download via het bestaande CSV-exportendpoint.
 */
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { maandAfschriftUrl, jaarOverzichtUrl } from './ActieCirkels';
import { Calendar, Users, Banknote, Download, Clipboard } from '../icons/Icons';

function Rij({ Icoon, label, onClick, href }) {
  const inhoud = (
    <>
      <span className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <Icoon className="w-4 h-4 text-brand-600" />
      </span>
      <span className="flex-1 text-sm font-medium text-ink-1 text-left">{label}</span>
      <span className="text-ink-3" aria-hidden="true">›</span>
    </>
  );
  const klasse = 'w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition focus:outline-none focus:bg-surface-2';
  if (href) return <a href={href} download className={klasse}>{inhoud}</a>;
  return <button type="button" onClick={onClick} className={klasse}>{inhoud}</button>;
}

export default function DirectNaar({ titel }) {
  const { t } = useTaal();
  const navigate = useNavigate();

  return (
    <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden animate-fade-up"
      aria-label={titel || t('direct_naar_titel')}>
      <div className="px-4 py-3 border-b border-border-subtle">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600">
          {titel || t('direct_naar_titel')}
        </h3>
      </div>
      <div className="divide-y divide-border-subtle">
        <Rij Icoon={Calendar} label={t('direct_ingeplande')}
          onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betalingen_gepland' }))} />
        <Rij Icoon={Users} label={t('direct_bevoegdheden')}
          onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'profiel' }))} />
        <Rij Icoon={Banknote} label={t('direct_daglimiet')}
          onClick={() => navigate('/app/rekening')} />
        <Rij Icoon={Download} label={t('direct_afschrift')} href={maandAfschriftUrl()} />
        <Rij Icoon={Clipboard} label={t('direct_jaaroverzicht')} href={jaarOverzichtUrl()} />
      </div>
    </section>
  );
}
