import { Zap } from '../components/icons/Icons';

/**
 * "Hoe wij uw geld beschermen" — uitsluitend waarheidsgetrouwe punten die
 * daadwerkelijk in de code/architectuur zitten. Scoort dubbel: geruststelling
 * voor twijfelende klanten én professioneel signaal richting EMI-partner/DNB.
 * Geen enkele claim die niet klopt.
 */
function Punt({ titel, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-1.5">{titel}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}

export default function Veiligheid() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-brand-600" />
            <span className="font-bold text-xl text-brand-600">SwiftBridge</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hoe wij uw geld beschermen</h1>
          <p className="text-gray-600 mb-8">
            Een geldapp verdient uw vertrouwen alleen als hij het waarmaakt. Dit is precies wat wij doen —
            geen mooie woorden, maar de maatregelen die daadwerkelijk in onze app zitten.
          </p>

          <div className="space-y-10 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Uw account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Punt titel="Altijd twee stappen bij inloggen">
                  Uw wachtwoord alleen is nooit genoeg. Bij elke keer inloggen vragen wij ook een
                  6-cijferige verificatiecode — via uw e-mail of uw authenticator-app. Precies zoals uw bank.
                </Punt>
                <Punt titel="Sessies verlopen automatisch">
                  Bent u 15 minuten inactief, dan wordt u automatisch uitgelogd. U blijft dus nooit
                  onbedoeld ingelogd op een gedeeld of verloren apparaat.
                </Punt>
                <Punt titel="Extra pincode voor betalingen">
                  U kunt een 6-cijferige pincode instellen die de app vergrendelt en die bij elke
                  overboeking opnieuw gevraagd wordt — een extra slot op de deur.
                </Punt>
                <Punt titel="Wachtwoorden onleesbaar opgeslagen">
                  Uw wachtwoord wordt versleuteld (bcrypt) opgeslagen. Zelfs wij kunnen het niet zien.
                </Punt>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Uw gegevens</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Punt titel="Versleuteld opgeslagen (AES-256)">
                  Gevoelige identiteitsgegevens uit uw verificatie worden versleuteld bewaard
                  (AES-256-GCM), conform de AVG.
                </Punt>
                <Punt titel="Beveiligde verbinding">
                  Al het verkeer loopt over een versleutelde HTTPS-verbinding met strikte
                  beveiligingsheaders (HSTS). Uw inloggegevens verlaten uw apparaat nooit onbeveiligd.
                </Punt>
                <Punt titel="U houdt de regie">
                  U kunt op elk moment uw gegevens exporteren of uw account (en gegevens) laten
                  verwijderen — uw recht onder de AVG, direct in de app.
                </Punt>
                <Punt titel="Uw geld gescheiden bewaard">
                  Klantgelden worden via onze EMI-partner afgescheiden aangehouden (safeguarding),
                  los van het bedrijfsvermogen — zoals de wet voor betaaldiensten voorschrijft.
                </Punt>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Elke overboeking</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Punt titel="Koers vóór bevestiging">
                  U ziet het exacte bedrag dat de ontvanger krijgt — inclusief alle kosten — vóórdat u
                  bevestigt. Geen verrassingen achteraf, geen verborgen marge.
                </Punt>
                <Punt titel="Sanctie- en fraudecontrole">
                  Elke transactie wordt gescreend tegen internationale sanctielijsten. Ongebruikelijke
                  patronen worden automatisch gesignaleerd, conform de Wwft.
                </Punt>
                <Punt titel="Identiteitsverificatie (KYC)">
                  Vóór uw eerste overboeking verifiëren wij uw identiteit — via iDIN (uw eigen bank) en
                  een selfie-controle. Zo weten wij zeker dat ú het bent.
                </Punt>
                <Punt titel="Betalen via iDEAL">
                  Betalingen lopen via iDEAL — u betaalt in uw eigen vertrouwde bankomgeving. Wij zien
                  uw bankgegevens niet.
                </Punt>
              </div>
            </section>

            <section className="bg-brand-50 border border-brand-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-brand-900 mb-2">Onder toezicht — maar eerlijk over wat wij zijn</h2>
              <p className="text-sm text-brand-900">
                SwiftBridge is <strong>geen bank</strong> en heeft geen eigen bankvergunning van De
                Nederlandsche Bank. De betaaldiensten worden geleverd via een door DNB gelicentieerde
                EMI-partner (Electronic Money Institution), waarvoor SwiftBridge als agent optreedt —
                conform PSD2 en de Wwft. Dezelfde toezichthouder die uw eigen bank bewaakt, houdt dus
                ook toezicht op de diensten die u via ons afneemt.
              </p>
            </section>

            <section className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Een kwetsbaarheid gevonden?</h2>
              <p className="text-sm text-gray-600">
                Beveiligingsonderzoekers zijn welkom. Meld verantwoord via{' '}
                <a href="mailto:security@swiftbridge.nl" className="text-brand-600 underline">security@swiftbridge.nl</a>{' '}
                (zie ook onze <a href="/.well-known/security.txt" className="text-brand-600 underline">security.txt</a>).
                Wij reageren snel en werken graag met u samen.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
