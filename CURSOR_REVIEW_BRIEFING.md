# SwiftBridge — review-briefing voor externe code-reviewer

> **Doel:** onafhankelijke second-opinion op de 20 verbeteringen die de afgelopen sessies zijn gedaan, vóór go-live van swiftbridge.tr.

---

## Wat is SwiftBridge?

EUR→TRY (en TRY-zone) remittance-app. Twee repo's:
- **Frontend (deze repo):** https://github.com/Aydin-Dogan/swiftbridge-app — React 19 + Vite + Tailwind, gedeployed op Railway.
- **Backend:** https://github.com/Aydin-Dogan/swiftbridge-api — Node + Express + SQLite/Postgres, gedeployed op Railway.

Stack samenvatting:
- React 19 + Vite + Tailwind + PWA (vite-plugin-pwa)
- React Router v6 (geen regex routes — array-mapped)
- i18n custom (NL/EN/TR/RU/AZ — 663 keys × 5 talen)
- Vitest (frontend, 41 tests) + Jest (backend, 254 tests)
- Mollie payments + Onfido/Veriff/Sumsub KYC (provider-agnostisch)
- CI: i18n-check, pricing-consistency, vitest, build, npm audit, Snyk (optional), Lighthouse CI

---

## Wat is er recent gewijzigd (chronologisch)?

20 "Verbeteringen" A→Y in 5 batches, alle live op `main`:

| Batch | Commit | Verbeteringen |
|---|---|---|
| 1 | `61986dd` + `5fd6593` | A–G: dynamic pricing · skeletons · Snyk CI · FAQ JSON-LD · 404 · multi-locale routes · bundle-split |
| 2 | `ee85119` | H–J: Pricing consolidatie · Vitest setup · A11y skip-link |
| 3 | `7f50ab4` | K–O: Cookie consent · Status page · image perf · ErrorBoundary · Lighthouse CI |
| 4 | `7cdceea` | P–T: Sticky mobile CTA · font hierarchy · share-knop · dashboard empty state · footer trust-row |
| 5 | `bc80582` (frontend) + `e3d6562` (backend) | U–Y: errors backend endpoint · WhatsApp deep-link · payment overlay · koers-sparkline · referral polish |

Voor de exacte file-veranderingen per batch: `git log -p <hash>`.

---

## Belangrijke contextuele constraints (lees deze!)

1. **FX-marge moet ALTIJD verborgen blijven voor gebruikers.** Geen marge/spread zichtbaar in UI, klant ziet alleen toegepaste koers + zichtbare service-fee. Pricing-engine in `src/services/kosten.js` is hier de bron van waarheid.
2. **Geen eigen DNB-licentie.** SwiftBridge werkt via een EMI-partner. Alle UI-tekst moet "via EMI-partner" zeggen, géén "DNB-gereguleerd" zonder dat. Check footer, OG-image, FAQ, landings.
3. **KvK-nummer is een placeholder.** Notaris-traject loopt. `BRAND_KVK` env-var bestaat in backend, mag niet hardcoded zijn.
4. **Mollie LIVE key staat alleen in Railway env**, niet in repo of `.env.example`.
5. **Geen verzonnen testimonials.** TESTIMONIALS-array in `SocialProof.jsx` is bewust leeg tot we echte reviews hebben.
6. **Geen verzonnen stats.** "100+ banken / 5 talen / <5 min / vanaf 0,8%" — alleen verifieerbare claims.
7. **Klarna staat momenteel niet in de publieke tariefkaart** — Mollie heeft het nog niet geactiveerd voor ons.

---

## Specifieke review-vragen (focus hierop)

### 🔒 Security & compliance
1. **`src/components/CookieConsent.jsx`** — AVG/GDPR compliant? Granular consent, gelijkwaardige Accept/Reject (geen dark pattern)? Versie-veld werkt voor beleidwijziging?
2. **`src/components/ErrorBoundary.jsx`** — Stack trace lekt geen secrets? `POST /errors/frontend` payload (max 20KB) groot genoeg / niet te groot?
3. **Backend `swiftbridge-api/src/routes/errors.js`** — Rate-limit (20/min/IP-hash) genoeg? IP-hash + IP_SALT correct geïmplementeerd? `undefined === undefined`-trap in admin-check vermeden?
4. **`window.location.href` in clipboard/share** — kan dat ooit een token of PII bevatten?
5. **`src/components/landing/Footer.jsx`** trust-row — claims correct? Geen "DNB-gereguleerd" suggestie?
6. **`index.html`** preconnect naar `wise.com` — privacy-implicatie? (third-party DNS request voor elke bezoeker)

