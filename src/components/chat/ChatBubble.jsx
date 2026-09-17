/**
 * ChatBubble — individuele bericht-bubbel voor de support chat widget.
 *
 * Toont gebruikers- en supportberichten met verschillende styling:
 *  - user: rechts uitgelijnd, blauwe gradient, witte tekst
 *  - support: links uitgelijnd, wit met grijze rand, donkere tekst, avatar bij eerste msg
 *  - system: gecentreerd, klein grijs (bv. "Bericht verzonden")
 *
 * Props:
 *  - bericht: { id, rol: 'user'|'support'|'system', tekst, timestamp, toonAvatar?: boolean }
 *  - onActie(doel): optioneel — toont "Ga naar"-knoppen voor [[ga:doel]]-tokens
 *  - t: vertaalfunctie (nodig voor de knoplabels)
 */
import { splitsActies, CHAT_DOELEN } from './chatOpmaak';
import { OpgemaakteTekst } from './OpgemaakteTekst';

export default function ChatBubble({ bericht, onActie, t }) {
  const { rol, tekst, timestamp, toonAvatar } = bericht;
  const tijd = formatteerTijd(timestamp);

  if (rol === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {tekst}
        </span>
      </div>
    );
  }

  if (rol === 'user') {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[80%] flex flex-col items-end">
          <div
            className="rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-snug text-white shadow-sm break-words whitespace-pre-wrap"
            style={{
              background: 'linear-gradient(135deg, #22416B 0%, #1B3252 100%)',
            }}
          >
            {tekst}
          </div>
          {tijd && (
            <span className="text-[10px] text-gray-400 mt-0.5 mr-1">{tijd}</span>
          )}
        </div>
      </div>
    );
  }

  // support — stap-voor-stap-opmaak + "Ga naar"-knoppen (alleen ingelogd, onActie gezet)
  const { tekst: schoneTekst, acties } = splitsActies(tekst);
  return (
    <div className="flex items-end gap-2 mb-2">
      {toonAvatar ? (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #1B3252 0%, #1A7F5E 100%)',
          }}
          aria-hidden="true"
        >
          SB
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" aria-hidden="true" />
      )}
      <div className="max-w-[85%] flex flex-col items-start">
        <div className="rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-snug text-gray-800 bg-white border border-gray-200 shadow-sm break-words">
          <OpgemaakteTekst tekst={schoneTekst} />
        </div>
        {onActie && acties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {acties.map((doel) => (
              <button key={doel} type="button" onClick={() => onActie(doel)}
                className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-full px-3 py-1.5 min-h-[32px] transition focus:outline-none focus:ring-2 focus:ring-brand-300">
                {t ? t('chat_ga_naar', { plek: t(CHAT_DOELEN[doel].label) }) : doel}
              </button>
            ))}
          </div>
        )}
        {tijd && (
          <span className="text-[10px] text-gray-400 mt-0.5 ml-1">{tijd}</span>
        )}
      </div>
    </div>
  );
}

function formatteerTijd(timestamp) {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
