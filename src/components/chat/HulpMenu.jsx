/**
 * HulpMenu — genummerd onderwerpenmenu voor INGELOGDE klanten (verzoek Aydin 17-9).
 *
 * Twee niveaus: eerst een onderwerp (1 Mijn overboekingen, 2 Geld versturen,
 * 3 Jaaroverzicht en documenten, ...), daarna de vragen binnen dat onderwerp.
 * Een gekozen vraag gaat als gewoon klantbericht naar de AI-assistent, die met
 * het rekening-overzicht van de klant en de app-kaart stap-voor-stap antwoordt.
 *
 * Wordt gebruikt in de chat (SupportChat) en op de Service-pagina. Daar opent
 * een klik de chat via het event 'swiftbridge_chat_vraag'.
 */
import { useState } from 'react';
import { Send, Clipboard, Lightbulb, Lock, IdCard, Clock } from '../icons/Icons';

const HULP_ONDERWERPEN = [
  { id: 'overboekingen', titel: 'hulp_cat_overboekingen', Icoon: Clock,
    vragen: ['hulp_v_waar_blijft', 'hulp_v_bon', 'hulp_v_ingepland'] },
  { id: 'versturen', titel: 'hulp_cat_versturen', Icoon: Send,
    vragen: ['hulp_v_overmaken', 'hulp_v_ontvanger', 'hulp_v_weeklimiet'] },
  { id: 'documenten', titel: 'hulp_cat_documenten', Icoon: Clipboard,
    vragen: ['hulp_v_jaaroverzicht', 'hulp_v_afschrift', 'hulp_v_gegevens'] },
  { id: 'hulpmiddelen', titel: 'hulp_cat_hulpmiddelen', Icoon: Lightbulb,
    vragen: ['hulp_v_koersalert', 'hulp_v_betaalverzoek', 'hulp_v_personaliseer'] },
  { id: 'beveiliging', titel: 'hulp_cat_beveiliging', Icoon: Lock,
    vragen: ['hulp_v_biometrie', 'hulp_v_2fa', 'hulp_v_toegangscode'] },
  { id: 'verificatie', titel: 'hulp_cat_verificatie', Icoon: IdCard,
    vragen: ['hulp_v_niet_versturen', 'hulp_v_kyc', 'hulp_v_zakelijk'] },
];

export default function HulpMenu({ t, onVraag, variant = 'chat' }) {
  const [gekozen, setGekozen] = useState(null);
  const onderwerp = HULP_ONDERWERPEN.find((o) => o.id === gekozen);
  const isPagina = variant === 'pagina';

  const knopKlasse = isPagina
    ? 'w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition focus:outline-none focus:bg-surface-2'
    : 'w-full text-left text-sm bg-white hover:bg-brand-50 border border-gray-200 hover:border-brand-300 text-gray-700 hover:text-brand-700 rounded-xl px-3 py-2.5 transition flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300';
  const lijstKlasse = isPagina
    ? 'rounded-md border border-border bg-surface shadow-soft overflow-hidden divide-y divide-border-subtle'
    : 'flex flex-col gap-1.5';

  return (
    <div className={isPagina ? '' : 'px-1 pt-2 pb-1'}>
      <div className="flex items-center justify-between mb-2 px-1">
        <p className={isPagina
          ? 'text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600'
          : 'text-[11px] uppercase tracking-wider text-gray-400 font-semibold'}>
          {onderwerp ? t(onderwerp.titel) : t('hulp_menu_titel')}
        </p>
        {onderwerp && (
          <button type="button" onClick={() => setGekozen(null)}
            className="text-xs font-semibold text-brand-700 hover:underline underline-offset-4 min-h-[32px] px-1">
            {t('hulp_menu_terug')}
          </button>
        )}
      </div>

      {!onderwerp ? (
        <div className={lijstKlasse}>
          {HULP_ONDERWERPEN.map((o, i) => (
            <button key={o.id} type="button" onClick={() => setGekozen(o.id)} className={knopKlasse}>
              <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">
                {i + 1}
              </span>
              <o.Icoon className="w-4 h-4 text-brand-600 flex-shrink-0" aria-hidden="true" />
              <span className={`flex-1 ${isPagina ? 'text-sm font-semibold text-ink-1' : ''}`}>{t(o.titel)}</span>
              <span className="text-gray-300" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      ) : (
        <div className={lijstKlasse}>
          {onderwerp.vragen.map((sleutel) => (
            <button key={sleutel} type="button" onClick={() => onVraag(t(sleutel))} className={knopKlasse}>
              <span className={`flex-1 ${isPagina ? 'text-sm text-ink-1' : ''}`}>{t(sleutel)}</span>
              <span className="text-gray-300" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
