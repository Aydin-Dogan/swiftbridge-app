export default function AlgemeneVoorwaarden() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚡</span>
            <span className="font-bold text-xl text-blue-600">SwiftBridge</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Algemene Voorwaarden</h1>
          <p className="text-sm text-gray-500 mb-8">Versie 1.0 — Datum: mei 2026</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
            <strong>Let op:</strong> SwiftBridge is momenteel in bèta en biedt uitsluitend demonstratie- en testdiensten aan. Bij commerciële livegang worden betaaldiensten geleverd via een gelicentieerde EMI- of PSP-partner onder DNB-toezicht (agent-model). SwiftBridge B.V. heeft op dit moment geen eigen vergunning van De Nederlandsche Bank.
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 1 — Definities</h2>
              <p className="mb-3">In deze Algemene Voorwaarden wordt verstaan onder:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>SwiftBridge:</strong> SwiftBridge B.V., gevestigd in Nederland, ingeschreven bij de Kamer van Koophandel.</li>
                <li><strong>Gebruiker:</strong> elke natuurlijke persoon van 18 jaar of ouder die een account aanmaakt en gebruikmaakt van de diensten van SwiftBridge.</li>
                <li><strong>Dienst:</strong> het online platform van SwiftBridge voor het overmaken van geld van Nederland naar Turkije.</li>
                <li><strong>Transactie:</strong> elke door de Gebruiker geïnitieerde overboeking van euro's (EUR) naar Turkse lira (TRY).</li>
                <li><strong>KYC:</strong> Know Your Customer — identiteitsverificatieprocedure verplicht op grond van de Wet ter voorkoming van witwassen en financieren van terrorisme (Wwft).</li>
                <li><strong>Platform:</strong> de website en mobiele applicatie van SwiftBridge.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 2 — Toepasselijkheid</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Deze Algemene Voorwaarden zijn van toepassing op alle overeenkomsten tussen SwiftBridge en de Gebruiker.</li>
                <li>Door een account aan te maken en/of gebruik te maken van de Dienst, aanvaardt de Gebruiker deze voorwaarden volledig.</li>
                <li>SwiftBridge behoudt zich het recht voor deze voorwaarden te wijzigen. Wijzigingen worden minimaal 30 dagen van tevoren aangekondigd via e-mail.</li>
                <li>De meest actuele versie is altijd beschikbaar op het Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 3 — De Dienst</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>SwiftBridge biedt een platform aan voor internationale geldoverdracht van EUR naar TRY.</li>
                <li>De Dienst is uitsluitend beschikbaar voor personen woonachtig in Nederland met een geldige bankrekening.</li>
                <li>Ontvangers dienen te beschikken over een geldige bankrekening in Turkije.</li>
                <li>SwiftBridge streeft naar een verwerkingstijd van minder dan 5 minuten, maar garandeert dit niet bij technische storingen, bankproblemen of overmacht.</li>
                <li>SwiftBridge heeft het recht de Dienst tijdelijk te onderbreken voor onderhoud. Dit wordt zo veel mogelijk vooraf gecommuniceerd.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 4 — Registratie en Account</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>De Gebruiker dient minimaal 18 jaar oud te zijn.</li>
                <li>Bij registratie verstrekt de Gebruiker correcte, actuele en volledige informatie.</li>
                <li>Elk account is strikt persoonlijk en mag niet worden overgedragen aan derden.</li>
                <li>De Gebruiker is verantwoordelijk voor alle activiteiten die plaatsvinden onder zijn/haar account.</li>
                <li>Bij vermoed misbruik of ongeautoriseerde toegang dient de Gebruiker SwiftBridge onmiddellijk te informeren via support@swiftbridge.tr.</li>
                <li>SwiftBridge mag een account opschorten of beëindigen bij schending van deze voorwaarden.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 5 — KYC-verificatie</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Op grond van de Wwft is SwiftBridge wettelijk verplicht de identiteit van alle Gebruikers te verifiëren vóórdat transacties worden verwerkt.</li>
                <li>De Gebruiker dient een geldig identiteitsbewijs (paspoort, rijbewijs of ID-kaart) en een selfie te verstrekken.</li>
                <li>SwiftBridge behoudt zich het recht voor aanvullende informatie te vragen bij twijfel of hogere transactiebedragen.</li>
                <li>Tot voltooiing van de KYC-verificatie is de Gebruiker niet gerechtigd transacties uit te voeren.</li>
                <li>Onjuiste of vervalste documenten leiden onmiddellijk tot accountbeëindiging en melding bij de bevoegde autoriteiten.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 6 — Transacties en Limieten</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Transacties zijn mogelijk vanaf €10 tot maximaal €10.000 per transactie.</li>
                <li>Het dagelijkse limiet bedraagt €5.000, het maandelijkse limiet €25.000 (voor standaard geverifieerde accounts).</li>
                <li>SwiftBridge kan hogere limieten toepassen na uitgebreid klantonderzoek (Enhanced Due Diligence).</li>
                <li>Eenmaal ingediende transacties zijn niet annuleerbaar tenzij de verwerking nog niet is gestart.</li>
                <li>SwiftBridge heeft het recht een transactie te weigeren of te vertragen bij vermoeden van fraude, witwassen of andere onwettige activiteiten.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 7 — Kosten en Tarieven</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>SwiftBridge rekent een servicevergoeding per transactie:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>€10 – €200: 2,5%</li>
                    <li>€201 – €500: 2,0%</li>
                    <li>€501 – €1.000: 1,7%</li>
                    <li>Meer dan €1.000: 1,5%</li>
                  </ul>
                </li>
                <li>De gehanteerde wisselkoers wordt weergegeven vóór bevestiging van de transactie. De koers is gegarandeerd voor 30 seconden na weergave.</li>
                <li>Alle kosten worden transparant weergegeven vóór bevestiging. Er zijn geen verborgen kosten.</li>
                <li>Tarieven kunnen worden gewijzigd met een aankondigingstermijn van 30 dagen.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 8 — Aansprakelijkheid</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>SwiftBridge is niet aansprakelijk voor schade als gevolg van overmacht, waaronder technische storingen, bankvertragingen, of overheidsmaatregelen.</li>
                <li>SwiftBridge is niet aansprakelijk voor schade als gevolg van onjuiste gegevens verstrekt door de Gebruiker (bijv. foutief rekeningnummer).</li>
                <li>De maximale aansprakelijkheid van SwiftBridge is beperkt tot het bedrag van de betreffende transactie.</li>
                <li>SwiftBridge is niet aansprakelijk voor indirecte schade, gederfde winst of gevolgschade.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 9 — Intellectueel Eigendom</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Alle intellectuele eigendomsrechten op het Platform, de software, het merk SwiftBridge en alle content berusten bij SwiftBridge.</li>
                <li>Het is de Gebruiker niet toegestaan het Platform te kopiëren, te reverse-engineeren of anderszins te exploiteren zonder schriftelijke toestemming.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 10 — Klachten</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Klachten kunnen worden ingediend via support@swiftbridge.tr.</li>
                <li>SwiftBridge streeft ernaar klachten binnen 5 werkdagen te beantwoorden.</li>
                <li>Indien de klacht niet naar tevredenheid wordt opgelost, kan de Gebruiker zich wenden tot het Kifid (Klachteninstituut Financiële Dienstverlening) of de Autoriteit Financiële Markten (AFM).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 11 — Toepasselijk Recht</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Op deze voorwaarden is Nederlands recht van toepassing.</li>
                <li>Geschillen worden voorgelegd aan de bevoegde rechter in Amsterdam, tenzij dwingend recht anders bepaalt.</li>
              </ul>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-gray-500">SwiftBridge B.V. — support@swiftbridge.tr — swiftbridge.tr</p>
              <p className="text-sm text-gray-500 mt-1">Versie 1.0, mei 2026. Onderworpen aan periodieke herziening.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
