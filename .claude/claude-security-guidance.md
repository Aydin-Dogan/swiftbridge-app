# Security guidance — SwiftBridge (EUR→internationaal remittance, fintech)

SwiftBridge verplaatst echt geld en verwerkt KYC/persoonsgegevens. Beveiliging is
prioriteit #1. Stack: React-frontend + Node/Express-backend, Mollie-betalingen,
JWT-auth, iDIN/KYC, gehost op Railway. Toezicht loopt via onze EMI-partner — NOOIT
in code, copy of comments claimen dat SwiftBridge zélf een DNB-gereguleerde bank is.

## Secrets & configuratie
- NOOIT wachtwoorden, API-sleutels, tokens of webhook-secrets in de code of in git.
  Alleen via environment variables (Railway). Let specifiek op: Mollie-keys,
  JWT-secret, admin-secret, TWOFA_ENC-sleutel, MOLLIE_WEBHOOK-secret.
- Geen secrets in de frontend-bundle — alles onder `src/` is publiek zichtbaar voor
  bezoekers. De frontend mag alleen de publieke API-URL kennen, nooit server-secrets.
- Mollie: `test_`-keys mogen in dev; **`live_`-keys NOOIT in de repo of in logs**.

## Logging & persoonsgegevens (AVG)
- Log NOOIT op INFO-niveau of hoger: namen, IBAN/rekeningnummers, BSN, e-mail,
  telefoon, bedragen, KYC-data, JWT's of tokens. Anonimiseer of laat weg.
- Geen volledige request-bodies van transactie- of auth-endpoints in logs.

## Geld & transacties (server is de autoriteit)
- Bedragen, wisselkoersen, fees en limieten ALTIJD aan de serverkant (her)berekenen
  en valideren. Vertrouw NOOIT een bedrag, koers of fee die uit de browser komt.
- De **FX-marge is bedrijfsgeheim**: NOOIT de interne marge, inkoopkoers of opslag
  naar de client sturen of in een publieke API-response lekken. De client krijgt
  uitsluitend de eindkoers die hij betaalt.
- Valideer alle transactie-input met Zod (of gelijkwaardig) vóór verwerking.

## Autorisatie — voorkom IDOR
- Elk transactie-, begunstigde-, spaardoel- en account-endpoint MOET controleren dat
  de ingelogde gebruiker eigenaar is van de opgevraagde resource: match op `user_id`
  uit de geverifieerde JWT, niet op een id dat de gebruiker zelf meestuurt. Nooit
  "haal record op puur op het meegegeven id".
- Admin-endpoints: timing-safe vergelijking van het admin-secret + geldige admin-JWT.

## Authenticatie / JWT
- Access-tokens verlopen kort, met refresh-flow. Secrets alleen server-side.
- Bij logout een token-denylist hanteren; refresh-tokens controleren.
- 2FA/PIN-flows: geen secrets of backup-codes in plaintext in logs of in de frontend.

## Rate-limiting & misbruik
- Rate-limiting op login-, registratie-, betaal- en koers-endpoints (brute-force én
  scrapen van koersen voorkomen).
- Mollie-webhooks: verifieer herkomst/handtekening vóór verwerking en verwerk
  **idempotent** — een dubbel binnenkomende webhook mag nooit dubbel uitbetalen.

## Externe verbindingen & input
- Alle externe calls via HTTPS. Valideer/escape user-input die in een query, in HTML
  of in een shell terechtkomt (SQL-injectie, XSS, command-injectie).
- Geen `dangerouslySetInnerHTML`, `.innerHTML =` of `document.write` met user-data.
- KYC-bestandsuploads: controleer het bestandstype op magic-bytes, niet alleen op
  de extensie.
