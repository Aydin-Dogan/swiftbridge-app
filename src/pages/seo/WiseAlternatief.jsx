/**
 * SEO landing: /wise-alternatief
 * Target query: "wise alternatief", "wise alternatief turkije", "goedkoop wise"
 */
import SeoLanding from './SeoLanding';

export default function WiseAlternatief() {
  return (
    <SeoLanding
      title="Wise alternatief voor geld naar Türkiye"
      description="Op zoek naar een Wise-alternatief voor EUR→TRY transfers? SwiftBridge: €4,95 vast + transparante koersmarge. Vergelijking + tarieven."
      canonicalPath="/wise-alternatief"
      heroEyebrow="Alternatief"
      heroSubtitel="Voor de NL→TR corridor specifiek gebouwd: eigen Nederlandstalige support, transparante tariefkaart."
      voorbeeldBedrag={500}
      cta="Vergelijk tarieven nu"
      bullets={['Betalen met iDEAL', '€4,95 vast + transparante marge', 'Te beginnen met Turkije']}
      content={
        <>
          <p>
            Wise (vroeger TransferWise) is wereldwijd een goede keuze voor geldoverboekingen.
            Maar voor de specifieke EUR→TRY corridor — Nederland naar Türkiye — zijn er
            sterke alternatieven die op specifieke punten beter scoren. SwiftBridge is
            er één van.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Wanneer kies je Wise?</h2>
          <p>
            Wise excelleert in twee scenario&apos;s:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
            <li>Je stuurt naar veel verschillende landen (1.000+ valuta&apos;s ondersteund)</li>
            <li>Je hebt een Wise-account met EUR-saldo en stuurt onregelmatig</li>
            <li>Je vindt mid-market rate zonder marge het belangrijkst (Wise neemt geen FX-marge)</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Wanneer kies je SwiftBridge?</h2>
          <p>
            SwiftBridge is gebouwd voor één specifieke route: Nederland → Türkiye. Te
            beginnen met Turkije; andere landen volgen later. Voor deze corridor bieden we:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
            <li>
              <strong>Eerlijk over de levertijd:</strong> de precieze levertijd maken wij
              bekend zodra de uitbetaling in Turkije live is.
            </li>
            <li>
              <strong>Gebouwd voor Turkse rekeningen</strong>, zoals bij Garanti BBVA, Akbank,
              İş Bankası, Ziraat Bankası en Yapı Kredi, met automatische IBAN-controle.
            </li>
            <li>
              <strong>Nederlandstalige klantenservice</strong> die de Turkse banken kent —
              handig bij IBAN-vragen of vertraging-troubleshooting.
            </li>
            <li>
              <strong>Transparante tariefkaart</strong> (€4,95 vaste fee + koersmarge per
              ledenniveau) die vooraf zichtbaar is — geen
              "live rate" die op laatste moment verandert.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Concrete vergelijking op €500</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 my-4">
            <p className="font-semibold text-gray-900 mb-2">€500 EUR → TRY:</p>
            <ul className="text-sm space-y-1 text-gray-700">
              <li><strong>SwiftBridge iDEAL Express:</strong> €4,95 vast + 1,2% marge (Basis) = €10,95</li>
              <li><strong>Wise:</strong> €4,38 fee + 0% FX-marge · 1-2 dagen</li>
              <li><strong>Verschil:</strong> SwiftBridge ~€6,57 duurder</li>
            </ul>
          </div>

          <p>
            Voor veel klanten in de Turks-Nederlandse diaspora weegt persoonlijke support
            in de eigen taal op tegen het prijsverschil van ~€7.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Voor wie is welk het best?</h2>
          <p>
            <strong>Wise:</strong> doe je een eenmalige cross-border transactie, of stuur
            je vaker naar verschillende landen.
          </p>
          <p>
            <strong>SwiftBridge:</strong> ben je Turks-Nederlands en stuur je regelmatig
            naar Türkiye? Wil je Nederlandse klantenservice? Dan ben je hier op de goede
            plek.
          </p>
        </>
      }
      faq={[
        {
          vraag: 'Hoe verhoudt SwiftBridge zich tot Wise qua toezicht?',
          antwoord: 'Wise heeft een eigen UK/EU-licentie. SwiftBridge is geen bank en heeft geen eigen DNB-vergunning. Wij gaan optreden als agent van een vergunninghoudende EMI-partner; de inschrijving als agent volgt zodra die samenwerking rond is. SwiftBridge gebruikt 256-bit encryptie en verificatie in twee stappen.',
        },
        {
          vraag: 'Kan ik mijn Wise-account met SwiftBridge gebruiken?',
          antwoord: 'Nee, separate accounts. Maar Wise EUR-saldo kan wel naar je NL-bank, en vanaf daar via iDEAL naar SwiftBridge.',
        },
        {
          vraag: 'Krijg ik dezelfde wisselkoers als bij Wise?',
          antwoord: 'Bijna. Wise gebruikt de mid-market rate (0% marge). SwiftBridge gebruikt de live ECB-koers met een transparant getoonde koersmarge: 1,2% op Basis, aflopend tot 0,6% op Black. Je ziet de marge, de vaste fee van €4,95 en de exacte uitkomst vóór je bevestigt.',
        },
      ]}
    />
  );
}
