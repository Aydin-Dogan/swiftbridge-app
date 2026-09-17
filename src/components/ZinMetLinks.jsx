/**
 * ZinMetLinks.jsx — toont een vertaalde zin waarin documentnamen klikbaar zijn.
 *
 * Voorbeeld: tekst "Op je overboeking zijn de Voorwaarden Betaaldiensten van
 * toepassing." met links [{ label: 'Voorwaarden Betaaldiensten', to: '/voorwaarden/betaaldiensten' }]
 * maakt alleen de documentnaam klikbaar. Staat een label niet letterlijk in de
 * zin (bijv. door een naamval in een andere taal), dan komt de link achter de
 * zin, zodat de verwijzing nooit verdwijnt.
 *
 * Links openen in een nieuw tabblad: de klant raakt zijn invoer niet kwijt.
 *
 * Props: tekst (string), links ([{ label, to }]), linkClassName (string)
 */
export default function ZinMetLinks({ tekst = '', links = [], linkClassName = '' }) {
  const treffers = [];
  const achteraan = [];

  for (const link of links) {
    if (!link?.label || !link?.to) continue;
    const start = tekst.indexOf(link.label);
    const eind = start + link.label.length;
    const overlapt = treffers.some((tr) => start < tr.eind && eind > tr.start);
    if (start === -1 || overlapt) achteraan.push(link);
    else treffers.push({ ...link, start, eind });
  }
  treffers.sort((a, b) => a.start - b.start);

  const maakLink = (link, sleutel, label) => (
    <a key={sleutel} href={link.to} target="_blank" rel="noopener noreferrer" className={linkClassName}>
      {label}
    </a>
  );

  const delen = [];
  let positie = 0;
  treffers.forEach((tr, i) => {
    if (tr.start > positie) delen.push(tekst.slice(positie, tr.start));
    delen.push(maakLink(tr, `zin-${i}`, tekst.slice(tr.start, tr.eind)));
    positie = tr.eind;
  });
  if (positie < tekst.length) delen.push(tekst.slice(positie));
  achteraan.forEach((link, i) => {
    delen.push(' ');
    delen.push(maakLink(link, `los-${i}`, link.label));
  });

  return <>{delen}</>;
}
