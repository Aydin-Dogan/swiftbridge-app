# SwiftBridge — Open punten & roadmap

> **Datum:** 26 mei 2026
> **Status:** 45 verbeteringen live op `main` (A t/m ZZ). Wachten op Cursor-review en externe blockers vóór productie-launch.
> **Tests:** Frontend 41/41 + Backend 284/284 groen.

---

## 🔴 KRITIEK — moet vóór go-live afgerond

### 1. DNS-overdracht swiftbridge.tr / .nl / .com.tr
- **Wat:** Stefan (Vormgvr) moet DNS A-records + CNAME records plaatsen naar Railway
- **Blocker:** Stefan was met vakantie tot dinsdag
- **Actie:** E-mail in `marketing/` map ligt klaar; opnieuw versturen + bellen indien geen reactie
- **Status:** ⏳ wachten op Stefan
- **Werk Claude:** alles voorbereid, geen code-actie nodig

### 2. KvK-nummer SwiftBridge B.V. (notaris-traject)
- **Wat:** Notaris moet BV-oprichting afronden, dan komt definitief KvK-nummer
- **Blocker:** Notaris-procedure loopt extern
- **Actie:** Env-vars `BRAND_KVK` + `BRAND_WWFT_REG` zijn al voorbereid in backend
- **Status:** ⏳ wachten op notaris
- **Werk Claude:** zodra nummer bekend → env-var in Railway zetten, geen code-deploy nodig

### 3. Mythos pre-launch security audit
- **Wat:** Onafhankelijke audit-firma controleert alles vóór go-live
- **Blocker:** moet ingepland worden (na cursor-review)
- **Actie:** Aydin moet Mythos contacteren
- **Status:** ⏳ in herinnering bewaard
- **Werk Claude:** review-briefing klaar in `CURSOR_REVIEW_BRIEFING.md`

### 4. Mollie LIVE keys in Railway
- **Wat:** Mollie test-keys zijn nu actief; LIVE keys nodig voor productie
- **Blocker:** Mollie-account moet volledig geverifieerd zijn (KvK + bankrekening BV)
- **Actie:** Na BV-oprichting → Mollie dashboard verifiëren → live keys naar Railway env
- **Status:** ⏳ blokkeert op #2
- **Werk Claude:** geen — Mollie keys nooit in repo

### 5. EMI-partner formele overeenkomst
- **Wat:** "DNB-toezicht via EMI-partner" claim vereist contract met die partner
- **Blocker:** zakelijke onderhandeling extern
- **Actie:** Aydin
- **Status:** ⏳ extern
- **Werk Claude:** UI-tekst overal correct ("via EMI-partner")

### 6. Cursor / CodeRabbit code-review
- **Wat:** Onafhankelijke second-opinion op de 45 verbeteringen
- **Blocker:** Cursor-account moet aangepast worden (in gang)
- **Actie:** Wanneer account klaar → `CURSOR_REVIEW_BRIEFING.md` plakken
- **Status:** ⏳ Aydin werkt aan account
- **Werk Claude:** briefing klaar, wacht op feedback

---

## 🟡 HOOG — afronden zodra mogelijk, niet kritiek voor MVP-launch

### 7. SNYK_TOKEN in GitHub Secrets
- **Wat:** Snyk vulnerability scanning job staat klaar in CI maar runt niet zonder token
- **Blocker:** Aydin moet token genereren op snyk.io (free tier)
- **Actie:** GitHub Settings → Secrets → Actions → add `SNYK_TOKEN`
- **Werk:** 5 minuten
- **Werk Claude:** CI workflow al voorbereid

### 8. WhatsApp Business-nummer
- **Wat:** Echt WhatsApp-nummer voor support (nu link weggehaald uit Footer)
- **Blocker:** Aydin moet WhatsApp Business activeren op SwiftBridge-nummer
- **Actie:** Aydin
- **Werk Claude:** zodra nummer bekend, Footer + i18n key bijwerken in 10 min

### 9. Echte testimonials van klanten
- **Wat:** `SocialProof.jsx` TESTIMONIALS array is bewust leeg
- **Blocker:** moet uit echte customer-flow komen (pas na launch)
- **Werk Claude:** na live-go → form bouwen om reviews te verzamelen + tonen

