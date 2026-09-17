# Changelog — SwiftBridge App (frontend)

Alle noemenswaardige wijzigingen aan de PWA. Formaat op basis van
[Keep a Changelog](https://keepachangelog.com/nl/). **Pre-launch:** nog geen
publieke release; semver-versies starten bij de eerste productie-go-live.

## [Unreleased]

### Toegevoegd
- **Zakelijk SwiftBridge-profiel aanvragen (KYB) — beheer** (2026-09, WP4; contract
  `swiftbridge-api/docs/KYB_API.md`): derde tab "Zakelijke aanvragen" in
  `/admin/compliance` met wachtrij (filter open/ingediend/in behandeling/info nodig/
  goedgekeurd/afgewezen/alle, zoeken, badges Sanctie-hit / Screening niet uitgevoerd /
  KvK handmatig / Doorlooptijd overschreden, "In behandeling nemen"), volledig dossier
  (Bedrijf met Handelsregister-vergelijking, Eigenaren en bestuurders met PEP en screening,
  Identiteit met snapshot-vergelijking en goed-/afkeuren, Gebruik en doel, Aanvullend,
  Verklaringen, Screening + herscreen, Documenten, Historie) en beoordeelpaneel
  (6-punts checklist, interne notitie, Aanvullende informatie vragen, Afwijzen met
  reden-code + tipping-off-waarschuwing, Goedkeuren pas na checklist + goedgekeurde
  identiteit). Documenten openen via fetch -> blob -> nieuw tabblad (nooit iframe).
  Componenten: `src/components/admin/kyb/*`. NL-fallbacks zolang de `kyb_admin_*`-keys
  nog niet in i18n staan.
- **AdminOverzicht**: tegel "Open zakelijke aanvragen" (uit `GET /admin/stats.kyb`).
- **Landing zakelijk**: CTA's wijzen naar `/login?tab=register&type=zakelijk&next=/app/zakelijk-aanvraag`;
  doorlooptijd in 6 talen naar "doorgaans binnen enkele werkdagen, uiterlijk binnen 5 werkdagen";
  badge "KYB-geverifieerd" en microcopy "Gratis KYB-verificatie" naar
  "KYB-beoordeling door een medewerker"; FAQ-fallback gelijk aan het NL-woordenboek.
- **`scripts/claims-check.mjs`** (+ CI-stap): bewaakt `kyb_*`-teksten in 5 talen, de zakelijke
  landing en de `kyb*`-mailtemplates van de API op bank/IBAN/betaalpas/NFC/liveness/
  "automatisch goedgekeurd"/gratis-claims, emoji en "DNB-vergunning" zonder "EMI-partner".

### Gewijzigd
- **KYCReviewQueue**: veldnamen gelijkgetrokken met het contract (records: `id, userId,
  userNaam, userEmail, documentType, bron, context, ingediendOp, status`); kolommen
  Bron en Context (kyc/kyb) i.p.v. documentnummer/nationaliteit (data-minimalisatie).

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
