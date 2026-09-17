/**
 * parser.js — kleine, veilige markdown-parser voor de juridische documenten.
 *
 * Levert een boom van gewone objecten op (blokken + inline-knopen); de
 * React-renderer (markdown.jsx) zet die om naar elementen. Er wordt NOOIT HTML
 * geïnterpreteerd: alles wat geen ondersteunde markdown is, blijft platte tekst.
 *
 * Ondersteund (bewust beperkt tot wat de documenten gebruiken):
 *   #/##/### koppen (met ankers), alinea's, **vet**, *cursief*, [tekst](url),
 *   '-'-lijsten, genummerde lijsten, tabellen, '---', '>'-blokken.
 * Alinea's als "13.2 Kom je ..." blijven gewone alinea's (geen lijst).
 */

/** Anker-slug: kleine letters, accenten weg, niet-alfanumeriek -> '-', geen dubbele '-'. */
export function slugify(tekst) {
  return String(tekst ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Platte tekst van een inline-markdownfragment (voor ankers en inhoudsopgave). */
export function plattetekst(tekst) {
  return String(tekst ?? '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}

// ── Veilige links ───────────────────────────────────────────────────────────

/**
 * Geeft een veilige href terug, of null als de url niet is toegestaan.
 * Toegestaan: interne paden (/...), ankers (#...), http(s), mailto en tel.
 */
export function veiligeHref(url) {
  const u = String(url ?? '').trim();
  if (!u) return null;
  if (/[\s<>"'`\\]/.test(u)) return null;
  if (u.startsWith('#')) return /^#[A-Za-z0-9\-_.]+$/.test(u) ? u : null;
  if (u.startsWith('/')) return u.startsWith('//') ? null : u;
  if (/^https?:\/\/[A-Za-z0-9.-]+(?::\d+)?(\/[^\s]*)?$/i.test(u)) return u;
  if (/^mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i.test(u)) return u;
  if (/^tel:\+?[0-9 ()-]{3,}$/i.test(u)) return u;
  return null;
}

// ── Inline ──────────────────────────────────────────────────────────────────

const INLINE_PATRONEN = [
  { type: 'vet', re: /\*\*(?=\S)([\s\S]*?\S)\*\*/ },
  { type: 'cursief', re: /\*(?=[^\s*])([^*]*?[^\s*])\*/ },
  { type: 'link', re: /\[([^\]\n]+)\]\(([^)\s]+)\)/ },
  { type: 'email', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/ },
  { type: 'www', re: /\bwww\.[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:\/[^\s)]*[^\s).,;:!?])?/ },
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Bouwt de matcher voor kruisverwijzingen naar andere documenten, bijv.
 * "Voorwaarden Betaaldiensten, artikel 11" of "artikel 12 van de Algemene Voorwaarden".
 */
function maakVerwijzingMatcher(verwijzingen) {
  if (!verwijzingen || verwijzingen.length === 0) return null;
  const opNaam = new Map(verwijzingen.map((v) => [v.naam, v]));
  const namen = [...opNaam.keys()].sort((a, b) => b.length - a.length).map(escapeRegex).join('|');
  const re = new RegExp(`artikel\\s+(\\d+)\\s+van\\s+de\\s+(${namen})|(${namen})(?:,?\\s+artikel\\s+(\\d+))?`, 'g');
  return { re, opNaam };
}

function splitsVerwijzingen(tekst, matcher, opties) {
  if (!matcher) return [{ type: 'tekst', waarde: tekst }];
  const uit = [];
  let vanaf = 0;
  matcher.re.lastIndex = 0;
  let m;
  while ((m = matcher.re.exec(tekst)) !== null) {
    const naam = m[2] || m[3];
    const artikel = m[1] || m[4] || null;
    const verwijzing = matcher.opNaam.get(naam);
    let href = null;
    if (verwijzing) {
      const eigenDocument = verwijzing.slug === opties.huidigeSlug;
      if (eigenDocument) {
        href = artikel ? `#artikel-${artikel}` : null;
      } else {
        const basis = opties.routeVoor ? opties.routeVoor(verwijzing.slug) : verwijzing.route;
        href = basis ? `${basis}${artikel ? `#artikel-${artikel}` : ''}` : null;
      }
    }
    if (!href) continue;
    if (m.index > vanaf) uit.push({ type: 'tekst', waarde: tekst.slice(vanaf, m.index) });
    uit.push({ type: 'link', href, intern: true, kinderen: [{ type: 'tekst', waarde: m[0] }] });
    vanaf = m.index + m[0].length;
  }
  if (vanaf < tekst.length) uit.push({ type: 'tekst', waarde: tekst.slice(vanaf) });
  return uit;
}

/**
 * Parseert inline-markdown naar knopen:
 *   { type: 'tekst', waarde } | { type: 'vet'|'cursief', kinderen }
 *   { type: 'link', href, intern, extern, kinderen }
 *
 * opties.verwijzingen: [{ naam, slug, route }] voor automatische kruisverwijzingen.
 * opties.huidigeSlug:  slug van het document zelf (geen link naar zichzelf).
 * opties.routeVoor:    (slug) => route, bijv. voor archiefversies.
 */
export function parseInline(tekst, opties = {}) {
  const sub = opties._matcher !== undefined ? opties : maakInlineOpties(opties);
  return parseInlineIntern(String(tekst ?? ''), sub, false);
}

/** Bereidt inline-opties één keer voor (bouwt de verwijzings-matcher), voor hergebruik per blok. */
export function maakInlineOpties(opties = {}) {
  return { ...opties, _matcher: maakVerwijzingMatcher(opties.verwijzingen) };
}

function parseInlineIntern(tekst, opties, binnenLink) {
  const knopen = [];
  let rest = tekst;
  while (rest.length > 0) {
    let beste = null;
    for (const patroon of INLINE_PATRONEN) {
      if (binnenLink && patroon.type !== 'vet' && patroon.type !== 'cursief') continue;
      const m = patroon.re.exec(rest);
      if (m && (beste === null || m.index < beste.m.index)) beste = { patroon, m };
    }
    if (!beste) {
      knopen.push(...tekstKnopen(rest, opties, binnenLink));
      break;
    }
    const { patroon, m } = beste;
    if (m.index > 0) knopen.push(...tekstKnopen(rest.slice(0, m.index), opties, binnenLink));

    if (patroon.type === 'vet' || patroon.type === 'cursief') {
      knopen.push({ type: patroon.type, kinderen: parseInlineIntern(m[1], opties, binnenLink) });
    } else if (patroon.type === 'link') {
      const href = veiligeHref(m[2]);
      if (href) {
        knopen.push(linkKnoop(href, parseInlineIntern(m[1], opties, true)));
      } else {
        // Onveilige of ongeldige url: toon alleen de linktekst, zonder link.
        knopen.push(...parseInlineIntern(m[1], opties, binnenLink));
      }
    } else if (patroon.type === 'email') {
      knopen.push(linkKnoop(`mailto:${m[0]}`, [{ type: 'tekst', waarde: m[0] }]));
    } else if (patroon.type === 'www') {
      knopen.push(linkKnoop(`https://${m[0]}`, [{ type: 'tekst', waarde: m[0] }]));
    }
    rest = rest.slice(m.index + m[0].length);
  }
  return samenvoegen(knopen);
}

function linkKnoop(href, kinderen) {
  const intern = href.startsWith('/') || href.startsWith('#');
  const extern = /^https?:/i.test(href);
  return { type: 'link', href, intern, extern, kinderen };
}

function tekstKnopen(tekst, opties, binnenLink) {
  if (binnenLink) return [{ type: 'tekst', waarde: tekst }];
  return splitsVerwijzingen(tekst, opties._matcher, opties);
}

function samenvoegen(knopen) {
  const uit = [];
  for (const k of knopen) {
    const vorige = uit[uit.length - 1];
    if (k.type === 'tekst' && vorige && vorige.type === 'tekst') vorige.waarde += k.waarde;
    else if (k.type !== 'tekst' || k.waarde) uit.push(k);
  }
  return uit;
}

// ── Blokken ─────────────────────────────────────────────────────────────────

const RE_KOP = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
const RE_SCHEIDING = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
const RE_UL = /^\s{0,3}[-*+]\s+(.*)$/;
const RE_OL = /^\s{0,3}(\d{1,9})[.)]\s+(.*)$/;
const RE_CITAAT = /^\s{0,3}>\s?(.*)$/;
const RE_TABEL_SCHEIDING = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function isTabelRij(regel) {
  return /^\s*\|/.test(regel);
}

function isTabelStart(regels, i) {
  return isTabelRij(regels[i]) && i + 1 < regels.length && RE_TABEL_SCHEIDING.test(regels[i + 1]) && regels[i + 1].includes('-');
}

function splitsCellen(regel) {
  let r = regel.trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|') && !r.endsWith('\\|')) r = r.slice(0, -1);
  const cellen = [];
  let huidig = '';
  for (let k = 0; k < r.length; k++) {
    const c = r[k];
    if (c === '\\' && r[k + 1] === '|') { huidig += '|'; k++; continue; }
    if (c === '|') { cellen.push(huidig.trim()); huidig = ''; continue; }
    huidig += c;
  }
  cellen.push(huidig.trim());
  return cellen;
}

function isBlokStart(regels, i) {
  const r = regels[i];
  return RE_KOP.test(r) || RE_SCHEIDING.test(r) || RE_UL.test(r) || RE_OL.test(r)
    || RE_CITAAT.test(r) || isTabelStart(regels, i);
}

/**
 * Parseert markdown naar blokken:
 *   { type: 'kop', niveau, tekst, id, aliasId }
 *   { type: 'alinea', regels: [string] }
 *   { type: 'lijst', geordend, start, items: [string] }
 *   { type: 'tabel', kop: [string] | null, rijen: [[string]] }
 *   { type: 'citaat', blokken }
 *   { type: 'scheiding' }
 * Inline-tekst blijft ruwe markdown; de renderer roept parseInline aan.
 */
export function parseMarkdown(markdown) {
  const gebruikteIds = new Set();
  return parseBlokken(String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n'), gebruikteIds);
}

function uniekId(basis, gebruikteIds) {
  const schoon = basis || 'sectie';
  let id = schoon;
  let n = 2;
  while (gebruikteIds.has(id)) id = `${schoon}-${n++}`;
  gebruikteIds.add(id);
  return id;
}

function parseBlokken(regels, gebruikteIds) {
  const blokken = [];
  let i = 0;
  while (i < regels.length) {
    const regel = regels[i];
    if (!regel.trim()) { i++; continue; }

    // Kop
    const kop = RE_KOP.exec(regel);
    if (kop) {
      const tekst = kop[2];
      const plat = plattetekst(tekst);
      const id = uniekId(slugify(plat), gebruikteIds);
      const nummer = /^(\d+)\.\s/.exec(plat);
      let aliasId = null;
      if (nummer) {
        const kandidaat = `artikel-${Number(nummer[1])}`;
        if (!gebruikteIds.has(kandidaat)) { gebruikteIds.add(kandidaat); aliasId = kandidaat; }
      }
      blokken.push({ type: 'kop', niveau: kop[1].length, tekst, id, aliasId });
      i++;
      continue;
    }

    // Scheidslijn
    if (RE_SCHEIDING.test(regel)) {
      blokken.push({ type: 'scheiding' });
      i++;
      continue;
    }

    // Tabel
    if (isTabelStart(regels, i)) {
      const kopCellen = splitsCellen(regel);
      const kolommen = kopCellen.length;
      const rijen = [];
      i += 2;
      while (i < regels.length && isTabelRij(regels[i]) && regels[i].trim()) {
        const cellen = splitsCellen(regels[i]);
        while (cellen.length < kolommen) cellen.push('');
        rijen.push(cellen.slice(0, kolommen));
        i++;
      }
      const kopLeeg = kopCellen.every((c) => !c);
      blokken.push({ type: 'tabel', kop: kopLeeg ? null : kopCellen, rijen });
      continue;
    }

    // Citaat / waarschuwingsblok
    if (RE_CITAAT.test(regel)) {
      const binnen = [];
      while (i < regels.length && RE_CITAAT.test(regels[i])) {
        binnen.push(RE_CITAAT.exec(regels[i])[1]);
        i++;
      }
      blokken.push({ type: 'citaat', blokken: parseBlokken(binnen, gebruikteIds) });
      continue;
    }

    // Lijsten
    const ul = RE_UL.exec(regel);
    const ol = ul ? null : RE_OL.exec(regel);
    if (ul || ol) {
      const geordend = Boolean(ol);
      const itemRe = geordend ? RE_OL : RE_UL;
      const items = [];
      const start = geordend ? Number(ol[1]) : 1;
      while (i < regels.length) {
        const r = regels[i];
        const m = itemRe.exec(r);
        if (m) {
          items.push(geordend ? m[2] : m[1]);
          i++;
          continue;
        }
        if (!r.trim()) {
          // Losse lijst: lege regel gevolgd door een item van dezelfde soort.
          let j = i;
          while (j < regels.length && !regels[j].trim()) j++;
          if (j < regels.length && itemRe.test(regels[j]) && !(geordend ? RE_UL : RE_OL).test(regels[j])) { i = j; continue; }
          break;
        }
        if (isBlokStart(regels, i)) break;
        // Doorlopende regel van het vorige item.
        items[items.length - 1] = `${items[items.length - 1]} ${r.trim()}`;
        i++;
      }
      blokken.push({ type: 'lijst', geordend, start, items });
      continue;
    }

    // Alinea (regels blijven gescheiden; renderer zet er een regelafbreking tussen)
    const alinea = [];
    while (i < regels.length && regels[i].trim() && (alinea.length === 0 || !isBlokStart(regels, i))) {
      alinea.push(regels[i].trim());
      i++;
    }
    blokken.push({ type: 'alinea', regels: alinea });
  }
  return blokken;
}

/** Inhoudsopgave: koppen van de gevraagde niveaus. */
export function inhoudsopgave(blokken, niveaus = [2, 3]) {
  return (blokken || [])
    .filter((b) => b.type === 'kop' && niveaus.includes(b.niveau))
    .map((b) => ({ id: b.id, tekst: plattetekst(b.tekst), niveau: b.niveau }));
}

const RE_VERSIEREGEL = /^(.*?)\s*(?:[—–-]\s*)?[Vv]ersie\s+(\d+(?:\.\d+)*)\s*[—–,-]?\s*geldig vanaf\s+(.+?)\s*$/;

/**
 * Haalt de documentkop uit de blokken: de eerste #-kop wordt de titel en een
 * regel als "Versie 1.0 — geldig vanaf ..." verdwijnt uit de tekst (de layout
 * toont die als versieregel). Een voorvoegsel zoals "Productkenmerkenblad"
 * komt terug als `soort` (de layout toont het boven de titel).
 */
export function scheidDocumentKop(blokken) {
  const rest = [...(blokken || [])];
  let titel = null;
  let versie = null;
  let geldigVanaf = null;
  let soort = null;

  const eersteKop = rest.findIndex((b) => b.type === 'kop');
  if (eersteKop !== -1 && rest[eersteKop].niveau === 1) {
    titel = plattetekst(rest[eersteKop].tekst);
    rest.splice(eersteKop, 1);
  }

  // Alleen de inleiding (tot de eerste scheidslijn of kop) doorzoeken.
  for (let k = 0; k < rest.length; k++) {
    const blok = rest[k];
    if (blok.type === 'scheiding' || blok.type === 'kop') break;
    if (blok.type !== 'alinea') continue;
    const regels = [];
    for (const r of blok.regels) {
      const m = versie === null ? RE_VERSIEREGEL.exec(r) : null;
      if (m) {
        versie = m[2];
        geldigVanaf = m[3];
        if (m[1].trim()) soort = m[1].trim();
      } else {
        regels.push(r);
      }
    }
    if (regels.length === 0) { rest.splice(k, 1); k--; } else rest[k] = { ...blok, regels };
    if (versie !== null) break;
  }

  return { titel, soort, versie, geldigVanaf, blokken: rest };
}