### 10. SS — E-mail wijzigen flow met verificatie
- **Wat:** User kan email niet wijzigen in Profiel (alleen naam/telefoon/adres)
- **Blocker:** vereist email-template + verify-flow (anti-takeover)
- **Werk:** ~2u (backend endpoints + email template + frontend form)
- **Status:** Deferred — security-kritiek, moet zorgvuldig

### 11. AAA — Spaardoel feature
- **Wat:** Dashboard card "Spaar voor doel" met progress-bar
- **Blocker:** nieuwe vertical, vereist tabel + endpoints + UI
- **Werk:** ~1u
- **Status:** Niet opgepakt deze sessie

### 12. QQ — Mollie SEPA-mandaat voor recurring
- **Wat:** Recurring transacties vragen nu telkens om authorisatie
- **Blocker:** Vereist Mollie customer-flow + first-payment mandate setup
- **Werk:** ~2u + Mollie dashboard configuratie
- **Status:** Deferred — vereist Mollie dashboard toegang

---

## 🟢 MEDIUM — quality-of-life, kan na launch

### 13. UU — Dark mode toggle
- **Wat:** Tailwind `darkMode: 'class'` + dark variants op alle 100+ componenten
- **Werk:** 4-6u (alle bestaande klassen aanpassen)
- **Status:** Deferred — refactor zonder business-impact

### 14. EE — Brand-color systeem in Tailwind config
- **Wat:** Hardcoded `bg-blue-600` etc. vervangen door `bg-brand-600` semantische tokens
- **Werk:** 2u (46 hardcoded plekken vinden en migreren)
- **Status:** Deferred — refactor met laag risico maar lage waarde
- **Note:** brand-* tokens BESTAAN al in Tailwind config, ze worden alleen niet overal gebruikt

### 15. FF — Server-Sent Events voor real-time status
- **Wat:** Status page polls nu elke 30s; SSE zou instant zijn
- **Werk:** 1u+ (backend SSE endpoint + frontend EventSource)
- **Status:** Deferred — complexer, nice-to-have

### 16. fx_history tabel + endpoint
- **Wat:** KoersSparkline (Verbetering X) gebruikt mock random-walk data
- **Blocker:** Backend `/fx/historie` endpoint moet gebouwd worden + tabel die elk uur snapshot maakt
- **Werk:** ~1u
- **Status:** TODO comment staat in code

### 17. OG-image opengraph.xyz check
- **Wat:** Open Graph preview testen op https://www.opengraph.xyz/
- **Werk:** 5 minuten check
- **Status:** Op Aydin's lijst ("later onthouden")

---

## 🔵 LAAG — future / nice-to-have

### 18. Multi-recipient transacties
- **Wat:** Eén transactie naar meerdere ontvangers (familie-overboeking)
- **Blocker:** Complexe Mollie flow + UI redesign
- **Werk:** ~4-6u
- **Status:** Niet gepland

### 19. Status-page SSE upgrade
- Zie FF hierboven

### 20. Lighthouse CI baseline opslaan
- **Wat:** Eerste run baseline-score commit zodat regressies detecteerbaar zijn
- **Werk:** 10 minuten (na productie-deploy live URL)
- **Status:** CI staat klaar, wacht op live URL

### 21. Sentry-achtige error monitoring
- **Wat:** Ergens een dashboard buiten /admin/errors voor centrale error-feed
- **Werk:** Sentry-cloud account (€26/mnd) of zelf hosted
- **Status:** Niet kritiek — `/admin/errors` werkt

### 22. A/B testing infrastructuur
- **Wat:** Variant-testing voor pricing-pages of CTA-teksten
- **Werk:** ~4u (eigen toolkit) of GrowthBook integratie
- **Status:** Niet nodig voor MVP

---

## 📋 Wat er WEL al staat (samenvatting van 45 verbeteringen)

<details>
<summary>Click to expand — 45 voltooide verbeteringen</summary>

### Frontend UX + Conversion
- A. Dynamic pricing (geen hardcoded ₺17.829)
- B. Loading skeletons in Hero + Calculator
- E. Custom 404 page met breadcrumb
- F. Multi-locale URL routes (/nl /tr /en /ru /az)
- H. Pricing + Tariefkaart consolideren
- P. Sticky mobile CTA
- Q. Font-extrabold reductie voor hiërarchie
- R. Calculator URL persistence + share
- S. Dashboard empty state met 3-staps preview
- V. WhatsApp deep-link uit Calculator
- VV. Tour herstart-knop in Profiel

