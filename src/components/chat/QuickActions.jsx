/**
 * QuickActions — pre-defined snelle vragen voor de support chat.
 *
 * Wordt bovenaan de message list getoond zolang de gebruiker nog niet
 * heeft getypt. Klikken op een knop stuurt:
 *  1. De vraagtekst als user-bericht
 *  2. Een mock support-antwoord (instant feedback, geen netwerkcall nodig)
 *
 * Props:
 *  - onKies(actie): callback met { vraag, antwoord, id }
 *  - t: vertaalfunctie van useTaal()
 */
export default function QuickActions({ onKies, t }) {
  const acties = [
    {
      id: 'kyc',
      icoon: '🪪',
      vraag: t('support_qa_kyc_vraag'),
      antwoord: t('support_qa_kyc_antwoord'),
    },
    {
      id: 'kosten',
      icoon: '💶',
      vraag: t('support_qa_kosten_vraag'),
      antwoord: t('support_qa_kosten_antwoord'),
    },
    {
      id: 'tx_status',
      icoon: '⏱️',
      vraag: t('support_qa_status_vraag'),
      antwoord: t('support_qa_status_antwoord'),
    },
  ];

  return (
    <div className="px-3 pt-3 pb-1">
      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1">
        {t('support_quick_actions_titel')}
      </p>
      <div className="flex flex-col gap-1.5">
        {acties.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onKies(a)}
            className="text-left text-sm bg-white hover:bg-blue-50 active:bg-blue-100 border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 rounded-xl px-3 py-2.5 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <span className="text-base" aria-hidden="true">{a.icoon}</span>
            <span className="flex-1">{a.vraag}</span>
            <span className="text-gray-300" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
