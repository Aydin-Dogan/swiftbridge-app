# SwiftBridge — Business Plan v2

> EUR → TRY money transfer platform, NL → TR onder 5 minuten
> Beoogde start: Q3 2026 (na agentschap goedkeuring)

---

## 1. Samenvatting

**Probleem:**
- 469.000+ mensen met Turkse achtergrond in Nederland
- Bestaande oplossingen (banken, Wise, Western Union) zijn traag (1-5 dagen), duur (3-6%), of vragen onnodig veel documenten
- Geen partij die zich uitsluitend richt op deze corridor met focus op snelheid en gemak

**Oplossing:**
- 100% mobiele PWA + iOS/Android apps
- Aankomst < 5 minuten in 95% van transacties
- Totale kosten 2,0-2,5% (concurrerend met Wise, sneller dan iedereen)
- Turks kimlik geaccepteerd voor KYC (uniek!)
- Volledig in Nederlands, Turks en Engels

**Onderscheidend vermogen:**
- Enige NL → TR specialist
- Echte sub-5-min aankomst (echt, niet gemiddeld)
- Kimlik-vriendelijk (eerste generatie Turkse Nederlanders vaak alleen kimlik)
- 24/7 zonder kantooruren

---

## 2. Markt analyse

### Doelgroep
- **Primair:** Turks-Nederlandse families (1e + 2e generatie) — ~250.000 actieve remitters
- **Secundair:** Turkse expats/studenten in NL — ~50.000
- **Tertiair:** Nederlanders met TR vakantiehuis / business — ~30.000

### Marktomvang (NL → TR remittances)
| Bron | Volume per jaar |
|------|-----------------|
| World Bank Remittance Data 2025 | €1,2 - 1,8 miljard |
| Centraal Bureau Statistiek (TR transfers) | €950M - 1,1 miljard |
| **Conservatieve schatting marktomvang** | **€1,0 miljard** |

### Concurrenten
| Concurrent | Snelheid | Kosten | Marktaandeel NL→TR (schatting) |
|------------|----------|--------|-------------------------------|
| ING / ABN AMRO / Rabobank | 3-5 werkdagen | 3-6% | ~45% |
| Wise (TransferWise) | 1-2 werkdagen | 0,5-1,5% | ~20% |
| Revolut | 2-3 dagen | 2-6% | ~10% |
| Western Union | Direct (kantoor) | 5-12% | ~10% |
| MoneyGram / Ria | Direct | 4-8% | ~5% |
| **Overige + Hawala** | Variabel | Variabel | ~10% |

**SwiftBridge positionering:** Tussen Wise (qua kosten) en Western Union (qua snelheid) — beste van beide werelden.

---

## 3. Business model

### Inkomsten
1. **FX marge:** 0,4 - 0,7% op de wisselkoers (verborgen in koers)
2. **Service fee:** 1,3 - 2,1% afhankelijk van bedrag (transparant)
3. **Totaal:** 2,0 - 2,5% effectief per transactie

### Fee tiers
| Bedrag | Fee % | Voorbeeld bij €500 |
|--------|-------|--------------------|
| €10 - €200 | 2,5% | — |
| €201 - €500 | 2,0% | €10 fee |
| €501 - €1.000 | 1,7% | — |
| €1.001 - €5.000 | 1,5% | — |

### Limieten (per gebruiker)
- Per transactie: €10 - €5.000
- **Per week: €5.000** (compliance + DNB ongelicenseerd traject)
- Per maand: €15.000 (na agentschap activering)

---

## 4. Verwacht volume (aangepast/realistischer)

### Aannames jaar 1 (eerste 12 maanden)
- Lancering Q3 2026 (na agentschap)
- Conservatieve groei via mond-tot-mond + influencer marketing in Turks-NL community

| Periode | Actieve gebruikers | Transacties/maand | Gem. bedrag | Volume/maand | Inkomsten (2,2%) |
|---------|-------------------|-------------------|-------------|--------------|------------------|
| Q3-Q4 2026 (lancering) | 200 → 800 | 100 → 600 | €350 | €35K → €210K | €0,8K → €4,6K |
| Q1 2027 | 2.000 | 1.800 | €400 | €720K | €15.840 |
| Q2 2027 | 4.500 | 4.200 | €420 | €1,76M | €38.800 |
| Q3 2027 | 8.000 | 8.500 | €450 | €3,8M | €83.600 |
| Q4 2027 | 12.000 | 14.000 | €480 | €6,7M | €147.600 |

**Jaar 1 totaal (afgerond):**
- ~12.000 actieve gebruikers
- ~50.000 transacties
- **€22M overgemaakt volume**
- **~€485.000 bruto omzet**

### Jaar 2 (2028)
- 35.000 actieve gebruikers
- ~250.000 transacties
- **€115M volume**
- **~€2,5M bruto omzet**

### Jaar 3 (2029) — break-even punt
- 75.000 actieve gebruikers
- ~600.000 transacties
- **€280M volume** (~25% van NL→TR markt)
- **~€6,2M bruto omzet**

**Doel jaar 5:** 150.000+ gebruikers, €600M volume per jaar.

---

## 5. Kosten structuur

