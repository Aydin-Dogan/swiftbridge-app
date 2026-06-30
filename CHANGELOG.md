# Changelog — SwiftBridge App (frontend)

Alle noemenswaardige wijzigingen aan de PWA. Formaat op basis van
[Keep a Changelog](https://keepachangelog.com/nl/). **Pre-launch:** nog geen
publieke release; semver-versies starten bij de eerste productie-go-live.

## [Unreleased]

### Toegevoegd
- **Recurring SEPA-incasso UI** (QQ): "Automatische incasso instellen"-banner in
  de recurring-pagina (→ Mollie-checkout) + "incasso actief"-indicator; alle 5 talen.
- **Echte koers-sparkline**: `KoersSparkline` haalt nu echte 7-daagse historie op
  (`/transactions/historie`) i.p.v. een verzonnen curve. Toont bewust niets bij
  onvoldoende data.
- **Premium design-systeem** (navy + oranje, Source Serif/Sans): nieuwe
  particuliere + zakelijke landing, herontworpen app-cluster.
- **Wereldwijde valuta's**: searchable selector, ~130 valuta's met live/binnenkort-
  status, schaalbare vlaggen.
- 68+ verbeteringen (A–XXX): spaardoelen, referral-programma, AVG-flows
  (account verwijderen / data-export / accountant-deel-link), 2FA backup-codes,
  onboarding-tour, status-page, recurring + iCal, tracking-link, PWA-install.

### Gewijzigd
- Volledige emoji-eliminatie (458 stuks) voor een professionele fintech-look.
- Koers-ticker rustiger (120s) + service-worker neemt direct over (skipWaiting).
- Echte App Store + Google Play badges + werkende QR.

### Beveiliging / privacy
- Logout-cleanup van PII in localStorage; CSP/HSTS-headers; path-traversal-guard.
- `payment_draft` strip IBAN + naam; CSRF-header op mutaties.
- Cookie-consent (AVG), compliance-copy "onder DNB-toezicht via EMI-partner".

### Tests
- Vitest-suite: **7 bestanden / 57 tests** groen (incl. i18n-pariteit 5 talen).

---

_Detail-historie staat in `OPEN_PUNTEN.md` en de git-log._
