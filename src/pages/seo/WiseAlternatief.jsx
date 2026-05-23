/**
 * SEO landing: /wise-alternatief
 * Target query: "wise alternatief", "wise alternatief turkije", "goedkoop wise"
 */
import SeoLanding from './SeoLanding';

export default function WiseAlternatief() {
  return (
    <SeoLanding
      title="Wise alternatief voor geld naar Türkiye"
      description="Op zoek naar een Wise-alternatief voor EUR→TRY transfers? SwiftBridge: vanaf 0,8% per overboeking, binnen 5 minuten op de Turkse rekening. Vergelijking + tarieven."
      canonicalPath="/wise-alternatief"
      heroEyebrow="Alternatief"
      heroSubtitel="Voor de NL→TR corridor specifiek gebouwd: sneller op Turkse banken, eigen Nederlandstalige support, transparant staffel-tarief."
      voorbeeldBedrag={500}
      cta="Vergelijk tarieven nu"
      bullets={['<5 minuten via iDEAL', 'Vanaf 0,8% staffel', '100+ Turkse banken']}
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
            SwiftBridge is geoptimaliseerd voor één specifieke route: NL → Türkiye en
            Turkic landen (Azerbeidzjan, Kazachstan, Oezbekistan, Turkmenistan, Kirgizië,
            Tadzjikistan). Voor deze corridor bieden we:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
            <li>
              <strong>Snelheid:</strong> doorgaans &lt;5 minuten op de Turkse rekening via
              iDEAL Express. Wise duurt 1-2 dagen voor TRY in de meeste gevallen.
            </li>
            <li>
              <strong>Native ondersteuning</strong> voor alle grote Turkse banken
              (Garanti BBVA, Akbank, İş Bankası, Ziraat Bankası, Yapı Kredi en 100+ anderen).
            </li>
            <li>
              <strong>Nederlandstalige klantenservice</strong> die de Turkse banken kent —
              handig bij IBAN-vragen of vertraging-troubleshooting.
            </li>
            <li>
              <strong>Transparant staffel-tarief</strong> dat vooraf zichtbaar is — geen
              "live rate" die op laatste moment verandert.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Concrete vergelijking op €500</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 my-4">
            <p className="font-semibold text-gray-900 mb-2">€500 EUR → TRY:</p>
            <ul className="text-sm space-y-1 text-gray-700">
              <li><strong>SwiftBridge iDEAL Express:</strong> 1,5% = €7,50 fee · &lt;5 min</li>
              <li><strong>Wise:</strong> €4,38 fee + 0% FX-marge · 1-2 dagen</li>
              <li><strong>Verschil:</strong> SwiftBridge €3,12 duurder, ~24-48 uur sneller</li>
            </ul>
          </div>

          <p>
            Voor de meeste klanten in de Turks-Nederlandse diaspora wegen die 24-48 uur
            extra snelheid + Nederlandstalige support ruim op tegen de €3 prijsverschil.
            Zeker voor noodgevallen (ziekenhuiskosten, ondernemerskosten, familie-bijdrage
            voor Bayram).
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Voor wie is welk het best?</h2>
          <p>
            <strong>Wise:</strong> bezoek je een eenmalige cross-border transactie, ben je
            geduldig (1-2 dagen OK), of stuur je vaker naar verschillende landen.
          </p>
          <p>
            <strong>SwiftBridge:</strong> ben je Turks-Nederlands en stuur je regelmatig
            naar Türkiye? Heb je snelheid nodig (familie wacht, medische rekening, etc.)?
            Wil je Nederlandse klantenservice? Dan ben je hier op de goede plek.
          </p>
        </>
      }
      faq={[
        {
          vraag: 'Is SwiftBridge net zo veilig als Wise?',
          antwoord: 'Beide werken onder financiële toezicht: Wise heeft een eigen UK/EU-licentie, SwiftBridge werkt onder DNB-toezicht via EMI-partner. Beide volgen Wwft + AVG. Beide gebruiken 256-bit encryptie.',
        },
        {
          vraag: 'Kan ik mijn Wise-account met SwiftBridge gebruiken?',
          antwoord: 'Nee, separate accounts. Maar Wise EUR-saldo kan wel naar je NL-bank, en vanaf daar via iDEAL naar SwiftBridge.',
        },
        {
          vraag: 'Krijg ik dezelfde wisselkoers als bij Wise?',
          antwoord: 'Bijna. Wise gebruikt mid-market rate (0% marge). SwiftBridge gebruikt live ECB-koers met ~1,2% verborgen marge (express) of 0,5% (economy). Op €500 = €6-3 verschil in koers, plus onze 1,5% service fee.',
        },
      ]}
    />
  );
}
