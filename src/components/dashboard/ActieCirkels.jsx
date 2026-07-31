/**
 * ActieCirkels.jsx — ronde snelknoppen bovenaan het Overzicht (bank-concept):
 * Overschrijven, Koersalert, Downloaden (maand-afschrift CSV).
 */
import { useTaal } from '../../i18n';
import { Send, Bell, Download } from '../icons/Icons';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function maandAfschriftUrl() {
  const nu = new Date();
  const eerste = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-01`;
  const vandaag = nu.toISOString().slice(0, 10);
  return `${API}/users/me/transacties-export.csv?vanaf=${eerste}&tot=${vandaag}`;
}

export function jaarOverzichtUrl() {
  const jaar = new Date().getFullYear();
  return `${API}/users/me/transacties-export.csv?vanaf=${jaar}-01-01&tot=${jaar}-12-31`;
}

function Cirkel({ Icoon, label, onClick, href }) {
  const inhoud = (
    <>
      <span className="w-12 h-12 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-soft transition group-active:scale-95">
        <Icoon className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="text-xs font-medium text-ink-2 leading-tight text-center">{label}</span>
    </>
  );
  const klasse = 'group flex flex-col items-center gap-1.5 w-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded-md py-1';
  if (href) return <a href={href} className={klasse} download>{inhoud}</a>;
  return <button type="button" onClick={onClick} className={klasse}>{inhoud}</button>;
}

export default function ActieCirkels() {
  const { t } = useTaal();
  return (
    <div className="flex gap-2 animate-fade-up" role="group" aria-label={t('overzicht_acties_aria')}>
      <Cirkel
        Icoon={Send}
        label={t('actie_overschrijven')}
        onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }))}
      />
      <Cirkel
        Icoon={Bell}
        label={t('actie_koersalert')}
        onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'alerts' }))}
      />
      <Cirkel Icoon={Download} label={t('actie_downloaden')} href={maandAfschriftUrl()} />
    </div>
  );
}
