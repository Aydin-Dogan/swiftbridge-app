/**
 * Service.jsx — "Service"-tab (bank-concept): hulp en contact.
 *
 * Bovenaan (verzoek Aydin 17-9): genummerde hulponderwerpen. Een gekozen vraag
 * opent de support-chat en gaat naar de digitale assistent, die de rekening van
 * de klant kent en stap voor stap uitlegt waar je moet klikken.
 * Daaronder de échte kanalen: chat, e-mail en de klachtenpagina.
 */
import { useTaal } from '../i18n';
import { MessageCircle, Mail, Clipboard } from '../components/icons/Icons';
import HulpMenu from '../components/chat/HulpMenu';

// Zonder vraag opent dit alleen de chat.
function stelVraag(vraag) {
  window.dispatchEvent(new CustomEvent('swiftbridge_chat_vraag', { detail: { vraag } }));
}

export default function Service() {
  const { t } = useTaal();
  const rijen = [
    { Icoon: MessageCircle, titel: t('service_chat'), sub: t('service_chat_sub'), onClick: () => stelVraag(null) },
    { Icoon: Mail, titel: t('service_email'), sub: 'support@swiftbridge.nl', href: 'mailto:support@swiftbridge.nl' },
    { Icoon: Clipboard, titel: t('service_klacht'), sub: t('service_klacht_sub'), href: '/klachten' },
  ];
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink-1">{t('service_titel')}</h1>
      <p className="text-sm text-ink-2 -mt-2">{t('service_uitleg')}</p>

      <section aria-label={t('hulp_menu_titel')}>
        <HulpMenu t={t} onVraag={stelVraag} variant="pagina" />
        <p className="text-[11px] text-ink-3 mt-2 px-1">{t('hulp_pagina_uitleg')}</p>
      </section>

      <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden divide-y divide-border-subtle">
        {rijen.map(({ Icoon, titel, sub, href, onClick }) => {
          const inhoud = (
            <>
              <span className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Icoon className="w-4 h-4 text-brand-600" />
              </span>
              <span className="flex-1 min-w-0 text-left">
                <span className="block text-sm font-semibold text-ink-1">{titel}</span>
                <span className="block text-[11px] text-ink-3 mt-0.5">{sub}</span>
              </span>
              {(href || onClick) && <span className="text-ink-3" aria-hidden="true">›</span>}
            </>
          );
          const klasse = 'w-full flex items-center gap-3 px-4 py-3.5 transition';
          if (href) {
            return <a key={titel} href={href} className={`${klasse} hover:bg-surface-2 focus:outline-none focus:bg-surface-2`}>{inhoud}</a>;
          }
          return (
            <button key={titel} type="button" onClick={onClick} className={`${klasse} hover:bg-surface-2 focus:outline-none focus:bg-surface-2`}>
              {inhoud}
            </button>
          );
        })}
      </section>
    </div>
  );
}
