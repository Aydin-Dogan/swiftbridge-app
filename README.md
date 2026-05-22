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
