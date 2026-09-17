/**
 * kybAdminLabels.js — Gedeelde helpers voor de admin-beoordeling van zakelijke aanvragen (KYB).
 *
 * - useTx(): t() met NL-fallback. De kyb_admin_*-keys worden door WP3 in de i18n-bestanden gezet;
 *   zolang die er niet zijn geeft t() de key terug en tonen we de NL-tekst uit het contract (3.4).
 * - useKybLabels(): leesbare labels voor alle keuzecodes uit docs/KYB_API.md (KEUZES).
 * - fmtDatum/fmtBytes/STATUS_STIJL: opmaak.
 *
 * Geen emoji, geen bank-/rekening-claims (SwiftBridge is geen bank).
 */
import { useCallback, useMemo } from 'react';
import { useTaal } from '../../../i18n';

export const STATUSSEN = ['geen', 'concept', 'ingediend', 'in_behandeling', 'info_nodig', 'goedgekeurd', 'afgewezen', 'ingetrokken'];
export const CHECKLIST = ['identiteit_geverifieerd', 'kvk_gecontroleerd', 'ubo_compleet', 'sancties_gecontroleerd', 'pep_beoordeeld', 'doel_aard_begrepen'];
export const REDEN_CODES = ['identiteit_niet_verifieerbaar', 'kvk_niet_gevonden', 'kvk_afwijking', 'ubo_onvolledig', 'documenten_onleesbaar', 'doel_onduidelijk', 'sanctie', 'pep_niet_acceptabel', 'risico_te_hoog', 'overig'];
export const GENERIEKE_REDEN_CODES = ['sanctie', 'pep_niet_acceptabel', 'risico_te_hoog', 'overig'];
export const DOC_SOORTEN = ['kvk_uittreksel', 'statuten', 'aandeelhoudersregister', 'ubo_verklaring', 'info_antwoord', 'overig'];
export const AANTAL_STAPPEN = 7;

