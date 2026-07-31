/**
 * Service.jsx — "Service"-tab (bank-concept): hulp en contact.
 * Wijst naar échte kanalen: de supportchat (knop rechtsonder in de app),
 * e-mail en de klachtenpagina.
 */
import { useTaal } from '../i18n';
import { MessageCircle, Mail, Clipboard } from '../components/icons/Icons';

export default function Service() {
  const { t } = useTaal();
  const rijen = [
    { Icoon: MessageCircle, titel: t('service_chat'), sub: t('service_chat_sub') },
    { Icoon: Mail, titel: t('service_email'), sub: 'support@swiftbridge.nl', href: 'mailto:support@swiftbridge.nl' },
    { Icoon: Clipboard, titel: t('service_klacht'), sub: t('service_klacht_sub'), href: '/klachten' },
  ];
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink-1">{t('service_titel')}</h1>
      <p className="text-sm text-ink-2 -mt-2">{t('service_uitleg')}</p>
      <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden divide-y divide-border-subtle">
        {rijen.map(({ Icoon, titel, sub, href }) => {
          const inhoud = (
            <>
              <span className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Icoon className="w-4 h-4 text-brand-600" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-ink-1">{titel}</span>
                <span className="block text-[11px] text-ink-3 mt-0.5">{sub}</span>
              </span>
              {href && <span className="text-ink-3" aria-hidden="true">›</span>}
            </>
          );
          const klasse = 'w-full flex items-center gap-3 px-4 py-3.5 transition';
          return href ? (
            <a key={titel} href={href} className={`${klasse} hover:bg-surface-2 focus:outline-none focus:bg-surface-2`}>{inhoud}</a>
          ) : (
            <div key={titel} className={klasse}>{inhoud}</div>
          );
        })}
      </section>
    </div>
  );
}
