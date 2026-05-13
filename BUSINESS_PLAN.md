# SwiftBridge — Business Plan v3

> EUR → TRY money transfer platform, NL → TR
> **Status:** bèta — geen eigen DNB-vergunning, werkt via gelicentieerde EMI/PSP-partner (agent-model)
> Beoogde commerciële start: Q3 2026 (na agentschap-onboarding)
> **Versie 3 wijzigingen:** consistente run-rate vs cumulatief, conservatievere groei, juridisch correcte claims, scenario-banden

---

## 1. Executive summary

**Probleem:**
- 469.000+ mensen met Turkse achtergrond in Nederland
- Bestaande oplossingen (banken, Wise, Western Union) zijn traag (1-5 dagen), duur (3-6%), of zwak in service voor Turks-Nederlandse community
- Geen partij die zich uitsluitend richt op deze corridor

**Oplossing:**
- 100% mobiele PWA + iOS/Android apps
- Doel-aankomsttijd: < 5 minuten voor terugkerende transacties (eerste keer: 5–15 min KYC + bank-setup)
- Effectieve kosten 2,0–2,5% (concurrerend met Wise op snelheid + service, niet op laagste prijs)
- Turks kimlik geaccepteerd voor KYC (eerste generatie Turkse Nederlanders heeft vaak alleen TR-document)
- Volledig Nederlands + Türkçe + English, met support in Turks

**Differentiatie t.o.v. concurrenten:**
- Specialisatie op NL → TR corridor (Wise/Revolut zijn generiek)
- Culturele features (Bayram/Ramadan, family profielen)
- Service in Turks
- Sub-5-min aankomst voor terugkerende gebruikers

**Wat we expliciet NIET claimen:**
- ❌ Wij zijn geen bank
- ❌ Wij hebben geen eigen DNB-vergunning (komt mogelijk in jaar 2-3)
- ❌ Wij beloven niet ALTIJD <5 minuten — alleen vanaf 2e transactie met goedgekeurde KYC

---

## 2. Markt analyse

### Doelgroep (segmenten)
- **Primair:** Turks-Nederlandse families (1e + 2e generatie) — geschatte populatie 470K, actieve remitters ~150–250K
- **Secundair:** Turkse expats / studenten — ~50K
- **Tertiair:** Nederlanders met TR-banden (vakantiehuis, business) — ~30K

### Marktomvang NL → TR remittances (bandbreedte)
| Bron | Volume per jaar |
|------|-----------------|
| World Bank Remittance Data 2024–2025 | €1,0–1,8 mld |
| CBS / Eurostat schattingen | €0,9–1,1 mld |
| **Conservatief uitgangspunt voor planning** | **€1,0 miljard** |

### Concurrenten
| Concurrent | Snelheid (realiteit) | Kosten effectief | Service in Turks |
|------------|---------------------|------------------|------------------|
| ING / ABN / Rabo (SEPA) | 3–5 werkdagen | 3–6% | Beperkt |
| Wise (regulier transfer) | 1–2 dagen (vaak sneller via "instant") | 0,5–1,5% + spread | Beperkt |
| Wise Instant | Minuten | 0,5–1,5% + spread | Beperkt |
| Revolut | 2–3 dagen | 2–6% (premium tarieven anders) | Beperkt |
| Western Union (kantoor) | Direct | 5–12% | Wisselend |
| MoneyGram / Ria | Direct–uren | 4–8% | Wisselend |

**SwiftBridge positionering:** Niet de goedkoopste, maar **snelste corridor-specialist met service in Turks en kimlik-acceptatie**.

⚠️ **Realiteitscheck:** Wise kan via Instant Transfer ook minuten halen. Onze claim moet zijn "consistent <5 min in deze corridor + service" — niet "wij zijn de enigen die snel zijn".

---

## 3. Business model

### Inkomsten per transactie
1. **FX marge:** 0,4–0,7% op de wisselkoers (in koers verwerkt — transparant gecommuniceerd)
2. **Service fee:** 1,3–2,1% afhankelijk van bedrag
3. **Totaal effectief:** 2,0–2,5%

### Fee tiers
| Bedrag | Service fee | Voorbeeld effectieve kosten |
|--------|-------------|----------------------------|
| €10–200 | 2,5% | Hoog % door minimumkosten |
| €201–500 | 2,0% | €450 → ~€11 totale kosten |
| €501–1.000 | 1,7% | — |
| €1.001–5.000 | 1,5% | — |

### Gebruikerslimieten
- Per transactie: €10 – €5.000
- **Per week: €5.000** (compliance + partnerafspraken in agentschap fase 1)
- Per maand: na agent-koppeling herzien op basis van partnervoorwaarden