### Vaste kosten (per maand, eerste 12 maanden)
| Categorie | Kosten/maand |
|-----------|--------------|
| Agent partner setup (eenmalig €15.000) + maandelijks abonnement | €2.500 |
| Hosting (Railway, Neon, Vercel, Resend) | €150 |
| Compliance officer (extern, deeltijd) | €1.800 |
| Boekhouder + juridisch | €600 |
| Marketing (social media + ads in Turkse community) | €2.000 |
| Verzekering (cyber + aansprakelijkheid) | €350 |
| Software tools (Sentry, monitoring, etc.) | €200 |
| **Totaal vaste kosten** | **~€7.600/maand** |

### Variabele kosten per transactie
- Agent partner kosten: 0,5 - 1,0% van bedrag
- Payment processor (Mollie iDEAL): €0,29 per transactie
- **Marge na variabele kosten:** ~1,0 - 1,3% per transactie

### Break-even
- ~€760.000 volume per maand om vaste kosten te dekken
- = ~1.700 transacties per maand
- = ~3.500 actieve gebruikers (50% maandelijkse activiteit)
- **Verwacht bereikt:** Q2 2027

---

## 6. Compliance & licenties

### Fase 1 (start) — Agentschap
- **Geen eigen DNB-licentie** vereist
- Werken **onder de licentie** van een EMI/PSP-partner
- Mogelijke partners:
  - **Currencycloud** (Visa) — sterk in NL, white-label
  - **Wise Platform** — bekend merk, hogere geloofwaardigheid
  - **Nium** — sterke TR corridor
- Onze KYC/AML procedures gelden, maar de **partner is de licentiehouder**

### Fase 2 (jaar 2-3) — Eigen licentie
- Aanvraag **EMI-licentie** bij DNB (kapitaalvereiste €350K)
- Stappen:
  1. Compliance officer in dienst nemen
  2. SIRA (Systematic Integrity Risk Analysis) opstellen
  3. AML/CFT-handboek
  4. Documentatie KYC/CDD-proces (✅ hebben we!)
  5. Aanvraag indienen — doorlooptijd ~12 maanden

### Compliance al ingebouwd in app
- ✅ KYC: paspoort, ID, Turks kimlik, selfie verificatie
- ✅ AML transactiemonitoring (audit logs met hash chaining)
- ✅ Sanctielijst screening (handmatig nu — automatiseren bij agent)
- ✅ Limieten (€5.000/week per gebruiker)
- ✅ Source-of-funds vragen bij hoge bedragen
- ✅ Tamper-proof audit logs (SHA-256 chaining)

---

## 7. Financiering

### Benodigd kapitaal jaar 1
| Post | Bedrag |
|------|--------|
| Agent partner setup | €15.000 |
| Eerste 12 maanden vaste kosten | €91.000 |
| Werkkapitaal voor agent settlement (rolling 48u) | €100.000 |
| App store / certificaten / icon design | €5.000 |
| Marketing budget jaar 1 | €30.000 |
| Buffer / juridisch | €25.000 |
| **Totaal** | **€266.000** |

### Bronnen
1. **Bootstrapping** (eigen geld): €50.000
2. **Angel investor / friends & family:** €100.000 voor 10-15% equity
3. **Subsidie / loan (Qredits / RVO)**: €50.000 - €100.000

### Exit / lange termijn
- Optie 1: Acquisitie door bestaande PSP/bank (Wise, Adyen, ING)
- Optie 2: Doorgroei naar volledige Europa → MENA corridor specialist
- Optie 3: Eigen DNB-licentie + Series A funding

---

## 8. Marketing & groei strategie

### Fase 1 (eerste 6 maanden) — community building
- **Influencer marketing** in Turks-NL community (Instagram, TikTok)
- **Mosque/cultureel centrum** partnerships
- **Referral programma:** €5 voor verwijzer + ontvanger
- **Verloskundigen / Turkse winkels** als offline distributiepunten

### Fase 2 (6-12 maanden) — schaal
- Google Ads (Turkse zoektermen)
- Facebook/Instagram retargeting
- TikTok content creators
- Turkse media (Sabah NL, etc.)

### Fase 3 (jaar 2) — B2B
- KMO Turks-NL ondernemers
- Mosque + community organisaties
- Geld terugsturen voor families

---

## 9. Team

### Nu (jaar 0)
- **Aydin Dogan** — Founder, productontwikkeling

### Op te bouwen (jaar 1)
- **Compliance officer** (extern, deeltijd) — fase 1
- **Customer support** (Turks + Nederlands sprekend) — vanaf maand 3
- **Marketing manager** — vanaf maand 6

### Jaar 2-3
- Eigen compliance officer (fulltime)
- 2-3 customer support medewerkers
- Backend developer
- Frontend developer
- Marketing team (2 personen)

---

## 10. Risico's & mitigatie

| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| Agent partner stopt | Hoog | Laag | Backup partner in voorbereiding |
| TRY instabiliteit / hyperinflatie | Middel | Hoog | FX rate locked per transactie, max 30s exposure |
| Concurrent (Wise) verlaagt prijs | Middel | Middel | Snelheid + kimlik onderscheidt ons |
| Fraude / chargebacks | Hoog | Laag | KYC + 2FA + transactiemonitoring |
| DNB klacht / handhaving | Hoog | Laag | Strikte compliance via agent, audit logs |
| Technische storingen | Middel | Middel | Multi-region hosting, monitoring |

---

## Bijlages

- A. Product roadmap (zie ROADMAP.md)
- B. Compliance procedures (zie AML_PROCEDURES.md — nog op te stellen)
- C. KvK uittreksel + UBO verklaring (nog op te halen)

---

*Laatste update: mei 2026*
