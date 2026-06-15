# SwiftBridge — Opdracht: volledige bancaire restyling

> Voor: Cowork
> Van: Aydin (founder SwiftBridge)
> Datum: 14 juni 2026

## Doel

Geef de **hele app** dezelfde professionele, zakelijke, betrouwbare
bank-uitstraling die je al hebt vastgelegd in de landingspagina-hero.
Nu doortrekken naar **alle overige pagina's en componenten**, zodat alles
consistent is.

## De stijl staat AL vast — volg deze (door jou gemaakt, juni 2026)

Je hebt het fundament al gelegd; pas het overal consistent toe:

1. **Koppen** → `font-display` (serif-stack: Iowan Old Style / Palatino /
   Georgia). Staat al in `tailwind.config.js`.
2. **Primaire knoppen** → `.btn-inst` (rechthoekig, kapitalen,
   letterspatiëring `tracking-[0.22em]`, brand-blauw). Op donkere vlakken:
   `.btn-inst-ondark` (amber/goud). Staan al in `src/index.css`.
3. **Randen** → hairline `border border-gray-200`, hoeken `rounded-md` of
   `rounded-[3px]` (niet de zachte `rounded-2xl` meer).
4. **Labels / navlinks / kleine koppen** → kapitalen + `tracking-[0.2em]`,
   `font-medium`, kleinere `text-[0.7rem]`.
5. **Kleuren** → bestaande tokens: brand-blauw (#2563eb-reeks) = hoofd,
   accent-amber (#fbbf24/#f59e0b) = goud-accent, success-groen ongewijzigd.
   GEEN nieuwe kleuren introduceren.
6. **Bedragen / cijfers** → mogen in `font-display` serif voor de
   bank-look (zoals het ontvangstbedrag in de hero).

**Referentievoorbeelden (al af, gebruik als sjabloon):**
- `src/components/landing/Hero.jsx`
- `src/pages/Landing.jsx`

## Wat moet gerestyled worden (alles hieronder)

### Landingspagina — resterende secties
- `src/components/landing/Pricing.jsx`
- `src/components/landing/Tariefkaart.jsx` (de "Wij vs. concurrentie"-tabel
  + volledige tariefkaart)
- `src/components/landing/Footer.jsx`
- `src/components/landing/FAQ.jsx`
- `src/components/landing/CountrySupport.jsx` (banken-grid 7 landen)
- `src/components/landing/SocialProof.jsx`
- `src/components/landing/KoersSparkline.jsx`
- `src/components/landing/KoersTicker*` / `LiveKoersTicker.jsx`
- `src/pages/Calculator.jsx`

### Ingelogde app
- `src/components/Dashboard.jsx` + alles in `src/components/dashboard/`
  (SaldoCard, QuickActions, StatistiekCards, InsightsCard, KoersChart,
  RecentTransacties, MaandOverzicht, Spaardoelen)
- `src/components/PaymentFlow.jsx` (betaalflow — LET OP: alleen styling,
  geen logica/flow aanraken)
- `src/components/KYCFlow.jsx` + `src/components/kyc/*`
- `src/pages/Login.jsx`
- `src/components/Profiel.jsx`
- `src/components/beneficiaries/*` (ontvangers)
- `src/components/recurring/*` (terugkerende overboekingen)
- `src/components/referral/*`
- `src/components/TransactieReceipt.jsx`
- `src/pages/TransactieTracking.jsx`

### Herbruikbare UI-primitieven (pas deze aan = effect overal)
- `src/components/ui/Card.jsx`
- `src/components/ui/Knop.jsx`
- `src/components/ui/VeldGroep.jsx`
  → Als je deze 3 in bank-stijl brengt, erven veel schermen het automatisch.

### Admin (lagere prioriteit, mag mee)
- `src/pages/AdminPanel.jsx`, `AdminCompliance.jsx`, `AdminOverzicht.jsx`,
  `AdminErrors.jsx` + `src/components/admin/*`

## HARDE REGELS (niet overtreden)

1. **Geen emoji's.** De hele app is net emoji-vrij gemaakt; gebruik
   uitsluitend de SVG-iconen uit `src/components/icons/Icons.jsx`. Voeg
   GEEN emoji toe.
2. **Geen logica, props, state, i18n-keys of flows wijzigen.** Alleen
   classNames / styling / opmaak. Functionaliteit moet identiek blijven.
3. **PaymentFlow + KYC zijn kritiek** (geld + identiteit) — extra
   voorzichtig, puur visueel.
4. **Geen nieuwe externe fonts of libraries** (CSP: `font-src 'self'`).
   Alleen systeemfonts / bestaande tokens.
5. **Geen nieuwe kleuren** buiten de bestaande brand/accent/success tokens.
6. **Lege i18n-strings verboden** (er is een test die hierop faalt).
7. **Dark mode moet blijven werken** — gebruik de bestaande semantic-token
   overrides, hardcode geen losse kleuren die dark mode breken.

## Na afloop
Lever terug als ZIP met:
- De gewijzigde bestanden (zelfde paden)
- Een kort `RESTYLING_NOTES_v2.md` met wat je per bestand veranderde
- Vermeld eventuele plekken waar je twijfelde (dan beslist Aydin)

## Technische context (voor begrip, niet wijzigen)
- React 19 + Vite 5 + Tailwind CSS 3, PWA
- 5 talen (NL/EN/TR/RU/AZ) via `src/i18n/index.jsx`
- Tests: `npm test` (57 tests moeten groen blijven)
- Build: `npm run build` moet slagen