---

## 4. Volume projecties — DRIE SCENARIO'S

> Belangrijk: cijfers zijn **conservatief–realistisch**. Vermijd te optimistische investor-pitches.
> Definities:
> - **Run-rate maand X** = volume die maand
> - **Cumulatief jaar X** = som over 12 maanden (~6× december-run-rate)

### Scenario A — Conservatief (bottom case, ~70% kans)

| Periode | MAU (maand) | Tx/maand | Gem. bedrag | Run-rate volume | Cumulatief volume (sinds start) |
|---------|------------|----------|-------------|-----------------|--------------------------------|
| M1 launch Q3'26 | 80 | 40 | €380 | €15K | €15K |
| M3 | 350 | 220 | €390 | €86K | €130K |
| M6 | 1.200 | 900 | €400 | €360K | €1,2M |
| M9 | 2.500 | 2.100 | €410 | €860K | €4,2M |
| M12 (eind jaar 1) | 4.500 | 4.000 | €420 | €1,7M | **€11M cumulatief** |
| M24 (eind jaar 2) | 15.000 | 16.000 | €430 | €6,9M | **€53M cumulatief** |
| M36 (eind jaar 3) | 35.000 | 42.000 | €440 | €18M | **€160M cumulatief** |

**Jaar 1 (cumulatief, conservatief):** ~€11M volume, ~€235K omzet (2,1% gemiddeld effectief)

### Scenario B — Realistisch (base case, ~50% kans)

| Periode | MAU | Tx/maand | Run-rate volume |
|---------|-----|----------|-----------------|
| M12 | 8.000 | 7.500 | €3,1M |
| M24 | 28.000 | 32.000 | €13M |
| M36 | 65.000 | 90.000 | €38M |

**Jaar 1 cumulatief:** ~€20M volume, ~€440K omzet

### Scenario C — Optimistisch (best case, ~20% kans, vereist viral groei)

| Periode | MAU | Tx/maand | Run-rate volume |
|---------|-----|----------|-----------------|
| M12 | 15.000 | 18.000 | €7,7M |
| M24 | 50.000 | 70.000 | €30M |
| M36 | 130.000 | 220.000 | €95M |

**Jaar 1 cumulatief:** ~€38M volume, ~€820K omzet

> ⚠️ **Pitch-discipline:** investeerders presenteren Scenario A en B. Scenario C alleen als "upside / als alles klopt" — niet als plan.

---

## 5. Kosten structuur — herzien op werkelijke partnerverwachting

### Vaste kosten per maand (eerste 12 maanden)

| Categorie | Conservatief | Realistisch |
|-----------|--------------|-------------|
| Agent partner setup eenmalig €15K + maandfee | €2.500 | €3.500 |
| Hosting (Railway/Neon/Vercel/Resend) | €150 | €250 |
| Compliance officer (extern, ~8u/maand) | €1.800 | €2.500 |
| Boekhouder + juridisch | €600 | €800 |
| Marketing — community & content | €1.000 | €3.000 |
| Verzekering (cyber + aansprakelijkheid) | €350 | €500 |
| Software (Sentry, monitoring, support tools) | €300 | €500 |
| Support medewerker NL+TR (deeltijd vanaf M4) | €0 → €1.500 | €2.000 |
| **Totaal vaste kosten/maand** | **€6.700–8.200** | **€11.000–13.000** |

> Eerder plan ging uit van €7.600/maand — dit klopt voor conservatief scenario maar laat geen ruimte voor groei. Realistisch budget is €11–13K.

### Variabele kosten per transactie

| Post | Conservatief | Realistisch |
|------|--------------|-------------|
| Agent partner % van bedrag | 0,5% | 0,8% |
| iDEAL/SEPA processing | €0,29 | €0,29 |
| Klantenservice minuten (eerste jaar 20×) | €0,30 | €0,60 |
| Fraude/chargeback buffer (0,1%) | €0,45 | €0,45 |
| FX residual risk (klein) | €0,10 | €0,20 |
| **Totaal variabele kosten op €450 tx** | **~€3,40** | **~€5,40** |

### Netto contributie per transactie
| Scenario | Bruto inkomsten | Variabele kosten | **Netto per tx** |
|----------|-----------------|------------------|-----------------|
| Conservatief | €9,90 | €3,40 | **€6,50** |
| Realistisch | €9,90 | €5,40 | **€4,50** |

### Break-even punt

