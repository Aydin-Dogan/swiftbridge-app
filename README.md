# SwiftBridge App (frontend)

React 19 + Vite frontend voor SwiftBridge — EUR→TRY geldoverboekings-app
gericht op de Turkse diaspora in NL/EU.

**Live:** https://swiftbridge-app-production.up.railway.app

## Stack

- **React 19** met **Vite 5**
- **Tailwind CSS** voor styling (mobile-first, glassmorphism, gradients)
- **i18n** voor 5 talen: NL / EN / TR / RU / AZ (zie `src/i18n/`)
- **PWA** via vite-plugin-pwa (service worker + manifest)
- **Capacitor** klaargezet voor iOS/Android native builds
- **httpOnly cookies** voor auth (geen tokens in localStorage)

## Snelstart (lokaal)

```bash
git clone https://github.com/Aydin-Dogan/swiftbridge-app
cd swiftbridge-app
npm install
cp .env.example .env       # vul VITE_API_URL in (default: localhost:3000)
npm run dev
```

Dev-server start op `http://localhost:5173`. Hot-reload werkt.

Voor productie-build:

```bash
npm run build              # output: dist/
npm run preview            # serveer dist/ lokaal voor smoke-test
```

## i18n consistency check

Alle 5 taalbestanden moeten dezelfde keys hebben — anders zien gebruikers
in sommige talen onleesbare placeholders.

```bash
node scripts/i18n-check.mjs               # toon rapport
node scripts/i18n-check.mjs --strict      # exit-code 1 bij missing (voor CI)
```

CI draait dit automatisch op elke push (zie `.github/workflows/ci.yml`).

## Claims check (KYB-teksten)

SwiftBridge is geen bank: teksten over het zakelijk SwiftBridge-profiel mogen geen
rekening/IBAN/betaalpas/spaar-claims, NFC- of liveness-beloftes, "automatisch
goedgekeurd", "gratis" of emoji bevatten, en "DNB-vergunning" alleen samen met
"EMI-partner" in dezelfde zin.

```bash
node scripts/claims-check.mjs               # rapport; exit 1 bij treffers
node scripts/claims-check.mjs --strict      # ook falen als een verplichte bron ontbreekt (CI)
```

Gecontroleerd: `kyb_*`-keys in de 5 taalbestanden, `public/landing/zakelijk.html`
(KYB-segmenten) en `../swiftbridge-api/src/services/email/templates/kyb*.js`.

## Zakelijk profiel (KYB)

Zakelijke klanten vragen een **zakelijk SwiftBridge-profiel** aan via
`/app/zakelijk-aanvraag` (7 stappen: bedrijf via KvK-zoek, jij, toestel, gebruik,
identiteit, aanvullend, akkoord). Een medewerker beoordeelt de aanvraag in
`/admin/compliance` -> tab **Zakelijke aanvragen**. Bindend contract (endpoints,
statusmachine, keuzecodes, i18n-keys): `../swiftbridge-api/docs/KYB_API.md`.

```
src/pages/ZakelijkAanvraag.jsx           klantflow (hub + stappen)
src/components/kyb/                      stap-componenten, kybOpties.js (spiegel van API-KEUZES)
src/components/admin/kyb/                beheer: KybReviewQueue, KybDossier, KybBeoordeelPaneel,
                                         KybInfoNodigModal, KybDocumentKnop (+ tests)
public/landing/zakelijk.html             statische landing; CTA's -> /login?tab=register&type=zakelijk
```

Regels die overal gelden: productnaam "zakelijk SwiftBridge-profiel" (geen rekening/IBAN/
pas), prijs uitsluitend EUR 4,95 vast + wisselkoersmarge per ledenniveau (1,2% / 1,0% /
0,8% / 0,6%), doorlooptijd "uiterlijk binnen 5 werkdagen", toezichtzin "onder toezicht
van DNB via onze EMI-partner", geen emoji, 'je'-vorm. Admin-documenten worden nooit in een
iframe geladen (API zet `frame-ancestors 'none'`): fetch met credentials -> blob ->
nieuw tabblad. Beoordelaars: zie `../documentatie/KYB_werkinstructie_beoordelaar.md`;
lokaal testen: `../_LAUNCHER/SwiftBridge-ZO-TEST-JE.md` (Testrondje 6).

## Architectuur

```
src/
├── App.jsx                 Hoofd-router + auth-flow
├── main.jsx                Entry point
├── pages/
│   ├── Landing.jsx         Marketing-pagina (hero / features / tariefkaart / FAQ / CTA)
│   ├── Login.jsx           Login + register + 2FA-flow
│   ├── AlgemeneVoorwaarden.jsx
│   ├── Privacybeleid.jsx
│   ├── AMLBeleid.jsx
│   └── AdminPanel.jsx      Compliance officer / user management
├── components/
│   ├── Dashboard.jsx       Live koers + recente transacties + onboarding
│   ├── PaymentFlow.jsx     Bedrag → ontvanger → methode → confirm
│   ├── KYCFlow.jsx         Identificatie (lazy load OnfidoEmbed bij echt provider)
│   ├── kyc/OnfidoEmbed.jsx Onfido Web SDK loader
│   ├── Profiel.jsx         Gebruiker, 2FA, AVG export/anonimisering
│   ├── KoersAlerts.jsx     Stel notificatie in bij gunstige koers
│   ├── LiveKoersTicker.jsx Real-time EUR→TRY ticker (ECB-based)
│   ├── landing/            Hero, Features, HowItWorks, Pricing, Tariefkaart, FAQ, CTA
│   ├── beneficiaries/      Opgeslagen ontvangers UI
│   ├── chat/SupportChat.jsx Klantenservice chat
│   └── ...
├── services/
│   ├── api.js              fetch wrapper met cookie-credentials + CSRF
│   ├── kosten.js           TARIEF_MATRIX (spiegelt backend) + berekenKosten()
│   ├── currencies.js       Valutadata + formatBedrag()
│   ├── pushNotificatie.js  Web-push registratie
│   ├── trBanken.js         100+ Turkse banken
│   └── turkstaligeBanken.js Banken in TR + AZ + KZ + UZ + TM + KG + TJ
├── i18n/
│   ├── index.jsx           useTaal() hook + provider
│   └── {nl,en,tr,ru,az}.js 549 keys × 5 talen (synchroon)
├── assets/
└── sw.js                   Custom service worker (offline + push)
```

## Pricing — bron-of-truth

`src/services/kosten.js` bevat `TARIEF_MATRIX` die spiegelt met
`swiftbridge-api/src/services/kosten.js`. **Wijzig nooit één kant zonder
de ander** — `swiftbridge-api/tests/matrixSync.test.js` faalt als ze
uit sync zijn.

## PWA / Mobile

- Service worker registreert automatisch in productie
- Install-prompt verschijnt na 30 sec op landing voor compatible browsers
- Capacitor 5 is geconfigureerd (`capacitor.config.json`) — zie [CAPACITOR_SETUP.md](CAPACITOR_SETUP.md)

## Env vars

Volledige lijst in [.env.example](.env.example). Vite-spec: alleen
`VITE_*` prefix belandt in client-bundle (publiek leesbaar — geen secrets!).

## Deploy

Push naar `main` → Railway redeployt automatisch.
Custom domain configuratie: zie [`../swiftbridge-api/RAILWAY_DEPLOY.md`](../swiftbridge-api/RAILWAY_DEPLOY.md).

## Licentie

Proprietary — alle rechten voorbehouden Aydin Dogan / SwiftBridge.
