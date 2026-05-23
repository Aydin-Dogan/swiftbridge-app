/**
 * SEO landing: /wise-vs-swiftbridge
 * Target query: "wise vs swiftbridge", "swiftbridge of wise", comparison
 */
import SeoLanding from './SeoLanding';

export default function WiseVsSwiftbridge() {
  return (
    <SeoLanding
      title="Wise vs SwiftBridge — eerlijke vergelijking"
      description="Wise of SwiftBridge voor geld naar Türkiye? Eerlijke vergelijking: tarieven, snelheid, ondersteunde banken, klantenservice. Bekijk concrete cijfers voor €100/€500/€1.000."
      canonicalPath="/wise-vs-swiftbridge"
      heroEyebrow="Eerlijke vergelijking"
      heroSubtitel="Geen marketing-spin — concrete cijfers op €100, €500 en €1.000. Bepaal zelf welke beter past bij jouw situatie."
      voorbeeldBedrag={500}
      cta="Bereken jouw transfer"
      bullets={['Tarief-tabel per bedrag', 'Snelheid vergeleken', '100+ TR-banken']}
      content={
        <>
          <p>
            Beide diensten zijn legitiem en veilig. De vraag is niet welke beter is, maar
            welke beter past bij jouw use-case. Hier de feitelijke vergelijking voor
            EUR → TRY transfers vanuit Nederland.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Tarief vergelijking op 3 bedragen</h2>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="text-left p-3 border border-gray-200">Bedrag</th>
                  <th className="text-right p-3 border border-gray-200">SwiftBridge fee</th>
                  <th className="text-right p-3 border border-gray-200">Wise fee</th>
                  <th className="text-right p-3 border border-gray-200">Verschil</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200 font-semibold">€100</td>
                  <td className="p-3 border border-gray-200 text-right">€2,00 (2,0%)</td>
                  <td className="p-3 border border-gray-200 text-right">~€1,30</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-600">+€0,70</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-semibold">€500</td>
                  <td className="p-3 border border-gray-200 text-right">€7,50 (1,5%)</td>
                  <td className="p-3 border border-gray-200 text-right">~€4,38</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-600">+€3,12</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-semibold">€1.000</td>
                  <td className="p-3 border border-gray-200 text-right">€12,00 (1,2%)</td>
                  <td className="p-3 border border-gray-200 text-right">~€7,80</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-600">+€4,20</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-semibold">€2.500</td>
                  <td className="p-3 border border-gray-200 text-right">€25 (1,0%)</td>
                  <td className="p-3 border border-gray-200 text-right">~€18,50</td>
                  <td className="p-3 border border-gray-200 text-right text-gray-600">+€6,50</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Wise-tarieven schatting op basis van openbare pricing en mid-market kurs. Exacte
            cijfers wisselen — check actuele tarieven op wise.com vóór beslissing.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Snelheid vergeleken</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
            <li><strong>SwiftBridge iDEAL Express:</strong> doorgaans &lt;5 minuten op TR-rekening</li>
            <li><strong>SwiftBridge SEPA Economy:</strong> 1-2 werkdagen, goedkoper tarief</li>
            <li><strong>Wise:</strong> 1-2 dagen voor TRY in de meeste gevallen (afhankelijk van betaalmethode)</li>
            <li><strong>Wise instant via debitcard:</strong> minuten, hoger tarief (~2,5% extra)</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Verschillen die je écht voelt</h2>

          <div className="space-y-4 my-6">
            <div className="bg-success-50 border border-success-100 rounded-xl p-4">
              <p className="font-semibold text-success-900 mb-1">✓ SwiftBridge sterke punten</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Native iDEAL → directe overboeking, &lt;5 min op TR-bank</li>
                <li>Nederlandstalige support die Turkse banken kent</li>
                <li>Tariefkaart volledig zichtbaar vooraf (geen verrassingen)</li>
                <li>App gebouwd voor diaspora — Turkse feestdagen-kalender ingebouwd</li>
              </ul>
            </div>

            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
              <p className="font-semibold text-brand-900 mb-1">✓ Wise sterke punten</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Mid-market rate zonder marge (transparant 100%)</li>
                <li>Multi-currency wallet — handig voor reizen</li>
                <li>1.000+ valuta&apos;s ondersteund</li>
                <li>Lagere prijs op grote bedragen (€1.000+) als snelheid niet kritiek is</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Onze eerlijke aanbeveling</h2>
          <p>
            <strong>Kies Wise als:</strong> je &lt;€100 of &gt;€2.500 stuurt EN snelheid
            niet kritiek is, of je multi-currency wallet nodig hebt.
          </p>
          <p>
            <strong>Kies SwiftBridge als:</strong> je tussen €100-€2.500 stuurt naar
            Türkiye, snelheid belangrijk is, of je Nederlandse klantenservice wilt.
          </p>
          <p>
            <strong>Pro tip:</strong> probeer beide één keer. De €2-€4 prijsverschil bij
            één test-transactie is verwaarloosbaar — de praktische ervaring zal de
            volgende keuze maken.
          </p>
        </>
      }
      faq={[
        {
          vraag: 'Welke is veiliger, Wise of SwiftBridge?',
          antwoord: 'Beide zijn gelicentieerd en veilig. Wise heeft eigen FCA/EMI-licentie in UK + EU. SwiftBridge werkt onder DNB-toezicht via EMI-partner. Verschil in praktijk: nihil voor klant.',
        },
        {
          vraag: 'Kan ik dezelfde ontvanger bij beide gebruiken?',
          antwoord: 'Ja. Beide gebruiken Turkse IBANs (TR + 24 cijfers). Je kan dezelfde ontvanger-gegevens hergebruiken.',
        },
      ]}
    />
  );
}
