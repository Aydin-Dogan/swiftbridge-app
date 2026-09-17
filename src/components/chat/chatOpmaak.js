/**
 * chatOpmaak — parser en allowlist voor AI-antwoorden in de support-chat
 * (weergave: OpgemaakteTekst.jsx).
 *
 * De assistent geeft stap-voor-stap-instructies met genummerde regels en
 * vetgedrukte knopnamen (**Betalingen**), plus optioneel actie-tokens
 * [[ga:betalingen]] voor een "Ga naar"-knop. Bewust GEEN markdown-bibliotheek
 * en geen dangerouslySetInnerHTML: we herkennen alleen deze drie vormen en
 * renderen alles als React-tekst. Onbekende actie-doelen worden genegeerd
 * (allowlist hieronder) — de AI kan dus nooit een willekeurige link maken.
 */

// Doel → i18n-label + hoe we er komen. 'tab' = interne AppShell-navigatie
// (event 'swiftbridge_navigate'), 'route' = aparte pagina.
export const CHAT_DOELEN = {
  overzicht: { label: 'zijbalk_overzicht', tab: 'dashboard' },
  inzicht: { label: 'zijbalk_inzicht', tab: 'inzicht' },
  overmaken: { label: 'tab_overmaken', tab: 'betaling' },
  overschrijven: { label: 'actie_overschrijven', tab: 'overschrijven' },
  betaalverzoek: { label: 'zijbalk_betaalverzoek', tab: 'betaalverzoek' },
  verzendlijst: { label: 'zijbalk_verzendlijst', tab: 'verzendlijst' },
  betalingen: { label: 'zijbalk_betalingen', tab: 'betalingen' },
  ingepland: { label: 'direct_ingeplande', tab: 'betalingen_gepland' },
  service: { label: 'zijbalk_service', tab: 'service' },
  documenten: { label: 'zijbalk_documenten', tab: 'documenten' },
  hulpmiddelen: { label: 'zijbalk_hulpmiddelen', tab: 'alerts' },
  profiel: { label: 'tab_profiel', tab: 'profiel' },
  verificatie: { label: 'tab_verificatie', tab: 'kyc' },
  limieten: { label: 'direct_daglimiet', route: '/app/rekening' },
  zakelijk: { label: 'kyb_direct_rij', route: '/app/zakelijk-aanvraag' },
};

const ACTIE_RE = /\[\[ga:([a-z_]+)\]\]/g;

/** Haalt de actie-tokens uit de tekst: { tekst, acties: ['betalingen', ...] }. */
export function splitsActies(invoer) {
  const acties = [];
  const tekst = String(invoer || '')
    .replace(ACTIE_RE, (_m, doel) => {
      if (CHAT_DOELEN[doel] && !acties.includes(doel)) acties.push(doel);
      return '';
    })
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { tekst, acties: acties.slice(0, 3) };
}

/** Deelt tekst op in blokken: alinea's, genummerde lijsten en opsommingen. */
export function parseBlokken(tekst) {
  const blokken = [];
  for (const regel of String(tekst || '').split(/\r?\n/)) {
    const schoon = regel.trim();
    if (!schoon) { blokken.push({ type: 'leeg' }); continue; }
    const genummerd = schoon.match(/^(\d{1,2})[.)]\s+(.*)$/);
    const punt = schoon.match(/^[-•*]\s+(.*)$/);
    const laatste = blokken[blokken.length - 1];
    if (genummerd) {
      const item = { nr: Number(genummerd[1]), tekst: genummerd[2] };
      if (laatste?.type === 'ol') laatste.items.push(item);
      else blokken.push({ type: 'ol', items: [item] });
    } else if (punt) {
      if (laatste?.type === 'ul') laatste.items.push(punt[1]);
      else blokken.push({ type: 'ul', items: [punt[1]] });
    } else if (laatste?.type === 'p') {
      laatste.regels.push(schoon);
    } else {
      blokken.push({ type: 'p', regels: [schoon] });
    }
  }
  return blokken.filter((b) => b.type !== 'leeg');
}
