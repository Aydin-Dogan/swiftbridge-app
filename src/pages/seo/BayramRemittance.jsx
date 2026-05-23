/**
 * SEO landing: /bayram-remittance
 * Target query: "bayram para gönder", "ramazan bayrami remittance",
 *               "geld sturen voor bayram"
 *
 * Seizoenspiek tijdens Ramazan + Kurban Bayramı — hoog zoekvolume in de
 * NL Turkse diaspora. Een dedicated landing tijdens deze pieken kan
 * significante traffic vangen.
 */
import SeoLanding from './SeoLanding';

export default function BayramRemittance() {
  return (
    <SeoLanding
      title="Bayram-overboeking — geld naar Türkiye voor Ramazan en Kurban"
      description="Stuur op tijd geld naar familie in Türkiye voor Ramazan Bayramı en Kurban Bayramı. Plan vooruit, gebruik onze Bayram-kalender, en mis geen feestdag."
      canonicalPath="/bayram-remittance"
      heroEyebrow="Bayram-gids"
      heroSubtitel="Bayram is voor veel Turkse families het belangrijkste moment om elkaar te steunen. Hier alles wat je moet weten over geld sturen rondom Ramazan en Kurban Bayramı."
      voorbeeldBedrag={500}
      cta="Bereken Bayram-transfer"
      bullets={['Vooraf plannen', 'Geen vertraging risico', 'TR-banken-status zichtbaar']}
      content={
        <>
          <p>
            Bayram — zowel Ramazan Bayramı (Şeker Bayramı) als Kurban Bayramı —
            zijn de twee grootste islamitische feestdagen, en in Turkse families
            traditioneel het moment om elkaar te bezoeken, geschenken te delen, en
            familie te ondersteunen. Voor de Turkse diaspora in Nederland betekent
            dat één ding: geld sturen vóór Bayram begint.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Wanneer is Bayram in 2026/2027?</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 my-4 text-sm">
            <p className="font-semibold text-gray-900 mb-2">Belangrijke Bayram-datums:</p>
            <ul className="space-y-1.5 text-gray-700">
              <li>📅 <strong>Ramazan Bayramı (Şeker Bayramı) 2026:</strong> 20-22 maart 2026</li>
              <li>📅 <strong>Kurban Bayramı 2026:</strong> 27-30 mei 2026</li>
              <li>📅 <strong>Ramazan Bayramı 2027:</strong> 9-11 maart 2027 (geschat)</li>
              <li>📅 <strong>Kurban Bayramı 2027:</strong> 16-19 mei 2027 (geschat)</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              Exacte data zijn afhankelijk van de maanstand — controleer kort voor de
              datum de Turkse maan-kalender.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Wanneer moet ik geld sturen vóór Bayram?</h2>
          <p>
            <strong>Onze sterke aanbeveling:</strong> stuur minimaal <strong>2-3 dagen
            voor</strong> Bayram begint. Reden: Turkse banken hebben tijdens de feestdagen
            beperkte werkuren en transactie-verwerking is vaak vertraagd. Een normaal
            5-minuten transfer kan dan oplopen tot 1-2 werkdagen.
          </p>
          <p>
            Concreet voor Ramazan Bayramı 2026 (start 20 maart):
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li><strong>Veiligste:</strong> stuur uiterlijk donderdag 17 maart 2026</li>
            <li><strong>Last-minute OK:</strong> tot vrijdag 18 maart 2026 (maar risico op vertraging)</li>
            <li><strong>Te laat:</strong> 19 maart of later — geld komt mogelijk pas na Bayram aan</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Hoeveel sturen Turken naar familie voor Bayram?</h2>
          <p>
            Er is geen vaste norm, maar uit informele gesprekken in de community zien
            we deze ranges:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li><strong>Ouders/grootouders:</strong> €100-€500 per kind/kleinkind</li>
            <li><strong>Broers/zussen:</strong> €50-€200 (vooral als zij financieel minder hebben)</li>
            <li><strong>Neven/nichten:</strong> €25-€100 (klassiek "Bayram harçlığı" voor kinderen)</li>
            <li><strong>Schoonouders:</strong> €100-€300 als gebaar</li>
          </ul>
          <p>
            Dit zijn culturele richtlijnen — geen verplichtingen. Je eigen budget bepaalt
            wat passend is. Belangrijker dan het bedrag is het <em>gebaar</em>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Tips om Bayram-stress te vermijden</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>
              <strong>Plan vooraf.</strong> Maak een lijstje met namen + IBAN&apos;s in
              SwiftBridge minimaal een week vóór Bayram. Sla ze op als "ontvangers"
              zodat je niet meer hoeft te typen op de stress-dag.
            </li>
            <li>
              <strong>Zet WhatsApp-notificatie aan</strong> — dan krijgt de ontvanger
              automatisch een bevestiging zodra het geld binnen is. Geen "is het al aangekomen?"-
              telefoontjes.
            </li>
            <li>
              <strong>Gebruik iDEAL Express</strong> tijdens Bayram-week (niet SEPA).
              SEPA-overboekingen kunnen tijdens feestdagen extra vertraagd zijn.
            </li>
            <li>
              <strong>Check de TR-bank-status</strong> als je twijfelt. Soms hebben
              specifieke banken (zoals Ziraat) extra vertragingen — onze status-pagina
              toont actuele banken-verwerkingstijd.
            </li>
          </ol>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Bayram is meer dan geld</h2>
          <p>
            Wij begrijpen dat een geldoverboeking maar één onderdeel is van wat Bayram
            betekent. De mensen die wachten op het andere eind zijn vaak vader, moeder,
            opa, oma, of een kind. Het bedrag maakt minder uit dan het feit dat het op
            tijd aankomt en dat zij weten dat aan ze gedacht wordt.
          </p>
          <p>
            Daarom: stuur op tijd. Eén dag te vroeg is beter dan één dag te laat.
          </p>
        </>
      }
      faq={[
        {
          vraag: 'Werkt SwiftBridge tijdens Bayram zelf?',
          antwoord: 'Ja, onze infrastructuur draait 24/7 — ook op feestdagen. Maar Turkse banken aan het ontvangende einde hebben beperkte verwerkingstijden, dus transacties tijdens Bayram kunnen tot 1-2 werkdagen duren. Plan daarom altijd 2-3 dagen vooruit.',
        },
        {
          vraag: 'Verzendt SwiftBridge een Bayram-bericht naar de ontvanger?',
          antwoord: 'Standaard alleen de transactie-bevestiging. Wel kun je een persoonlijke notitie meegeven (max 70 tekens) die de ontvanger ziet — bv. "Mutlu Bayramlar Anne, seni çok seviyorum!".',
        },
        {
          vraag: 'Kan ik meerdere transfers tegelijk doen voor verschillende familieleden?',
          antwoord: 'Op dit moment één transfer per keer. We werken aan een "batch-transfer" functie waarmee je in één keer naar 5+ ontvangers kunt sturen — verwacht in Q3 2026.',
        },
      ]}
    />
  );
}
