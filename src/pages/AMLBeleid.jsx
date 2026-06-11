import { Zap } from '../components/icons/Icons';

export default function AMLBeleid() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl text-blue-600">SwiftBridge</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AML-beleid</h1>
          <p className="text-gray-600 mb-1">Anti-Money Laundering & Counter-Terrorist Financing Policy</p>
          <p className="text-sm text-gray-500 mb-8">Versie 1.0 — Datum: mei 2026</p>

          {/* F31 fix (Cursor review): "Intern beleidsdocument" tekst verwijderd —
              dit document is publiek toegankelijk voor transparantie. */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-900">
            <strong>Publiek beleidsdocument:</strong> Dit document beschrijft hoe SwiftBridge witwassen van geld en financiering van terrorisme voorkomt, conform de Wet ter voorkoming van witwassen en financieren van terrorisme (Wwft) en EU Anti-witwasrichtlijnen (AMLD).
          </div>

          {/* F23 fix (Cursor review): expliciet maken dat SwiftBridge agent is van
              een EMI-partner — voorkomt indruk dat we zelf DNB-vergunning hebben. */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-900">
            <strong>Toezichtsstructuur:</strong> Betaaldiensten worden geleverd door onze EMI-partner, een door DNB gelicentieerde Elektronische Geld-Instelling. SwiftBridge handelt als agent en past onderstaand AML/CTF-beleid toe in opdracht van — en onder toezicht van — de EMI-partner. SwiftBridge beschikt zelf <strong>niet</strong> over een eigen DNB-vergunning.
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Doelstelling en Wettelijk Kader</h2>
              <p className="mb-3">SwiftBridge heeft een nultolerantiebeleid ten aanzien van witwassen van geld (AML) en financiering van terrorisme (CTF). Dit beleid is gebaseerd op:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Wwft</strong> — Wet ter voorkoming van witwassen en financieren van terrorisme (Nederland)</li>
                <li><strong>6e AMLD</strong> — Zesde Europese Anti-witwasrichtlijn</li>
                <li><strong>FATF-aanbevelingen</strong> — Financial Action Task Force richtlijnen</li>
                <li><strong>DNB-richtlijnen</strong> — toezichtkader De Nederlandsche Bank</li>
                <li><strong>Sanctiewet 1977</strong> — screening op sanctielijsten</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Risicogebaseerde Aanpak</h2>
              <p className="mb-3">SwiftBridge hanteert een risicogebaseerde aanpak (Risk-Based Approach). Klanten en transacties worden ingedeeld in drie risicocategorieën:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" aria-hidden="true" />
                    Laag Risico
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• NL-ingezetene, EU-burger</li>
                    <li>• Kleine transacties (&lt;€1.000)</li>
                    <li>• Reguliere frequentie</li>
                    <li>• Duidelijk doel (familie)</li>
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
                    Gemiddeld Risico
                  </div>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Transacties €1.000–€5.000</li>
                    <li>• Verhoogde frequentie</li>
                    <li>• Wisselende ontvangers</li>
                    <li>• Onduidelijke bron</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" aria-hidden="true" />
                    Hoog Risico
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• PEP of familielid PEP</li>
                    <li>• Transacties &gt;€5.000</li>
                    <li>• Onverklaard vermogen</li>
                    <li>• Sanctielijst treffer</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Klantenonderzoek (CDD/KYC)</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">3.1 Standaard Klantenonderzoek (SDD)</h3>
                  <p className="mb-2">Verplicht voor alle klanten vóór de eerste transactie:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Verificatie identiteitsbewijs (paspoort, rijbewijs of ID-kaart)</li>
                    <li>Liveness check / selfie verificatie</li>
                    <li>Verificatie naam, geboortedatum en adres</li>
                    <li>Screening op EU/VN sanctielijsten en PEP-lijsten</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3.2 Verscherpt Klantenonderzoek (EDD)</h3>
                  <p className="mb-2">Verplicht bij hoog risico, PEP-status of transacties boven €5.000:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Bewijs van herkomst van gelden (bankafschriften, loonstroken, etc.)</li>
                    <li>Doel van de transactie schriftelijk vastgelegd</li>
                    <li>Identificatie van de uiteindelijk belanghebbende (UBO)</li>
                    <li>Extra goedkeuring door compliance officer vereist</li>
                    <li>Hogere monitoringfrequentie</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3.3 Vereenvoudigd Klantenonderzoek (SDD-light)</h3>
                  <p>Niet toegestaan voor betaaldiensten. SwiftBridge voert altijd minimaal standaard CDD uit.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Politiek Prominente Personen (PEP's)</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Alle klanten worden gescreend op PEP-status (politiek prominente personen en hun familieleden).</li>
                <li>PEP's worden automatisch ingedeeld als hoog risico en vallen onder verscherpt klantenonderzoek (EDD).</li>
                <li>Toestemming van hoger management is vereist voordat een zakelijke relatie met een PEP wordt aangegaan.</li>
                <li>PEP-screening wordt gedurende de gehele relatie voortgezet.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Transactiemonitoring</h2>
              <p className="mb-3">SwiftBridge monitort alle transacties op ongebruikelijk gedrag. Automatische waarschuwingen worden gegenereerd bij:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border border-gray-200 font-semibold">Indicator</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold">Drempelwaarde</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold">Actie</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-200">Grote enkeltransactie</td>
                      <td className="p-3 border border-gray-200">&gt; €5.000</td>
                      <td className="p-3 border border-gray-200">EDD + handmatige review</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">Hoog maandvolume</td>
                      <td className="p-3 border border-gray-200">&gt; €15.000/maand</td>
                      <td className="p-3 border border-gray-200">EDD + bronverklaring</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">Gesplitste transacties (structuring)</td>
                      <td className="p-3 border border-gray-200">Patroon detectie</td>
                      <td className="p-3 border border-gray-200">Blokkering + melding FIU</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">Ongebruikelijke tijdstippen</td>
                      <td className="p-3 border border-gray-200">02:00–05:00 uur</td>
                      <td className="p-3 border border-gray-200">Verhoogde monitoring</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">Meerdere ontvangers</td>
                      <td className="p-3 border border-gray-200">&gt; 5 nieuwe ontvangers/week</td>
                      <td className="p-3 border border-gray-200">Handmatige review</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Ongebruikelijke Transacties Melden (MOT)</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>SwiftBridge is wettelijk verplicht ongebruikelijke transacties te melden bij de <strong>Financial Intelligence Unit Nederland (FIU-NL)</strong>.</li>
                <li>Meldingen worden gedaan via het FIU-portaal (fiu-nederland.nl) binnen <strong>14 dagen</strong> na constatering.</li>
                <li>Het is verboden de klant te informeren over een MOT-melding (<strong>tipping off</strong> verbod — Wwft art. 23).</li>
                <li>SwiftBridge behoudt het recht de transactie te bevriezen of de account te blokkeren tijdens onderzoek.</li>
                <li>Alle MOT-meldingen worden intern geregistreerd en 5 jaar bewaard.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Sanctiescreening</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Alle klanten en ontvangers worden gescreend tegen:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>EU Geconsolideerde sanctielijst</li>
                    <li>VN Veiligheidsraad sanctielijsten</li>
                    <li>OFAC SDN-lijst (VS)</li>
                    <li>Nederlandse nationale sanctielijsten</li>
                  </ul>
                </li>
                <li>Bij een treffer wordt de transactie geblokkeerd en de account bevroren.</li>
                <li>SwiftBridge verricht geen transacties naar landen op de FATF-grijze of zwarte lijst.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Bewaarplicht</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>KYC-documenten:</strong> minimaal 5 jaar na beëindiging zakelijke relatie (Wwft art. 33).</li>
                <li><strong>Transactiegegevens:</strong> minimaal 5 jaar na uitvoering transactie.</li>
                <li><strong>MOT-meldingen:</strong> minimaal 5 jaar.</li>
                <li><strong>Risicobeoordelingen:</strong> minimaal 5 jaar.</li>
                <li>Alle gegevens worden veilig versleuteld opgeslagen en zijn enkel toegankelijk voor bevoegde medewerkers en toezichthouders.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Compliance Organisatie</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>SwiftBridge wijst een <strong>Compliance Officer</strong> aan, verantwoordelijk voor de naleving van dit beleid.</li>
                <li>De Compliance Officer rapporteert direct aan de directie.</li>
                <li>Alle medewerkers met klantcontact volgen verplicht AML-training bij indiensttreding en jaarlijks daarna.</li>
                <li>Dit beleid wordt minimaal jaarlijks herzien en aangepast aan nieuwe wet- en regelgeving.</li>
                <li>Interne meldingen van vermoedens kunnen anoniem via compliance@swiftbridge.tr.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Gevolgen bij Overtreding</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Klanten die dit beleid schenden zien hun account onmiddellijk geblokkeerd worden.</li>
                <li>Uitstaande tegoeden worden bevroren hangende onderzoek.</li>
                <li>SwiftBridge werkt volledig mee aan verzoeken van opsporingsinstanties en toezichthouders.</li>
                <li>Bij bewijs van fraude of witwassen doet SwiftBridge aangifte bij de politie.</li>
              </ul>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-gray-500">SwiftBridge B.V. — compliance@swiftbridge.tr</p>
              <p className="text-sm text-gray-500 mt-1">Versie 1.0, mei 2026. Goedgekeurd door directie. Jaarlijkse herziening vereist.</p>
              <p className="text-sm text-gray-500 mt-1">Wettelijke basis: Wwft, 6e AMLD, FATF-aanbevelingen, Sanctiewet 1977.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
