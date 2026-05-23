/**
 * SEO landing: /garanti-overboeking
 * Target query: "garanti overboeking nederland", "garanti bbva geld ontvangen",
 *               "geld sturen naar garanti turkije"
 */
import SeoLanding from './SeoLanding';

export default function GarantiOverboeking() {
  return (
    <SeoLanding
      title="Geld overmaken naar Garanti BBVA in Türkiye"
      description="Stuur geld vanuit Nederland naar een Garanti BBVA rekening. Binnen 5 minuten op de Turkse rekening via iDEAL. Tarieven vanaf 0,8%. IBAN-validatie + Wwft compliance."
      canonicalPath="/garanti-overboeking"
      heroEyebrow="Garanti BBVA"
      heroSubtitel="Garanti is een van de grootste banken van Türkiye. Wij ondersteunen alle Garanti-rekeningen, zowel particulier als zakelijk."
      voorbeeldBedrag={500}
      cta="Bereken Garanti-transfer"
      bullets={['Particulier + zakelijk', 'IBAN-validatie ingebouwd', '<5 minuten levering']}
      content={
        <>
          <p>
            Garanti BBVA (officieel: Türkiye Garanti Bankası A.Ş.) is een van de drie
            grootste private banken in Türkiye, sinds 2015 onderdeel van de Spaanse
            BBVA-groep. Veel Nederlands-Turkse families hebben er een rekening — voor
            spaargeld, vakantiebudget of dagelijkse uitgaven in Türkiye.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Hoe stuur je geld naar Garanti?</h2>
          <p>
            Met SwiftBridge gaat het in vier stappen:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>
              <strong>Vraag het Garanti IBAN op</strong> bij de ontvanger. Een Garanti
              IBAN ziet er zo uit: <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">TR62 0006 2000 XXXX XXXX XXXX XX</code>
              (26 cijfers, beginnen met TR62 voor Garanti).
            </li>
            <li>
              <strong>Open SwiftBridge</strong> — voer het bedrag in (bv. €500) en kies
              de ontvanger&apos;s naam + IBAN. Onze software valideert automatisch of
              het een geldig Garanti IBAN is via de mod-97 checksum.
            </li>
            <li>
              <strong>Betaal met iDEAL</strong> — kies je Nederlandse bank, autoriseer
              de betaling. Doorgaans 30-60 seconden.
            </li>
            <li>
              <strong>Wacht 5 minuten</strong> — de ontvanger krijgt een SMS van
              Garanti dat het geld is binnengekomen. Wij sturen ook een WhatsApp/email
              bevestiging als je opt-in hebt aangezet.
            </li>
          </ol>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Wat kost het?</h2>
          <p>
            SwiftBridge gebruikt een staffel-tarief: hoe meer je stuurt, hoe lager het
            tarief. Voor Garanti-overboekingen via iDEAL:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>€10-200: 2,0% (€2-4 fee)</li>
            <li>€200-500: 1,5% (€7,50 op €500)</li>
            <li>€500-1.000: 1,2% (€12 op €1.000)</li>
            <li>€1.000-2.500: 1,0%</li>
            <li>€2.500+: 0,8%</li>
          </ul>
          <p>
            Garanti zelf rekent geen extra kosten voor inkomende EUR→TRY transfers vanuit
            de EU. De koers die we hanteren is de mid-market koers + ~1,2% verborgen
            marge (iDEAL Express).
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Zakelijke rekening (Garanti BBVA Ticari)</h2>
          <p>
            Stuur je geld naar je eigen Turkse onderneming of een leverancier? Werkt
            hetzelfde — alleen krijg je dan een Wwft-formulier omdat zakelijke
            transacties extra checks vereisen onder Art. 33 Wwft. Geen extra kosten,
            wel iets meer doorlooptijd bij de eerste overboeking.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Veelvoorkomende redenen om naar Garanti te sturen</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Spaargeld voor familielid in Türkiye</li>
            <li>Vakantiebudget — geld al klaar zetten vóór je vlucht</li>
            <li>Medische rekeningen voor familie (ziekenhuis, tandarts, medicijnen)</li>
            <li>Vastgoed-aankoop / huur (Garanti BBVA Konut Kredisi)</li>
            <li>Ondernemingskosten (Garanti BBVA Ticari)</li>
            <li>Bayram / Ramazan ondersteuning voor familie</li>
          </ul>
        </>
      }
      faq={[
        {
          vraag: 'Hoe vind ik het Garanti IBAN van mijn familielid?',
          antwoord: 'In Garanti BBVA Mobile (app), tab "Hesaplarım" → tik op de rekening → "IBAN Numaram". Of via Garanti BBVA Internet Bankacılığı online. De IBAN begint altijd met TR62 voor Garanti.',
        },
        {
          vraag: 'Werkt het ook voor Garanti BBVA Romania of andere internationale Garanti-banken?',
          antwoord: 'Alleen Garanti BBVA Türkiye (TR-IBAN). Andere landen vallen onder andere regelgeving en routes — neem contact op met support als je twijfelt.',
        },
        {
          vraag: 'Hoe weet de ontvanger dat het geld er is?',
          antwoord: 'Garanti stuurt automatisch een SMS-bevestiging zodra de transactie verwerkt is. SwiftBridge stuurt zelf ook een notificatie naar de zender + optioneel WhatsApp naar de ontvanger als je opt-in aanzet.',
        },
      ]}
    />
  );
}
