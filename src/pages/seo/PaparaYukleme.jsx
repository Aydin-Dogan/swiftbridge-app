/**
 * SEO landing: /papara-yukleme
 * Target query: "papara yukleme nederland", "papara hesaba para gönder",
 *               "geld naar papara wallet"
 */
import SeoLanding from './SeoLanding';

export default function PaparaYukleme() {
  return (
    <SeoLanding
      title="Papara hesabına Hollanda'dan para yükleme"
      description="Hollanda'dan Papara hesabına EUR ile para yükle. iDEAL ile <5 dakika. SwiftBridge ile Papara cüzdanına doğrudan ödeme — TRY olarak alıcı alır."
      canonicalPath="/papara-yukleme"
      heroEyebrow="Papara wallet"
      heroSubtitel="Papara hesabın olan ailene veya kendine Hollanda'dan EUR gönder. iDEAL ile 5 dakikada Papara cüzdanında TRY olarak hazır."
      voorbeeldBedrag={300}
      cta="Papara'ya gönder"
      bullets={["iDEAL'den Papara'ya", '<5 dakika', 'Wwft uyumlu']}
      content={
        <>
          <p>
            Papara is een populaire Turkse digital wallet — gebruikt door miljoenen
            Turken voor dagelijkse betalingen, online shopping en peer-to-peer transfers.
            Geld op een Papara-wallet zetten vanuit Nederland was tot voor kort
            ingewikkeld. SwiftBridge maakt het simpel.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Wat is Papara?</h2>
          <p>
            Papara is een Turkse e-money wallet (vergelijkbaar met Revolut of Bunq).
            Gebruikers krijgen een eigen IBAN (TRXX-1000-9...), een virtuele Mastercard,
            en kunnen contactloos betalen via app. Voor Turkse jongeren onder de 30 is
            Papara vaak hun primaire "rekening" — zelfs als alternatief voor een
            traditionele bank.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Hoe stuur je geld naar een Papara wallet?</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>
              Vraag de ontvanger om <strong>Papara hesap numarası</strong> of de
              Papara IBAN (begint met TR + Papara&apos;s bank code <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">10009</code>).
            </li>
            <li>
              Open SwiftBridge, kies "Papara wallet" als uitbetaal-methode.
            </li>
            <li>
              Vul bedrag in (vanaf €10, tot €5.000 per week in eerste 90 dagen).
            </li>
            <li>
              Betaal met iDEAL — geld staat doorgaans binnen <strong>5 minuten</strong>
              op de Papara wallet als TRY-saldo.
            </li>
          </ol>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Papara wallet kullanım örnekleri</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Yeğenin doğum günü hediyesi (anlık para gönderme)</li>
            <li>Türkiye&apos;deki üniversite öğrencisine aylık harçlık</li>
            <li>Online alışveriş için Papara cüzdanı dolduma</li>
            <li>Acil durum para transferi (sağlık, kaza)</li>
            <li>Tatil için önceden TRY hazırlama</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Maliyetler ve sınırlamalar</h2>
          <p>
            Papara cüzdanına gönderim aynı tarife yapısı: 2,0%-0,8% kademeli, bedrağ
            arttıkça düşüyor. Papara tarafında ekstra ücret yok — gönderdiğin TRY tutarı
            doğrudan cüzdana eklenir.
          </p>
          <p>
            <strong>Limitler:</strong> Eerste 90 dagen weeklimiet €5.000. Per transactie
            maximum €25.000 op aanvraag. Papara zelf heeft ook eigen limieten (per
            tier — KYC1 / KYC2 / KYC3) — check hun app voor jouw specifieke limiet.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">Papara vs traditionele bank — wat is sneller?</h2>
          <p>
            <strong>Naar Papara wallet:</strong> doorgaans &lt;5 minuten, automatisch
            beschikbaar in de Papara-app.
          </p>
          <p>
            <strong>Naar traditionele bank (Garanti, Akbank, etc.):</strong> ook doorgaans
            &lt;5 minuten, maar afhankelijk van bank-werktijden kan het tot 15 min duren.
          </p>
          <p>
            Voor jonge Turkse ontvangers is Papara vaak gemakkelijker omdat zij geen
            traditionele bank-app actief gebruiken. Papara-app sturen ook automatisch
            push-notificatie.
          </p>
        </>
      }
      faq={[
        {
          vraag: 'Heb ik zelf een Papara-account nodig?',
          antwoord: 'Nee — je verstuurt vanuit Nederland via iDEAL. Alleen de ontvanger in Türkiye heeft een Papara-account nodig.',
        },
        {
          vraag: 'Hoe vindt de ontvanger zijn Papara IBAN?',
          antwoord: 'In de Papara-app: tab "Hesap" → "IBAN Bilgilerim" → kopiëren. De IBAN begint altijd met TR + 10009 (Papara&apos;s bank code).',
        },
        {
          vraag: 'Werkt het ook voor Ininal of andere Turkse e-wallets?',
          antwoord: 'Op dit moment alleen Papara natively. Ininal en andere wallets ondersteunen we via bank-payout naar de IBAN die aan de wallet gekoppeld is — soms iets langzamer.',
        },
      ]}
    />
  );
}