### Compliance & Veiligheid
- K. Cookie consent banner (AVG/GDPR)
- N. Error boundaries per route
- T. Footer trust-row (DNB via EMI-partner)
- HH. Account verwijderen (AVG art. 17)
- II. Data export (AVG art. 15)
- JJ. Login history view voor user
- KK. 2FA backup codes PDF
- CC. Backend rate-limit monitoring
- RR. Audit-log retentie cron 90d

### Infrastructure & Ops
- C. Snyk Free tier in CI (token nog nodig)
- G. Bundle-size verlagen (178KB main → 44KB gzip)
- L. Status page /status met live healthchecks
- LL. Maintenance mode + banner
- M. Image performance (lazy/decoding/WebP)
- O. Lighthouse CI baseline
- I. Frontend Vitest setup (41 tests)
- U. Frontend errors backend endpoint
- WW. Polish ronde (console.log + scan)

### SEO
- D. JSON-LD FAQ uitbreiden naar 12 vragen
- J. JSON-LD HowTo schema + a11y skip-link
- Sprint 3 deel 2: 5 SEO-landingspagina's

### Admin Tooling
- Z. Admin errors viewer UI
- XX. Admin KPI dashboard /admin/overzicht

### Onboarding
- AA. PWA install banner verbeterd
- BB. Onboarding tour 5-stappen

### Features
- Sprint 4: Calculator-zonder-login
- OO. Publieke tracking-link `/tx/:token`
- PP. Stuur-opnieuw knop
- DD. Recurring pause/resume met ConfirmDialog
- GG. ConfirmDialog universeel (vervangt native confirm)
- MM. KYC retry-scherm i18n + polish
- NN. Push notif opt-in tijdens flow
- TT. CSV export voor accountant
- ZZ. Accountant read-only deel-links
- W. PaymentLoadingOverlay tijdens Mollie redirect
- X. Hero 7-dagen koers-sparkline
- Y. Referral share met badge + WhatsApp

</details>

---

## 🎯 Aanbevolen volgorde voor de komende dagen

### Week 1 — wachten + reviewen
1. **Vandaag/morgen:** Cursor-account afronden → review starten met `CURSOR_REVIEW_BRIEFING.md`
2. **Deze week:** Reageren op Stefan voor DNS
3. **Deze week:** SNYK_TOKEN in GitHub Secrets zetten (5 min)

### Week 2 — feedback verwerken
1. Cursor-bevindingen verwerken (kritiek + hoog eerst)
2. CodeRabbit koppelen aan GitHub (gratis tier) voor toekomstige PRs
3. Eventueel: AAA spaardoel feature toevoegen als unique selling point

### Week 3 — pre-launch
1. BV-oprichting check bij notaris
2. Mollie LIVE keys in Railway (zodra BV klaar)
3. Mythos pre-launch audit inplannen
4. EMI-partner overeenkomst tekenen

### Week 4 — go-live
1. Mythos audit-bevindingen verwerken
2. Lighthouse baseline opslaan
3. Echte testimonials verzamelen
4. WhatsApp Business activeren
5. **Launch** 🚀

---

## 💬 Hoe contact opnemen met externe partijen

| Partij | Doel | Status |
|---|---|---|
| **Stefan (Vormgvr)** | DNS-overdracht | E-mail klaar in `marketing/` map |
| **Notaris** | BV-oprichting + KvK | Loopt extern |
| **Mollie support** | Live keys activeren | Wacht op KvK |
| **Mythos** | Pre-launch security audit | Nog niet gecontacteerd |
| **EMI-partner** | Toezichts-overeenkomst | Onderhandeling extern |
| **Snyk** | Free tier account aanmaken | snyk.io → token genereren |

---

## ⚠️ Bekende risico's / aandachtspunten

1. **FX-marge zichtbaarheid** — moet ALTIJD verborgen blijven voor users. Code-audit elke PR.
2. **DNB-claim** — overal "via EMI-partner", niet "DNB-gereguleerd". Cursor moet hierop checken.
3. **PII in tracking-link** — Verbetering OO returnt minimaal info. Backend test bewaakt dit.
4. **Mock data in KoersSparkline** — duidelijke TODO, niet misleidend genoeg? Cursor check.
5. **Audit-log retentie 90d** — Wwft-data zit in `transacties` tabel (5 jaar), niet in `audit_logs`. Documenteren.

---

**Tot zover.** Vragen of onduidelijkheden? Vraag het aan Claude in de volgende sessie — context staat in MEMORY.md.