- **Conservatief €7.500/maand vaste kosten** ÷ €6,50 netto/tx = **~1.150 tx/maand**
- **Realistisch €12.000/maand vaste kosten** ÷ €4,50 netto/tx = **~2.700 tx/maand**

In conservatieve scenario A: break-even rond **M10–M12** (gevaarlijk dichtbij run-out van runway).
In realistisch scenario B: break-even rond **M8–M10**.

> Conclusie: runway moet **18+ maanden** zijn om door deze fase te komen.

---

## 6. Unit economics & LTV/CAC

### Aannames per actieve remitter
- Gemiddelde transactiefrequentie: **4–8 tx/jaar** (Western Union research geeft mediaan 3–6; jouw doelgroep iets actiever)
- Gemiddelde tx-bedrag: €430
- Netto contribution per tx: €4,50 (realistisch)
- **Jaarlijkse LTV:** €4,50 × 6 = **€27 per gebruiker per jaar**
- **Retentie:** 60% jaar 2, 45% jaar 3 (remittance is sticky maar Turkse migratie afnemend)
- **3-jaars LTV:** €27 + €16 + €12 ≈ **€55**

### CAC plafond
- Maximaal **€15–18 CAC** voor gezonde unit economics
- Concreet: 1 transactie/€450 dekt acquisitie van 1 nieuwe gebruiker — dat moet kunnen via referrals + community

> Geen Google/Facebook spray-and-pray ads tot M9. Community-driven groei eerst.

---

## 7. Compliance — kraakhelder voor toezicht en gebruikers

### Fase 1 (jaar 0–2): Agent-model
- **Werken onder vergunning van EMI/PSP-partner** (Currencycloud / Wise Platform / Nium / Banking Circle)
- **SwiftBridge B.V. heeft GEEN eigen DNB-vergunning** — dit moet expliciet in alle gebruikerscommunicatie
- Wij doen KYC, partner doet payment processing en geld-uitgifte
- Partner monitort transactiestromen; wij leveren transactiedata
- Aansprakelijkheid: gedeeld volgens contractuele afspraak

### Fase 2 (jaar 2-3): Eigen EMI-licentie
- Kapitaalvereiste: €350.000
- Onboarding doorloop: 12–18 maanden
- Vereist: SIRA, AML-handboek, compliance officer in dienst, geauditeerde procedures
- Pas overwegen bij stabiele €100M+ volume/jaar

### Compliance functies al ingebouwd (technisch)
- ✅ KYC: paspoort, ID-kaart, Turks kimlik, rijbewijs + selfie
- ⚠️ KYC document upload nog placeholder — moet voor livegang naar S3-storage
- ✅ AML transactiemonitoring via audit logs
- ✅ Audit log met SHA-256 hash chaining (tamper-evident)
- ✅ Sanctielijst screening (handmatig nu, automatiseren met partner)
- ✅ Limieten €5.000/week
- ✅ Source-of-funds vragen bij hoge bedragen
- ⚠️ Identity matching tussen documentfoto + selfie nog niet automatisch

---

## 8. Financiering — herzien

### Benodigd kapitaal voor 18 maanden runway

| Post | Conservatief | Realistisch |
|------|--------------|-------------|
| Agent partner setup | €15.000 | €20.000 |
| 18 maanden vaste kosten | €135.000 | €220.000 |
| Werkkapitaal voor agent settlement | €75.000 | €150.000 |
| App store / dev tooling | €5.000 | €8.000 |
| Marketing budget (18 maanden) | €25.000 | €60.000 |
| Compliance & juridische buffer | €30.000 | €50.000 |
| Operationele buffer (20%) | €60.000 | €100.000 |
| **Totaal voor 18 maanden** | **€345.000** | **€608.000** |

### Bronnen (gefaseerd)
| Bron | Conservatief | Realistisch |
|------|--------------|-------------|
| Bootstrap (founder) | €30.000 | €50.000 |
| Friends & family (10–15% equity) | €100.000 | €150.000 |
| Qredits / RVO subsidie/lening | €75.000 | €100.000 |
| Angel investor (15–20% equity) | €140.000 | €300.000 |
| **Totaal** | **€345.000** | **€600.000** |

---

## 9. Go-to-market — eerste 100 gebruikers

### Concreet plan (≤ €1.000 cash, zwaar op tijd)

**Maand 1–2 (founding):**
1. **20 founding families** — eigen netwerk, 1-op-1 begeleid eerste transactie, video-testimonial vastleggen
2. **2 micro-influencers** (5K–30K NL-TR followers) — performance deal: gratis 1e transactie + €X per actieve user
3. **2 moskeeën / verenigingen** — informatieavond + QR-code, sponsor koffie