/** Vervangt {naam}-placeholders in een fallback-tekst. */
export function vervangVars(tekst, vars = {}) {
  let uit = String(tekst ?? '');
  for (const [k, v] of Object.entries(vars)) {
    uit = uit.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return uit;
}

/**
 * t() met NL-fallback: t('kyb_admin_x', vars) als de key bestaat, anders de meegegeven NL-tekst.
 * De bestaande t() geeft bij een ontbrekende key de key zelf terug — daar testen we op.
 */
export function useTx() {
  const { t } = useTaal();
  return useCallback((key, nl, vars = {}) => {
    const v = t(key, vars);
    if (typeof v === 'string' && v && v !== key) return v;
    return vervangVars(nl, vars);
  }, [t]);
}

// NL-fallbacks per keuzecode (bron: contract 3.4 en KEUZES uit src/lib/kyb/keuzes.js).
const NL = {
  rechtsvorm: { eenmanszaak: 'Eenmanszaak', bv: 'Bv', vof: 'Vof', stichting: 'Stichting', overig: 'Overige' },
  structuur: {
    enige_bestuurder: 'Ik ben de enige bestuurder',
    enige_eigenaar: 'Ik ben de enige eigenaar',
    meerdere_entiteiten: 'Het bedrijf bestaat uit meerdere entiteiten',
    meerdere_bestuurders: 'Er zijn meerdere bestuurders',
    meerdere_aandeelhouders: 'Er zijn meerdere aandeelhouders of eigenaren',
  },
  uboRol: { bestuurder: 'Bestuurder', ubo: 'Eigenaar (meer dan 25%)', pseudo_ubo: 'Hoger leidinggevende (niemand heeft meer dan 25%)' },
  uboAard: { aandelen: 'Aandelen', stemrecht: 'Stemrecht', eigendom: 'Eigendom', zeggenschap: 'Feitelijke zeggenschap', pseudo: 'Niet van toepassing' },
  uboPct: { '25_50': '25% tot 50%', '50_75': '50% tot 75%', '75_100': '75% tot 100%' },
  txPerJaar: { lt_100: 'Minder dan 100', '100_500': '100 tot 500', '500_1000': '500 tot 1.000', gte_1000: 'Meer dan 1.000' },
  omvang: { lt_100: 'Minder dan EUR 100', '100_1k': 'EUR 100 tot 1.000', '1k_10k': 'EUR 1.000 tot 10.000', '10k_100k': 'EUR 10.000 tot 100.000', gte_100k: 'Meer dan EUR 100.000' },
  volume: { lt_10k: 'Minder dan EUR 10.000', '10k_50k': 'EUR 10.000 tot 50.000', '50k_150k': 'EUR 50.000 tot 150.000', '150k_500k': 'EUR 150.000 tot 500.000', gte_500k: 'Meer dan EUR 500.000' },
  herkomst: {
    omzet_onderneming: 'Omzet van mijn onderneming', eigen_inbreng: 'Eigen inbreng', investering_derden: 'Investering van derden',
    lening: 'Lening', verkoop_activa: 'Verkoop van bedrijfsmiddelen', subsidie_overheid: 'Subsidie of overheidsbijdrage', overig: 'Anders',
  },
  jaaromzet: { lt_50k: 'Minder dan EUR 50.000', '50k_100k': 'EUR 50.000 tot 100.000', '100k_500k': 'EUR 100.000 tot 500.000', '500k_1m': 'EUR 500.000 tot 1 miljoen', '1m_10m': 'EUR 1 tot 10 miljoen', gte_10m: 'Meer dan EUR 10 miljoen' },
  docSoort: { kvk_uittreksel: 'KvK-uittreksel', statuten: 'Statuten', aandeelhoudersregister: 'Aandeelhoudersregister', ubo_verklaring: 'UBO-verklaring', info_antwoord: 'Antwoord op informatieverzoek', overig: 'Overig document' },
  reden: {
    identiteit_niet_verifieerbaar: 'Identiteit niet verifieerbaar', kvk_niet_gevonden: 'KvK niet gevonden', kvk_afwijking: 'Afwijking Handelsregister',
    ubo_onvolledig: 'UBO onvolledig', documenten_onleesbaar: 'Documenten onleesbaar', doel_onduidelijk: 'Doel onduidelijk',
    sanctie: 'Sanctie (klant krijgt generieke tekst)', pep_niet_acceptabel: 'PEP niet acceptabel (generieke tekst)',
    risico_te_hoog: 'Risico te hoog (generieke tekst)', overig: 'Overig (generieke tekst)',
  },
  checklist: {
    identiteit_geverifieerd: 'Identiteit van de tekenbevoegde geverifieerd',
    kvk_gecontroleerd: 'Bedrijfsgegevens gecontroleerd met het Handelsregister',
    ubo_compleet: 'Eigenaren en bestuurders compleet en plausibel',
    sancties_gecontroleerd: 'Sanctiescreening gecontroleerd',
    pep_beoordeeld: 'PEP-status beoordeeld',
    doel_aard_begrepen: 'Doel en aard van het gebruik begrepen',
  },
  status: {
    geen: 'Geen aanvraag', concept: 'Nog niet ingediend', ingediend: 'Ingediend', in_behandeling: 'In behandeling',
    info_nodig: 'Info nodig', goedgekeurd: 'Goedgekeurd', afgewezen: 'Afgewezen', ingetrokken: 'Ingetrokken',
  },
  stap: { 1: 'Bedrijf', 2: 'Jij', 3: 'Toestel', 4: 'Gebruik', 5: 'Identiteit', 6: 'Aanvullend', 7: 'Akkoord' },
  risicoSignaal: {
    pep: 'PEP', sanctie_bedrijf: 'Sanctie-hit bedrijf', sanctie_persoon: 'Sanctie-hit persoon', sanctie_niet_gescreend: 'Screening niet uitgevoerd',
    kvk_handmatig: 'KvK handmatig', structuur_complex: 'Complexe structuur', identiteit_mismatch: 'Identiteit wijkt af',
    geen_documentkopie: 'Geen documentkopie (iDIN)', omzet_volume_mismatch: 'Omzet en volume passen niet bij elkaar',
  },
  kvkBron: { kvk: 'Handelsregister (KvK-API)', kvk_mock: 'Oefenmodus (voorbeeldbedrijf)', handmatig: 'Handmatig ingevuld' },
  identiteitBron: { idin: 'iDIN', kyc_bestaand: 'Eerder goedgekeurde KYC', upload_telefoon: 'Foto-upload via telefoon', upload_web: 'Foto-upload via web' },
};

/** Labels voor alle keuzecodes; kijkt eerst in i18n (kyb_*), anders NL-fallback. */
export function useKybLabels() {
  const tx = useTx();
  return useMemo(() => {
    const maak = (prefix, tabel) => (code) => tx(`${prefix}${code}`, tabel[code] ?? String(code ?? '-'));
    const lijst = (fn) => (codes) => (Array.isArray(codes) && codes.length ? codes.map(fn).join(', ') : '-');
    const rechtsvorm = maak('kyb_rechtsvorm_', NL.rechtsvorm);
    const structuur = maak('kyb_structuur_', NL.structuur);
    const uboRol = maak('kyb_ubo_rol_', NL.uboRol);
    const uboAard = maak('kyb_ubo_aard_', NL.uboAard);
    const uboPct = maak('kyb_ubo_pct_', NL.uboPct);
    const txPerJaar = maak('kyb_tx_jaar_', NL.txPerJaar);
    const omvang = maak('kyb_omvang_', NL.omvang);
    const volume = maak('kyb_volume_', NL.volume);
    const herkomst = maak('kyb_herkomst_', NL.herkomst);
    const jaaromzet = maak('kyb_omzet_', NL.jaaromzet);
    const docSoort = (code) => (code === 'kvk_uittreksel'
      ? tx('kyb_uittreksel_label', NL.docSoort.kvk_uittreksel)
      : tx(`kyb_admin_doc_${code}`, NL.docSoort[code] ?? String(code ?? '-')));
    const reden = maak('kyb_admin_reden_', NL.reden);
    const checklist = maak('kyb_admin_check_', NL.checklist);
    const status = (code) => (code === 'geen'
      ? NL.status.geen
      : tx(`kyb_status_${code}`, NL.status[code] ?? String(code ?? '-')));
    const stap = (nr) => tx(`kyb_stap${nr}_label`, NL.stap[nr] ?? `Stap ${nr}`);
    const signaal = maak('kyb_admin_signaal_', NL.risicoSignaal);
    const risicoSignaal = (code) => {
      // Drie signalen delen hun tekst met bestaande queue-keys van WP3.
      if (code === 'sanctie_niet_gescreend') return tx('kyb_admin_screening_onbeschikbaar', NL.risicoSignaal[code]);
      if (code === 'kvk_handmatig') return tx('kyb_admin_kvk_handmatig', NL.risicoSignaal[code]);
      if (code === 'geen_documentkopie') return tx('kyb_admin_geen_documentkopie', NL.risicoSignaal[code]);
      return signaal(code);
    };
    const kvkBron = maak('kyb_admin_bron_', NL.kvkBron);
    const identiteitBron = maak('kyb_admin_idbron_', NL.identiteitBron);
    const ja = tx('kyb_ja', 'Ja');
    const nee = tx('kyb_nee', 'Nee');
    const jaNee = (b) => (b === true ? ja : b === false ? nee : '-');
    return {
      rechtsvorm, structuur, structuurLijst: lijst(structuur), uboRol, uboAard, uboPct, txPerJaar, omvang, volume,
      herkomst, herkomstLijst: lijst(herkomst), jaaromzet, docSoort, docSoortLijst: lijst(docSoort), reden, checklist,
      status, stap, stappenLijst: lijst(stap), risicoSignaal, kvkBron, identiteitBron, jaNee,
    };
  }, [tx]);
}

/** Datum/tijd uit epoch-ms, epoch-s of ISO-string. */
export function fmtDatum(waarde, metTijd = true) {
  if (waarde === null || waarde === undefined || waarde === '') return '-';
  let d;
  if (typeof waarde === 'number' || /^\d+$/.test(String(waarde))) {
    let n = Number(waarde);
    if (n < 1e11) n *= 1000; // epoch in seconden
    d = new Date(n);
  } else {
    d = new Date(waarde);
  }
  if (Number.isNaN(d.getTime())) return String(waarde);
  const opties = metTijd
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return d.toLocaleString('nl-NL', opties);
}

/** Aantal dagen sinds een tijdstip (afgerond naar beneden). */
export function dagenSinds(waarde) {
  if (!waarde) return null;
  let n = Number(waarde);
  if (Number.isNaN(n)) n = new Date(waarde).getTime();
  if (Number.isNaN(n)) return null;
  if (n < 1e11) n *= 1000;
  return Math.max(0, Math.floor((Date.now() - n) / 86_400_000));
}

export function fmtBytes(n) {
  const b = Number(n) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} kB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

/** Pill-klassen per status (bestaande admin-kleuren). */
export const STATUS_STIJL = {
  concept: 'bg-surface-3 text-ink-2 border-border',
  ingediend: 'bg-brand-50 text-brand-700 border-brand-100',
  in_behandeling: 'bg-amber-50 text-amber-700 border-amber-200',
  info_nodig: 'bg-accent-400/10 text-accent-600 border-accent-400/40',
  goedgekeurd: 'bg-success-50 text-success-700 border-success-100',
  afgewezen: 'bg-red-50 text-red-600 border-red-200',
  ingetrokken: 'bg-surface-3 text-ink-3 border-border',
};

/**
 * Leest een veld tolerant uit een API-object: camelCase, snake_case, en voor JSON-blokken
 * ook <naam>Json / <naam>_json (string wordt geparsed). Geeft undefined als niets gevonden.
 */
export function veld(obj, naam) {
  if (!obj || typeof obj !== 'object') return undefined;
  const snake = naam.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  const kandidaten = [naam, snake, `${naam}Json`, `${snake}_json`];
  for (const k of kandidaten) {
    if (obj[k] !== undefined && obj[k] !== null) {
      const w = obj[k];
      if (typeof w === 'string' && (k.endsWith('Json') || k.endsWith('_json') || /^[[{]/.test(w.trim()))) {
        try { return JSON.parse(w); } catch { return w; }
      }
      return w;
    }
  }
  return undefined;
}

/** Zet een ubo-array in de vorm die het dossier verwacht (accepteert ubo/ubos/ubo_json). */
export function uboLijst(aanvraag) {
  const u = veld(aanvraag, 'ubo') ?? veld(aanvraag, 'ubos') ?? veld(aanvraag, 'personen');
  return Array.isArray(u) ? u : [];
}

export function volledigeNaam(p) {
  if (!p) return '-';
  return [p.voornamen, p.tussenvoegsel, p.achternaam].filter(Boolean).join(' ') || p.naam || '-';
}

export function adresRegel(a) {
  if (!a || typeof a !== 'object') return '-';
  const straat = [a.straat, a.huisnummer, a.toevoeging].filter(Boolean).join(' ');
  const plaats = [a.postcode, a.plaats].filter(Boolean).join(' ');
  return [straat, plaats, a.land].filter(Boolean).join(', ') || '-';
}

/** Genormaliseerde vergelijking voor "Wijkt af"-markering. */
export function wijktAf(a, b) {
  const n = (x) => String(x ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!n(a) && !n(b)) return false;
  return n(a) !== n(b);
}
