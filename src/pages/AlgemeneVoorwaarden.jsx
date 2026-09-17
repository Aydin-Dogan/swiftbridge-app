import { useEffect } from 'react';
import { Zap } from '../components/icons/Icons';

export default function AlgemeneVoorwaarden() {
  // Anker-links (bv. #zakelijk-acceptatiecriteria vanuit de KYB-flow) werken
  // ook als deze pagina lazy geladen wordt: na het renderen zelf scrollen.
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ block: 'start' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-brand-600" />
            <span className="font-bold text-xl text-brand-600">SwiftBridge</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Algemene Voorwaarden</h1>
          <p className="text-sm text-gray-500 mb-8">Versie 2026-09 — Datum: september 2026</p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
            <strong>Let op:</strong> SwiftBridge is momenteel in bèta en biedt uitsluitend demonstratie- en testdiensten aan. Bij commerciële livegang worden betaaldiensten geleverd via een gelicentieerde EMI- of PSP-partner onder DNB-toezicht (agent-model). SwiftBridge B.V. heeft op dit moment geen eigen vergunning van De Nederlandsche Bank.
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 1 — Definities</h2>
              <p className="mb-3">In deze Algemene Voorwaarden wordt verstaan onder:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>SwiftBridge:</strong> SwiftBridge B.V., gevestigd in Nederland, ingeschreven bij de Kamer van Koophandel onder nummer 42138434.</li>
                <li><strong>Gebruiker:</strong> elke natuurlijke persoon van 18 jaar of ouder die een account aanmaakt en gebruikmaakt van de diensten van SwiftBridge.</li>
                <li><strong>Zakelijke Gebruiker:</strong> een onderneming die via een tekenbevoegde natuurlijke persoon een zakelijk SwiftBridge-profiel heeft aangevraagd en waarvan de aanvraag is goedgekeurd (artikel 12).</li>
                <li><strong>Dienst:</strong> het online platform van SwiftBridge voor het internationaal overmaken van geld vanuit Nederland.</li>
                <li><strong>Transactie:</strong> elke door de Gebruiker geïnitieerde overboeking van euro's (EUR) naar de valuta van het land van de ontvanger.</li>
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
                <li>SwiftBridge biedt een platform aan voor internationale geldoverdracht van euro's (EUR) naar de valuta van het land van de ontvanger.</li>
                <li>De Dienst is uitsluitend beschikbaar voor personen woonachtig in Nederland met een geldige bankrekening.</li>
                <li>Ontvangers dienen te beschikken over een geldige bankrekening in een van de door SwiftBridge ondersteunde uitbetaallanden.</li>
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
                <li>Bij vermoed misbruik of ongeautoriseerde toegang dient de Gebruiker SwiftBridge onmiddellijk te informeren via support@swiftbridge.nl.</li>
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
                <li>Transacties zijn mogelijk vanaf €50 tot maximaal €5.000 per transactie (en €5.000 per week).</li>
                <li>Het dagelijkse limiet bedraagt €5.000, het maandelijkse limiet €25.000 (voor standaard geverifieerde accounts).</li>
                <li>SwiftBridge kan hogere limieten toepassen na uitgebreid klantonderzoek (Enhanced Due Diligence).</li>
                <li>Eenmaal ingediende transacties zijn niet annuleerbaar tenzij de verwerking nog niet is gestart.</li>
                <li>SwiftBridge heeft het recht een transactie te weigeren of te vertragen bij vermoeden van fraude, witwassen of andere onwettige activiteiten.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 7 — Kosten en Tarieven</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>SwiftBridge rekent per transactie één vaste servicevergoeding van €4,95, plus een transparante koersmarge die afhangt van het ledenniveau:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Basis: 1,2%</li>
                    <li>Plus: 1,0%</li>
                    <li>Premium: 0,8%</li>
                    <li>Black: 0,6%</li>
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
                <li>Klachten kunnen worden ingediend via support@swiftbridge.nl.</li>
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

            <section id="zakelijk-acceptatiecriteria" className="scroll-mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Artikel 12 — Zakelijk SwiftBridge-profiel en acceptatiecriteria</h2>
              <p className="mb-3">
                Een zakelijk SwiftBridge-profiel geeft een onderneming toegang tot internationale betalingen vanaf de eigen zakelijke
                bankrekening. Het profiel is geen betaalrekening: SwiftBridge houdt geen gelden aan, verstrekt geen IBAN en geen betaalpas.
                Een aanvraag wordt uitsluitend goedgekeurd als aan de onderstaande acceptatiecriteria is voldaan.
              </p>
              <h3 className="font-semibold text-gray-900 mb-2">12.1 Acceptatiecriteria</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>De onderneming is ingeschreven in het Handelsregister van de Kamer van Koophandel en heeft een vestigingsadres in Nederland.</li>
                <li>De rechtsvorm is een eenmanszaak, besloten vennootschap, vennootschap onder firma, stichting of een andere Nederlandse rechtsvorm die SwiftBridge na beoordeling accepteert.</li>
                <li>De aanvraag wordt gedaan door een natuurlijke persoon van 18 jaar of ouder die bevoegd is de onderneming te vertegenwoordigen en wiens identiteit is vastgesteld met een geldig paspoort of Europese identiteitskaart, dan wel via iDIN.</li>
                <li>Alle uiteindelijk belanghebbenden (personen met meer dan 25% van de aandelen, het stemrecht of het eigendom) en de bestuurders zijn volledig en naar waarheid opgegeven.</li>
                <li>De onderneming, haar bestuurders en uiteindelijk belanghebbenden komen niet voor op nationale of internationale sanctielijsten.</li>
                <li>Is de aanvrager, een uiteindelijk belanghebbende of een naaste betrokkene politiek prominent (PEP), dan vindt verscherpt cliëntenonderzoek plaats voordat een besluit wordt genomen.</li>
                <li>Het doel van het gebruik, de verwachte omvang van de overboekingen en de herkomst van de middelen zijn plausibel en passen bij de aard en omvang van de onderneming.</li>
                <li>De onderneming is niet actief in sectoren die SwiftBridge of haar EMI-partner uitsluit, waaronder: handel in wapens, kansspelen zonder vergunning, handel in of omwisseling van cryptovaluta, seksuele diensten, en vennootschappen zonder daadwerkelijke bedrijfsactiviteit.</li>
                <li>Het e-mailadres van de aanvrager is bevestigd en de aanvrager heeft de verklaringen in de aanvraag afgegeven.</li>
                <li>Bij handmatig ingevoerde bedrijfsgegevens is een KvK-uittreksel toegevoegd dat niet ouder is dan drie maanden.</li>
              </ul>
              <h3 className="font-semibold text-gray-900 mb-2">12.2 Beoordeling en besluit</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Een medewerker van SwiftBridge beoordeelt de aanvraag. De aanvrager ontvangt uiterlijk binnen 5 werkdagen na indiening bericht per e-mail.</li>
                <li>SwiftBridge kan aanvullende informatie of documenten opvragen; tot die zijn ontvangen wordt de beoordeling opgeschort.</li>
                <li>SwiftBridge kan een aanvraag zonder opgaaf van redenen afwijzen waar de Wwft dat vereist (artikel 23 Wwft). Een afwijzing geeft geen recht op schadevergoeding.</li>
                <li>Tot goedkeuring van de aanvraag kan de Zakelijke Gebruiker geen zakelijke overboekingen doen.</li>
                <li>Een niet-ingediende aanvraag wordt na 30 dagen zonder activiteit verwijderd. Een ingediende aanvraag wordt op grond van de Wwft 5 jaar bewaard.</li>
              </ul>
              <h3 className="font-semibold text-gray-900 mb-2">12.3 Gebruik na goedkeuring</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Voor zakelijke overboekingen geldt hetzelfde tarief als in artikel 7: EUR 4,95 per overboeking plus de wisselkoersmarge van het ledenniveau (vanaf 1,2%, tot 0,6%). De kosten zijn altijd zichtbaar vóór bevestiging.</li>
                <li>Na goedkeuring gelden de standaardlimieten van artikel 6 (minimaal EUR 50, maximaal EUR 5.000 per overboeking en per week). Hogere zakelijke limieten worden individueel afgestemd na aanvullend onderzoek.</li>
                <li>De Zakelijke Gebruiker informeert SwiftBridge binnen 14 dagen over wijzigingen in rechtsvorm, bestuur, uiteindelijk belanghebbenden of activiteiten. SwiftBridge mag het profiel opschorten of beëindigen wanneer niet langer aan de acceptatiecriteria wordt voldaan.</li>
                <li>SwiftBridge is geen bank en heeft geen eigen DNB-vergunning; betaaldiensten lopen via een DNB-gelicentieerde EMI-partner (agent-model), conform PSD2 en de Wwft.</li>
              </ul>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-gray-500">SwiftBridge B.V. — support@swiftbridge.nl — www.swiftbridge.nl</p>
              <p className="text-sm text-gray-500 mt-1">Versie 2026-09, september 2026. Onderworpen aan periodieke herziening.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