**Maand 3–6:**
4. **Turkse ondernemers** (kappers, telefoonwinkels, eethoeken) als trust-nodes met poster
5. **Dubbele referral** (€5 verzender + €5 ontvanger) — alleen activeren als support kan meekomen
6. **WhatsApp-community admins** benaderen (met respect, geen spam)

**Top 3 prioriteit kanalen:**
1. **Fysieke demo's** op familie-events en zondagse drukteplekken (extreem effectief in eerste 100)
2. **Trusted community nodes** (bakkal, dorpshoofd, vereniging) — informeel netwerk
3. **WhatsApp-groepen** via vertrouwde introductie

---

## 10. Killer features roadmap (uit Cursor business review)

Prioritering: 5 features in eerste 6 maanden, rest in jaar 2.

### Direct in eerste release (M1–M3)
1. **"Naar mama/papa" profielen** — opgeslagen begunstigden met label, foto, 1-tik herhalen ⭐ S-effort
2. **Transparante koers** — "wat papa op rekening ziet in TRY" zonder spread-jargon ⭐ S-effort
3. **Volledige TR vertaling** incl. support-scripts + foutmeldingen ⭐ M-effort

### M4–M6
4. **Bayram & Ramadan herinneringen** — culturele kalender + suggesties ⭐ M-effort
5. **WhatsApp-deelstatus** — "Ik heb gestuurd" kaartje voor familie ⭐ S-effort

### Jaar 2
6. Gezamenlijke pot (chip-in voor TR doelen) — L-effort, vereist compliance check
7. Zakat / moskee donaties met erkende partners — L-effort, regulatoir
8. Snelheid-garantie met fee-credit compensatie — operationeel
9. Referral met sociale proof aggregaten — privacy-safe
10. Trust-content (waarom legaal beter is dan grijze kanalen) — content-marketing

---

## 11. Risico's — eerlijke analyse met mitigatie

| Risico | Kans | Impact | Mitigatie (concreet) |
|--------|------|--------|---------------------|
| Agent partner: te duur, lange onboarding, restrictief | **Middel** | Hoog | 2 partners parallel onderhandelen, geen marketingbelofte vóór live tarief |
| Wise/Revolut kapen niche met instant + service | **Hoog** | Middel | Cultureel/family features die zij niet bouwen, service in Turks |
| TRY hyperinflatie / TR kapitaalrestricties | **Hoog** | Middel-Hoog | FX-lock 30s, scenarioplan voor corridor-uitval |
| DNB/AFM klacht via partner | **Laag-Middel** | Hoog | Strikt agent-contract, audit logs, incident response playbook |
| Fraude / APP-scams / social engineering | Middel | Hoog | 2FA standaard, device binding, "wij vragen nooit om..."-content |
| Hoge supportkosten eerste 100 users | **Hoog** | Middel | Concierge eerste 100, daarna Turkse voice notes + FAQ + async |
| CAC > LTV door duurder marketing | Middel | Hoog | Eerst community-only (€0 CAC), Google ads pas vanaf M9 |
| Founder burnout / single point of failure | Middel | Hoog | Co-founder zoeken na 100 users; documentatie alles |

---

## 12. Team

### Nu (M0)
- **Aydin Dogan** — Founder, productontwikkeling, sales

### M3–M6
- **Compliance officer** (extern parttime, freelance)
- **Customer support** (Turks+Nederlands, parttime vanaf 100 users)

### M9–M12
- **Marketing lead** (community-focused)
- **Co-founder / CTO** als tweede teamlid

### Jaar 2
- Compliance officer fulltime
- 2–3 support medewerkers
- Junior developer
- Designer parttime

---

## 13. 3 prioriteiten deze week

Uit Cursor business review:
1. **Juridische taal alignment** — alle "DNB gereguleerd" claims weghalen, partner-relatie expliciet maken
2. **Real happy-path meten** — tijd van landing tot server-bevestigde transactie, fix false success in UI ✅ (gedaan)
3. **Financieel model rechttrekken** — run-rate vs cumulatief consistent ✅ (deze versie v3)

---

## Bijlagen

- A. **CAPACITOR_SETUP.md** — iOS/Android app build instructies
- B. **CURSOR_PROMPT_SECURITY.md** — security audit prompt
- C. **CURSOR_PROMPT_BUSINESS.md** — business review prompt
- D. KvK uittreksel + UBO verklaring — TODO
- E. Compliance handboek — TODO
- F. Agent partner shortlist + offertes — TODO

---

*Versie 3 — mei 2026 — Bijgewerkt op basis van Cursor business review*
