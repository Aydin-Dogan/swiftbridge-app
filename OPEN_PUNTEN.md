# SwiftBridge — Open punten & roadmap

> **Datum:** 26 mei 2026
> **Status:** **68 verbeteringen live** op `main` (A t/m XXX). Wachten op Cursor-review en externe blockers vóór productie-launch.
> **Tests:** Frontend 51/51 + Backend 294/294 groen.

---

## 🟢 ACTUELE STAND — 1 juli 2026 (dit blok is leidend; de tekst hieronder is historie)

**Sinds 26 mei is er veel afgerond.** De "deferred" lijst hieronder klopt grotendeels niet meer:
- ✅ **Afgerond:** SS (e-mailwijziging), EE (brand-tokens), UU (dark mode), FFF (admin i18n), MMM (valuta-favorieten), **QQ (Mollie SEPA-mandaat — backend + frontend)**, frontend-tests, **PostgreSQL live**, boot-guards (TWOFA_ENC + webhook-secret), PIN-lock, volledige bancaire restyle, wereldwijde valuta's, resilience/circuit-breakers, en 6 security-fix-batches (KRITIEK/HOOG/MIDDEL/LAAG allemaal dicht) + betaal-/payout-reconciliatie. Backend-suite: **31 suites / 319 tests groen**.
- 🔧 **Nog open in code (gepland, geen externe afhankelijkheid):** **fx_history** (KoersSparkline draait nog op nep-data — risico #4 hieronder + `KoersSparkline.jsx` TODO), OpenAPI-spec, A11y-pass, CHANGELOG, Playwright-E2E. FF (SSE) blijft bewust uitgesteld (polling volstaat).
- ⛔ **Geblokkeerd op partners/credentials:** payout-rail (TerraPay/Papara/Wise), KYC-live-provider, iDIN/Buckaroo.
- ⏳ **Jouw externe/config-acties:** Railway compute-quota verhogen (api ligt nu plat), Mollie **live-key** + webhook-URL, Resend-domein, EMI-partner-contract, BV/KvK (notaris), Wwft-jurist, DNS (Stefan), privacy/AV juridische check, Sentry, launch-prep. **Open besluit:** FX-marge op landing tonen of verbergen (staat op verbergen).

---

## 🔴 KRITIEK — moet vóór go-live afgerond

### 1. DNS-overdracht swiftbridge.tr / .nl / .com.tr
- **Wat:** Stefan (Vormgvr) moet DNS A-records + CNAME records plaatsen naar Railway
- **Status:** ⏳ wachten op Stefan
- **Werk Claude:** alles voorbereid, geen code-actie nodig

### 2. KvK-nummer SwiftBridge B.V. (notaris-traject)
- **Wat:** Notaris moet BV-oprichting afronden, dan komt definitief KvK-nummer
- **Status:** ⏳ wachten op notaris
- **Werk Claude:** env-vars `BRAND_KVK` + `BRAND_WWFT_REG` al klaar — zodra nummer bekend → Railway env zetten

### 3. Mythos pre-launch security audit
- **Status:** ⏳ moet ingepland worden
- **Werk Claude:** `CURSOR_REVIEW_BRIEFING.md` is leidend voor zowel Cursor als Mythos

### 4. Mollie LIVE keys in Railway
- **Status:** ⏳ blokkeert op KvK (Mollie verifieert BV)
- **Werk Claude:** geen — Mollie keys nooit in repo

### 5. EMI-partner formele overeenkomst
- **Status:** ⏳ extern (onderhandeling)
- **Werk Claude:** UI-tekst correct ("via EMI-partner")

### 6. Cursor / CodeRabbit code-review
- **Status:** ⏳ Aydin werkt aan Cursor-account
- **Werk Claude:** `CURSOR_REVIEW_BRIEFING.md` klaar in repo root

---

## 🟡 HOOG — afronden zodra mogelijk, niet kritiek voor MVP-launch

### 7. SNYK_TOKEN in GitHub Secrets
- **Wat:** Snyk vulnerability scanning job staat klaar in CI
- **Werk:** 5 minuten — snyk.io → token → GitHub Settings → Secrets

### 8. WhatsApp Business-nummer
- **Status:** Aydin moet WhatsApp Business activeren

### 9. Echte testimonials van klanten
- **Status:** pas na launch — vereist customer-flow

---

## 🟢 MEDIUM — deferred met goede reden

### 10. SS — E-mail wijzigen flow met verificatie
- Security-kritiek (account-takeover risico), vereist email-template + verify-flow. ~2u werk.

### 11. EE — Brand-color systeem refactor
- 46 hardcoded plekken → brand-* tokens. Tailwind defaults zijn dezelfde hex dus visueel geen verschil. Refactor met laag risico maar weinig waarde.

### 12. UU — Dark mode toggle
- 4-6u refactor van 100+ componenten met dark: variants. Geen business impact.

### 13. FF — Server-Sent Events voor real-time status
- Status page polls nu elke 30s, prima voor MVP. SSE = complexer.

### 14. QQ — Mollie SEPA-mandaat voor recurring
- Vereist Mollie dashboard configuratie + first-payment mandate setup. Pas na live keys.

### 15. FFF — Admin pages volledige i18n migratie
- Admin pages zijn intern (alleen team). NL volstaat, 5-talen overkill.

### 16. MMM — KKK-frontend valuta favorieten ster-knop
- Backend klaar. Frontend vereist refactor van 3 valuta-selectors (Hero/Calculator/PaymentFlow).

### 17. fx_history tabel + endpoint
- KoersSparkline gebruikt nu mock-data met TODO-comment.

### 18. OG-image opengraph.xyz check
- 5 minuten — visuele check op https://www.opengraph.xyz/

---

## 📋 De 68 voltooide verbeteringen — per categorie

<details>
<summary>Click to expand — 68 voltooide verbeteringen</summary>

### Pricing & Conversion (Calculator/Hero)
- A. Dynamic pricing (geen hardcoded ₺17.829)
- B. Loading skeletons in Hero + Calculator
- H. Pricing + Tariefkaart consolideren
- R. Calculator URL persistence + share
- V. WhatsApp deep-link Calculator
- X. Hero 7-dagen koers-sparkline
- P. Sticky mobile CTA
- RRR. Telegram share-knop (3-koloms)
- VVV. Notitie input in PaymentFlow + edit in TransactieReceipt
- WWW. Beneficiary autocomplete bij naam-typen

### Engagement & Retention
- AAA. Spaardoelen feature met progress + suggested per week
- BBB. Spaardoelen auto-link aan transacties
- CCC. Push notif bij spaardoel bereikt
- EEE. Dashboard "Deze maand verstuurd" widget + 30d sparkline
- PPP. QuickResend op Dashboard (3 recente ontvangers)
- LLL. Referral progress widget (mijlpalen €50/100/250)
- JJJ. Referral leaderboard (top 10, anoniem)
- Y. Referral share-flow polish met badge
- XXX. Spaardoel "Stuur nu" smart-prefill (ontvanger + bedrag)

### Compliance & Privacy (AVG/GDPR/Wwft)
- K. Cookie consent banner (granular, AVG-compliant)
- HH. Account verwijderen (Art. 17)
- II. Data export JSON (Art. 15)
- TT. CSV export voor accountant
- ZZ. Accountant read-only deel-links
- GGG. Notification preferences (3 toggles)
- RR. Audit-log retentie 90 dagen
- T. Footer trust-row (DNB via EMI-partner)

### Security
- N. Error boundaries per route
- JJ. Login history view voor user
- KK. 2FA backup codes als PDF
- CC. Backend rate-limit monitoring
- DDD. Welkomstmail bij registratie

### Admin Tooling
- U. Frontend errors backend endpoint
- Z. Admin errors viewer UI
- XX. Admin KPI overzichts-dashboard

### Onboarding & Help
- AA. PWA install banner (vanaf 2e bezoek)
- BB. Onboarding tour 5-stappen
- VV. Tour herstart-knop in Profiel
- S. Dashboard empty state met 3-staps preview
- NN. Push notif opt-in tijdens transactie-flow

### UX & Conversion
- Sprint 4. Calculator-zonder-login
- E. Custom 404-page
- DD. ConfirmDialog vervangt native confirm()
- GG. KoersAlerts ConfirmDialog migratie
- MM. KYC retry-scherm i18n
- W. PaymentLoadingOverlay (Mollie redirect)
- OO. Publieke tracking-link `/tx/:token`
- HHH. Avatar component met initialen
- QQQ. User avatar in account-menu
- OOO. "Vertel een vriend" CTA in TransactieReceipt
- NNN. Transactie zoeken/filteren in Dashboard
- SSS. Save payment draft (24u TTL)
- TTT. Keyboard shortcuts (Ctrl+K)

### Operations & Reliability
- C. Snyk Free tier CI
- L. Status page `/status` met live healthchecks
- LL. Maintenance mode + frontend banner
- O. Lighthouse CI baseline
- WW. Polish ronde (console.log scan)

### Performance
- G. Bundle-size verlagen (178KB main → 44KB gzip)
- M. Image performance (lazy/decoding/WebP)

### SEO
- D. JSON-LD FAQ rich snippets (12 vragen)
- J. JSON-LD HowTo schema + a11y
- F. Multi-locale URL routes /nl /tr /en /ru /az
- Sprint 3.2. 5 SEO-landing pages

### Testing
- I. Frontend Vitest setup (51 tests)

### Recurring transactions
- DD. Recurring pause/resume met ConfirmDialog
- III. Calendar .ics export
- UUU. Transaction notes (max 200 chars)

### Internal kwaliteit
- Q. font-extrabold reductie
- Sprint 2 deel 2. PaymentFlow visual cleanup

</details>

---

## 🎯 Aanbevolen volgorde voor de komende dagen

### Week 1 — wachten + reviewen
1. **Vandaag/morgen:** Cursor-account afronden → review starten met `CURSOR_REVIEW_BRIEFING.md`
2. **Deze week:** Reageren op Stefan voor DNS
3. **Deze week:** SNYK_TOKEN in GitHub Secrets zetten (5 min)
4. **Deze week:** OG-image check op opengraph.xyz

### Week 2 — feedback verwerken
1. Cursor-bevindingen verwerken (kritiek + hoog eerst)
2. CodeRabbit koppelen aan GitHub voor toekomstige PRs
3. WhatsApp Business activeren op echt nummer

### Week 3 — pre-launch
1. BV-oprichting check bij notaris → KvK env-var in Railway
2. Mollie LIVE keys in Railway (zodra BV klaar)
3. EMI-partner overeenkomst tekenen
4. Mythos pre-launch audit inplannen

### Week 4 — go-live
1. Mythos audit-bevindingen verwerken
2. Lighthouse baseline opslaan
3. WhatsApp link reactiveren in Footer
4. **Launch** 🚀

---

## 💬 Externe partijen — wie wat doet

| Partij | Doel | Status |
|---|---|---|
| **Stefan (Vormgvr)** | DNS-overdracht | E-mail klaar in `marketing/` map |
| **Notaris** | BV-oprichting + KvK | Loopt extern |
| **Mollie support** | Live keys activeren | Wacht op KvK |
| **Mythos** | Pre-launch security audit | Nog niet gecontacteerd |
| **EMI-partner** | Toezichts-overeenkomst | Onderhandeling extern |
| **Cursor** | Code-review | Wacht op Aydin's account |
| **Snyk** | Free tier token | snyk.io → token genereren |

---

## ⚠️ Bekende risico's / aandachtspunten voor Cursor

1. **FX-marge zichtbaarheid** — moet ALTIJD verborgen blijven voor users. Code-audit elke PR.
2. **DNB-claim** — overal "via EMI-partner", niet "DNB-gereguleerd".
3. **PII in tracking-link OO** — backend test bewaakt dit. Cursor mag dubbel-checken.
4. **Mock data in KoersSparkline X** — duidelijke TODO, niet misleidend genoeg? Cursor check.
5. **Audit-log retentie 90d** — Wwft-data zit in `transacties` tabel (5 jaar), niet in `audit_logs`.
6. **localStorage payment_draft SSS** — privacy: bevat IBAN/ontvanger 24u, op gedeelde devices issue?
7. **Spaardoel ontvanger_naam match BBB** — case-insensitive substring kan false positives geven (bv. 2 personen met "Mehmet" in naam).

---

## 📊 Stand van zaken numeriek

| | Aantal |
|---|---|
| Verbeteringen voltooid | **68** (A → XXX) |
| Deferred met reden | 7 (EE/FF/QQ/SS/UU/FFF/MMM) |
| Frontend tests | 51/51 groen |
| Backend tests | 294/294 groen |
| i18n keys × 5 talen | ~1100+ synchroon |
| Lijnen frontend code | ~25.000+ |
| Lijnen backend code | ~12.000+ |
| Build precache | 1389KB / 61 chunks |
| Commits sinds start | 30+ |
| Echte launch-blockers | **6** (allemaal extern) |

---

**Stop voor nu** — bouwen is klaar tot Cursor-feedback binnen is.
