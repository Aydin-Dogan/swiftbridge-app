import { Zap, Eye, Refresh, Trash, Download, XCircle, Lock } from '../components/icons/Icons';

export default function Privacybeleid() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-brand-600" />
            <span className="font-bold text-xl text-brand-600">SwiftBridge</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacybeleid</h1>
          <p className="text-sm text-gray-500 mb-8">Versie 2026-09 — Datum: september 2026 — AVG/GDPR compliant</p>

          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
            <strong>Samenvatting:</strong> Wij verzamelen alleen de gegevens die nodig zijn om u veilig geld te laten overmaken. Wij verkopen uw gegevens nooit aan derden. U heeft altijd het recht uw gegevens in te zien, te corrigeren of te laten verwijderen.
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Wie zijn wij?</h2>
              <p>SwiftBridge B.V. is de verwerkingsverantwoordelijke in de zin van de Algemene Verordening Gegevensbescherming (AVG / GDPR).</p>
              <div className="bg-gray-50 rounded-lg p-4 mt-3 text-sm">
                <p><strong>SwiftBridge B.V.</strong></p>
                <p>Nederland</p>
                <p>E-mail: privacy@swiftbridge.nl</p>
                <p>Website: swiftbridge.nl</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Welke gegevens verzamelen wij?</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">2.1 Accountgegevens</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Naam en e-mailadres</li>
                    <li>Telefoonnummer</li>
                    <li>Wachtwoord (versleuteld opgeslagen, nooit leesbaar)</li>
                    <li>Datum van registratie</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.2 KYC-gegevens (wettelijk verplicht)</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Kopie identiteitsbewijs (paspoort, rijbewijs of ID-kaart)</li>
                    <li>Geboortedatum en geboorteplaats</li>
                    <li>Nationaliteit</li>
                    <li>Selfie/portretfoto</li>
                    <li>Adresgegevens</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.3 Transactiegegevens</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Bedrag en valuta</li>
                    <li>Naam en rekeningnummer ontvanger</li>
                    <li>Datum, tijd en status van transacties</li>
                    <li>Gehanteerde wisselkoers en kosten</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.4 Technische gegevens</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>IP-adres</li>
                    <li>Browsertype en apparaatinformatie</li>
                    <li>Inloghistorie</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Waarom verwerken wij uw gegevens?</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border border-gray-200 font-semibold">Doel</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold">Rechtsgrondslag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-200">Account aanmaken en beheren</td>
                      <td className="p-3 border border-gray-200">Uitvoering overeenkomst (Art. 6.1b AVG)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">Transacties verwerken</td>
                      <td className="p-3 border border-gray-200">Uitvoering overeenkomst (Art. 6.1b AVG)</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">Identiteitsverificatie (KYC)</td>
                      <td className="p-3 border border-gray-200">Wettelijke verplichting Wwft (Art. 6.1c AVG)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">Voorkomen van fraude en witwassen</td>
                      <td className="p-3 border border-gray-200">Wettelijke verplichting Wwft (Art. 6.1c AVG)</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">Klantenservice en communicatie</td>
                      <td className="p-3 border border-gray-200">Gerechtvaardigd belang (Art. 6.1f AVG)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">Verbetering van de dienst</td>
                      <td className="p-3 border border-gray-200">Gerechtvaardigd belang (Art. 6.1f AVG)</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">Nieuwsbrief (optioneel)</td>
                      <td className="p-3 border border-gray-200">Toestemming (Art. 6.1a AVG)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="zakelijk-profiel">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Zakelijk profiel en Wwft</h2>
              <p className="mb-3">
                Vraagt u een <strong>zakelijk SwiftBridge-profiel</strong> aan, dan zijn wij op grond van de Wet ter voorkoming van
                witwassen en financieren van terrorisme (Wwft) verplicht uw onderneming en de personen daarachter te kennen
                (cliëntenonderzoek). Daarvoor verwerken wij aanvullend:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li><strong>Bedrijfsgegevens:</strong> KvK-nummer, statutaire naam en handelsnaam, rechtsvorm, vestigingsadres, activiteiten (SBI) en website; bij handmatige invoer een recent KvK-uittreksel.</li>
                <li><strong>Eigenaren en bestuurders (UBO's):</strong> naam, geboortedatum, nationaliteit, aard en omvang van het belang en de vraag of iemand politiek prominent is (PEP).</li>
                <li><strong>De tekenbevoegde aanvrager:</strong> naam, geboortedatum, nationaliteit, mobiel nummer, woonadres en een kopie van het identiteitsbewijs (voor- en achterkant) met selfie, óf een bevestiging via iDIN.</li>
                <li><strong>Doel en aard van het gebruik:</strong> verwacht aantal en omvang van overboekingen, bestemmingslanden, herkomst van de middelen, jaaromzet en deelnemingen.</li>
                <li><strong>Screening:</strong> een controle van bedrijf en personen tegen sanctielijsten; de uitkomst wordt bij het dossier bewaard.</li>
                <li><strong>Verklaringen:</strong> welke voorwaarden u heeft geaccepteerd (versie, tijdstip, gehasht IP-adres) en of u productupdates wilt ontvangen.</li>
              </ul>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border border-gray-200 font-semibold">Doel</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold">Rechtsgrondslag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-200">Concept-aanvraag opslaan en hervatten</td>
                      <td className="p-3 border border-gray-200">Precontractuele maatregelen (Art. 6.1b AVG)</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">Cliëntenonderzoek, identificatie, UBO-vaststelling en sanctiescreening</td>
                      <td className="p-3 border border-gray-200">Wettelijke verplichting Wwft (Art. 6.1c AVG)</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">Productupdates per e-mail</td>
                      <td className="p-3 border border-gray-200">Toestemming (Art. 6.1a AVG), altijd intrekbaar</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Beoordeling door een medewerker:</strong> een medewerker van SwiftBridge beoordeelt uw aanvraag binnen 5 werkdagen. Er vindt geen uitsluitend geautomatiseerde besluitvorming plaats.</li>
                <li><strong>Bewaartermijnen:</strong> een niet-ingediend concept verwijderen wij na 30 dagen zonder activiteit. Een ingediend dossier (inclusief documenten en de kopie van het identiteitsbewijs) bewaren wij 5 jaar na het einde van de relatie of na het besluit (art. 33 Wwft).</li>
                <li><strong>Beperking van uw rechten:</strong> zolang de Wwft-bewaarplicht loopt, kunnen wij een ingediend dossier niet wissen (art. 17 lid 3 sub b AVG). Uw overige rechten uit hoofdstuk 6 blijven van toepassing.</li>
                <li><strong>Geen mededelingen bij bepaalde afwijzingen:</strong> op grond van art. 23 Wwft mogen wij bij een afwijzing om sanctie- of risicoredenen geen nadere toelichting geven.</li>
                <li><strong>Verwerkers en ontvangers:</strong> de Kamer van Koophandel (Handelsregister), onze EMI-partner en, uitsluitend bij een wettelijke verplichting, de toezichthouder of FIU-Nederland. Gegevens worden versleuteld opgeslagen binnen de EER.</li>
              </ul>
              <p className="mt-3 text-sm text-gray-500">
                SwiftBridge is geen bank en heeft geen eigen DNB-vergunning; betaaldiensten lopen via een DNB-gelicentieerde EMI-partner (agent-model), conform PSD2 en de Wwft.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Hoe lang bewaren wij uw gegevens?</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Accountgegevens:</strong> zolang uw account actief is, plus 2 jaar na beëindiging.</li>
                <li><strong>KYC-documenten:</strong> 5 jaar na laatste transactie (wettelijk verplicht op grond van Wwft).</li>
                <li><strong>Zakelijk dossier (Wwft):</strong> concept 30 dagen na laatste activiteit; ingediend dossier 5 jaar na einde relatie of besluit.</li>
                <li><strong>Transactiegegevens:</strong> 7 jaar (fiscale bewaarplicht).</li>
                <li><strong>Technische logs:</strong> maximaal 90 dagen.</li>
              </ul>
              <p className="mt-3 text-sm text-gray-500">Na afloop van de bewaartermijn worden gegevens veilig en onherstelbaar verwijderd.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Delen wij uw gegevens?</h2>
              <p className="mb-3">Wij verkopen uw gegevens <strong>nooit</strong> aan derden. Wij delen gegevens alleen in de volgende gevallen:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Bankpartners:</strong> voor uitvoering van de geldoverdracht (strikt noodzakelijk).</li>
                <li><strong>KYC-verificatiepartners:</strong> voor identiteitsverificatie (bijv. Onfido of Veriff).</li>
                <li><strong>Kamer van Koophandel:</strong> voor het opvragen van bedrijfsgegevens uit het Handelsregister bij een zakelijke aanvraag.</li>
                {/* F23 fix (Cursor review): expliciet "via EMI-partner" toegevoegd */}
                <li><strong>Toezichthouders (via onze EMI-partner):</strong> DNB, FIU-Nederland, Belastingdienst — uitsluitend bij wettelijke verplichting.</li>
                <li><strong>IT-dienstverleners:</strong> hosting en infrastructuur (verwerkerovereenkomst aanwezig).</li>
              </ul>
              <p className="mt-3">Gegevens worden niet doorgegeven buiten de EER, tenzij met passende waarborgen (zoals standaardcontractbepalingen van de Europese Commissie).</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Uw rechten (AVG)</h2>
              <p className="mb-3">U heeft de volgende rechten, die u kunt uitoefenen via privacy@swiftbridge.nl:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { Icoon: Eye, title: 'Inzagerecht', desc: 'U kunt opvragen welke gegevens wij van u verwerken.' },
                  { Icoon: Refresh, title: 'Correctierecht', desc: 'U kunt onjuiste gegevens laten corrigeren.' },
                  { Icoon: Trash, title: 'Recht op vergetelheid', desc: 'U kunt verzoeken uw gegevens te verwijderen (m.u.v. wettelijke bewaarplicht).' },
                  { Icoon: Download, title: 'Dataportabiliteit', desc: 'U kunt uw gegevens in een leesbaar formaat opvragen.' },
                  { Icoon: XCircle, title: 'Bezwaarrecht', desc: 'U kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang.' },
                  { Icoon: Lock, title: 'Recht op beperking', desc: 'U kunt verzoeken de verwerking tijdelijk te beperken.' },
                ].map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <r.Icoon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <strong className="text-sm">{r.title}</strong>
                    </div>
                    <p className="text-sm text-gray-600">{r.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">Wij reageren binnen <strong>30 dagen</strong> op uw verzoek. U heeft ook het recht een klacht in te dienen bij de <strong>Autoriteit Persoonsgegevens</strong> (autoriteitpersoonsgegevens.nl).</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Beveiliging</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Alle communicatie is versleuteld via TLS/HTTPS.</li>
                <li>Wachtwoorden worden opgeslagen met bcrypt-hashing (niet leesbaar).</li>
                <li>Toegang tot persoonsgegevens is beperkt tot geautoriseerde medewerkers.</li>
                <li>Wij voeren regelmatige beveiligingsaudits uit.</li>
                <li>Bij een datalek informeren wij u en de Autoriteit Persoonsgegevens binnen 72 uur.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies</h2>
              <p className="mb-3">SwiftBridge gebruikt minimale cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Functionele cookies:</strong> noodzakelijk voor inloggen en sessibeheer. Geen toestemming vereist.</li>
                <li><strong>Analytische cookies:</strong> geanonimiseerde gebruiksstatistieken. U kunt dit weigeren.</li>
                <li>Wij gebruiken <strong>geen</strong> tracking- of advertentiecookies van derden.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Wijzigingen</h2>
              <p>SwiftBridge kan dit privacybeleid aanpassen. Bij wezenlijke wijzigingen ontvangt u hierover een e-mailbericht minimaal 30 dagen vóór de ingangsdatum.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact</h2>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p><strong>Privacyvragen of verzoeken:</strong> privacy@swiftbridge.nl</p>
                <p><strong>Algemene ondersteuning:</strong> support@swiftbridge.nl</p>
                <p><strong>Functionaris Gegevensbescherming (FG):</strong> fg@swiftbridge.nl</p>
              </div>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-gray-500">SwiftBridge B.V. — Versie 2026-09, september 2026 — AVG/GDPR compliant</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