### 🎨 UX & conversion
7. **`src/components/landing/StickyMobileCTA.jsx`** — verschijnt/verdwijnt correct, geen layout-shift? `requestAnimationFrame` correct?
8. **`src/pages/Calculator.jsx` ShareButton** — `navigator.share` fallback flow logisch? `window.prompt` als laatste optie acceptabel?
9. **`src/components/payment/PaymentLoadingOverlay.jsx`** — overlay blokkeert dubbele submit? Aria-attributen correct?
10. **`src/components/landing/KoersSparkline.jsx`** — mock 7d-walk is duidelijk gemarkeerd als TODO en niet misleidend voor gebruiker?

### ⚙️ Code quality
11. Zijn er dood-code paden of unused imports na de 20 batches?
12. Tailwind classes consistent (geen mix van `bg-gray-50` en `bg-slate-50` zonder reden)?
13. i18n: zijn alle nieuwe keys in alle 5 talen aanwezig met dezelfde betekenis? (`node scripts/i18n-check.mjs --strict` zegt ja, maar semantisch?)
14. Test-coverage gaten? Welke nieuwe componenten zouden tests moeten hebben maar hebben ze niet?

### 🚀 Performance
15. Main bundle is 178KB (gzip 44KB), react-vendor 226KB (gzip 72KB) — verbeterpunten?
16. Lazy imports + Suspense fallbacks correct ingezet?
17. WebP og-image fallback voor oudere clients — werkt het?
18. `preload as=image` voor `/icon-192.png` — is dit het juiste LCP-asset?

### ♿ A11y
19. Focus-traps in mobile menu + cookie banner + payment overlay correct?
20. Skip-to-content link werkt? `aria-live` regions correct ingezet?
21. Sparkline mist alt-tekst/`<title>` — moet dat?

---

## Bekende open punten (mag je negeren of bevestigen)

- **`/errors/frontend` is publiek (geen auth)** — bewust, errors kunnen pre-login. Acceptabel?
- **`KoersSparkline` gebruikt mock-data** — TODO comment staat erin, vervangen wanneer backend `/fx/historie` bestaat.
- **`SNYK_TOKEN` is niet ingesteld** — Snyk job staat klaar maar runt niet. Verwacht.
- **`fx_history` tabel bestaat niet** — Verbetering X gebruikt mock-walk; backend endpoint nog te bouwen.
- **WhatsApp support-nummer ontbreekt** — link is bewust weggehaald uit Footer.
- **Lighthouse CI assertions** — performance/best-practices `warn` bij <0.85, a11y/seo `error` bij <0.9. Aanvaardbaar?

---

## Hoe te beginnen

```bash
# Frontend
git clone https://github.com/Aydin-Dogan/swiftbridge-app
cd swiftbridge-app
npm ci
npm test           # 41 vitest tests
npm run build      # productie bundle
npm run dev        # localhost:5173

# Backend
git clone https://github.com/Aydin-Dogan/swiftbridge-api
cd swiftbridge-api
npm ci
npx jest           # 254 jest tests
npm run dev        # localhost:3000
```

Belangrijke files om als eerste te lezen:
- `src/services/kosten.js` — pricing-engine (bron van waarheid voor fees)
- `src/components/landing/Hero.jsx` — landing hero met live koers + sparkline
- `src/pages/Calculator.jsx` — standalone calculator + share-flow
- `src/components/ErrorBoundary.jsx` + `swiftbridge-api/src/routes/errors.js` — error-pipeline
- `src/components/CookieConsent.jsx` — AVG/GDPR consent

---

## Wat ik graag terug zou willen zien van de review

1. **Prioriteit-gerangschikt lijst van vondsten** (Kritiek / Hoog / Medium / Laag)
2. **Per vondst:** file + regelnummer + waarom het problematisch is + voorgestelde fix
3. **Eventuele blinde vlekken** die niet in de "Specifieke review-vragen" hierboven stonden
4. **Go/no-go advies voor productie-launch** met motivatie

Voorbeeld output-format:
```
🔴 KRITIEK — src/routes/errors.js:78
   `userAgent` wordt opgeslagen zonder sanitization. Een PII-rijke UA kan
   in de DB belanden die later geëxporteerd wordt. Hash of strip net als
   IP doe je.

🟡 MEDIUM — src/components/landing/KoersSparkline.jsx:30
   Seed gebruikt `Math.round(huidigeKoers * 1000)` — bij koers-update
   springt de curve. Vergrendel seed op een UTC-date i.p.v. koers.
```

Dank!
