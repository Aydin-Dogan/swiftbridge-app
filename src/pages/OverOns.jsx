import { Zap } from '../components/icons/Icons';

/**
 * Over ons — een geldapp zonder gezicht wekt geen vertrouwen. Deze pagina
 * vertelt eerlijk waarom SwiftBridge bestaat en wie erachter zit, zonder
 * verzonnen cijfers of claims. Bewust nog GEEN KvK-nummer: de B.V. is in
 * oprichting (geen fake registratiegegevens tot de notaris klaar is).
 */
export default function OverOns() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-8 h-8 text-brand-600" />
            <span className="font-bold text-xl text-brand-600">SwiftBridge</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Waarom wij SwiftBridge bouwen</h1>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Miljoenen mensen in Nederland sturen geld naar familie in het buitenland — naar Turkije,
              Centraal-Azië en daarbuiten. Vaak via wegen die duur, traag of onduidelijk zijn: hoge
              kosten, ongunstige koersen, en verborgen marges die je pas achteraf merkt.
            </p>
            <p>
              Wij vonden dat het beter kon. SwiftBridge is gebouwd op één belofte:
              <strong> geld naar huis sturen moet snel, eerlijk geprijsd en volledig transparant zijn</strong> —
              in uw eigen taal, vanaf uw telefoon, met de koers vóóraf zichtbaar. Geen verrassingen.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 pt-2">Waar wij voor staan</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Eerlijke prijs.</strong> Vaste, zichtbare kosten en een transparante wisselkoers — u ziet altijd precies wat de ontvanger krijgt.</li>
              <li><strong>Snelheid.</strong> Express-overboekingen doorgaans binnen 5 minuten, ook in het weekend.</li>
              <li><strong>Uw taal.</strong> De app en onze hulp werken in het Nederlands, Turks, Engels en meer.</li>
              <li><strong>Veiligheid op bankniveau.</strong> Sterke verificatie en versleuteling — lees hoe op onze <a href="/veiligheid" className="text-brand-600 underline">veiligheidspagina</a>.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 pt-2">Eerlijk over wat wij zijn</h2>
            <p>
              SwiftBridge is geen bank. De betaaldiensten worden geleverd via een door De Nederlandsche
              Bank gelicentieerde EMI-partner, waarvoor wij als agent optreden — conform PSD2 en de Wwft.
              Wij zeggen dit met opzet duidelijk: vertrouwen begint bij eerlijkheid over hoe het werkt.
            </p>

            <div className="bg-brand-50 border border-brand-200 rounded-xl p-5">
              <h3 className="font-semibold text-brand-900 mb-1">De onderneming</h3>
              <p className="text-sm text-brand-900">
                SwiftBridge B.V. is in oprichting. Zodra de inschrijving bij de Kamer van Koophandel
                is afgerond, vindt u hier onze KvK- en vestigingsgegevens. Tot die tijd bereikt u ons
                gewoon via <a href="mailto:info@swiftbridge.tr" className="underline">info@swiftbridge.tr</a>.
              </p>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 pt-2">Vragen?</h2>
            <p>
              We horen graag van u. Mail <a href="mailto:info@swiftbridge.tr" className="text-brand-600 underline">info@swiftbridge.tr</a>,
              of gebruik de chat rechtsonder — onze digitale assistent helpt u 24/7 in uw eigen taal,
              en schakelt u door naar een mens wanneer dat nodig is.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
