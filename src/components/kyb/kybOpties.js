/**
 * kybOpties.js — Frontend-spiegel van de keuzecodes uit de API
 * (swiftbridge-api/src/lib/kyb/keuzes.js) plus de i18n-key per optie.
 *
 * Contract: swiftbridge-api/docs/KYB_API.md (sectie 2.1). De test
 * kybOpties.test.js dwingt af dat KEUZES hier exact gelijk is aan de vaste
 * spiegel en dat elke tKey in nl.js bestaat. Wijzig nooit een code zonder
 * de API, de i18n-keys en de tests mee te nemen.
 */

export const KEUZES = Object.freeze({
  RECHTSVORM: Object.freeze(['eenmanszaak', 'bv', 'vof', 'stichting', 'overig']),
  STRUCTUUR: Object.freeze(['enige_bestuurder', 'enige_eigenaar', 'meerdere_entiteiten', 'meerdere_bestuurders', 'meerdere_aandeelhouders']),
  KVK_BRON: Object.freeze(['kvk', 'kvk_mock', 'handmatig']),
  UBO_ROL: Object.freeze(['bestuurder', 'ubo', 'pseudo_ubo']),
  UBO_AARD: Object.freeze(['aandelen', 'stemrecht', 'eigendom', 'zeggenschap', 'pseudo']),
  UBO_PCT: Object.freeze(['25_50', '50_75', '75_100']),
  TX_PER_JAAR: Object.freeze(['lt_100', '100_500', '500_1000', 'gte_1000']),
  OMVANG_PER_TX: Object.freeze(['lt_100', '100_1k', '1k_10k', '10k_100k', 'gte_100k']),
  VOLUME_KWARTAAL: Object.freeze(['lt_10k', '10k_50k', '50k_150k', '150k_500k', 'gte_500k']),
  HERKOMST: Object.freeze(['omzet_onderneming', 'eigen_inbreng', 'investering_derden', 'lening', 'verkoop_activa', 'subsidie_overheid', 'overig']),
  JAAROMZET: Object.freeze(['lt_50k', '50k_100k', '100k_500k', '500k_1m', '1m_10m', 'gte_10m']),
  DOC_SOORT: Object.freeze(['kvk_uittreksel', 'statuten', 'aandeelhoudersregister', 'ubo_verklaring', 'info_antwoord', 'overig']),
  REDEN_CODE: Object.freeze(['identiteit_niet_verifieerbaar', 'kvk_niet_gevonden', 'kvk_afwijking', 'ubo_onvolledig', 'documenten_onleesbaar', 'doel_onduidelijk', 'sanctie', 'pep_niet_acceptabel', 'risico_te_hoog', 'overig']),
  CHECKLIST: Object.freeze(['identiteit_geverifieerd', 'kvk_gecontroleerd', 'ubo_compleet', 'sancties_gecontroleerd', 'pep_beoordeeld', 'doel_aard_begrepen']),
  STATUS: Object.freeze(['geen', 'concept', 'ingediend', 'in_behandeling', 'info_nodig', 'goedgekeurd', 'afgewezen', 'ingetrokken']),
  IDENTITEIT_BRON: Object.freeze(['idin', 'kyc_bestaand', 'upload_telefoon', 'upload_web']),
  RISICO_SIGNAAL: Object.freeze(['pep', 'sanctie_bedrijf', 'sanctie_persoon', 'sanctie_niet_gescreend', 'kvk_handmatig', 'structuur_complex', 'identiteit_mismatch', 'geen_documentkopie', 'omzet_volume_mismatch']),
});

/** Aantal stappen in de klantflow (1 = bedrijf ... 7 = akkoord). */
export const AANTAL_STAPPEN = 7;

/** Reden-codes waarbij de klant uitsluitend de generieke tekst krijgt (Wwft art. 23). */
export const GENERIEKE_REDEN_CODES = Object.freeze(['sanctie', 'pep_niet_acceptabel', 'risico_te_hoog', 'overig']);

export const MAX_DOCUMENTEN = 8;
export const MAX_PERSONEN = 10;
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

/** i18n-key-prefix per keuzegroep. Groepen zonder prefix hebben geen klantlabel. */
const PREFIX = Object.freeze({
  RECHTSVORM: 'kyb_rechtsvorm_',
  STRUCTUUR: 'kyb_structuur_',
  UBO_ROL: 'kyb_ubo_rol_',
  UBO_AARD: 'kyb_ubo_aard_',
  UBO_PCT: 'kyb_ubo_pct_',
  TX_PER_JAAR: 'kyb_tx_jaar_',
  OMVANG_PER_TX: 'kyb_omvang_',
  VOLUME_KWARTAAL: 'kyb_volume_',
  HERKOMST: 'kyb_herkomst_',
  JAAROMZET: 'kyb_omzet_',
  REDEN_CODE: 'kyb_admin_reden_',
  CHECKLIST: 'kyb_admin_check_',
});

function maakOpties(groep) {
  const prefix = PREFIX[groep];
  return Object.freeze(KEUZES[groep].map((waarde) => Object.freeze({ waarde, tKey: `${prefix}${waarde}` })));
}

/**
 * Opties per groep als [{ waarde, tKey }] — direct bruikbaar in <KeuzeGroep opties={...}/>.
 * Alleen groepen met een klantlabel (zie PREFIX).
 */
export const KYB_OPTIES = Object.freeze(
  Object.fromEntries(Object.keys(PREFIX).map((groep) => [groep, maakOpties(groep)]))
);

/** Statuslabels: 'geen' heeft geen eigen key en valt terug op 'Nog niet ingediend'. */
export function statusTKey(status) {
  if (!status || status === 'geen') return 'kyb_status_concept';
  return KEUZES.STATUS.includes(status) ? `kyb_status_${status}` : 'kyb_status_concept';
}

/** Geeft de i18n-key voor een optie, of de ruwe waarde als er geen label is. */
export function optieTKey(groep, waarde) {
  const prefix = PREFIX[groep];
  if (!prefix || !KEUZES[groep] || !KEUZES[groep].includes(waarde)) return waarde;
  return `${prefix}${waarde}`;
}

/** Stap-metadata: label (kort) en titel (lang) per stapnummer 1..7. */
export const STAPPEN = Object.freeze(
  Array.from({ length: AANTAL_STAPPEN }, (_, i) => Object.freeze({
    nr: i + 1,
    labelKey: `kyb_stap${i + 1}_label`,
    titelKey: `kyb_stap${i + 1}_titel`,
  }))
);

/**
 * Bedrijfsregels (spiegel van api regels.js 1.5): moet de aanvrager
 * eigenaren/bestuurders opgeven, of wordt hij automatisch als UBO vastgelegd?
 */
export function uboInvoerVereist(rechtsvorm, structuur = []) {
  if (!rechtsvorm) return false;
  if (rechtsvorm === 'eenmanszaak') return false;
  const s = Array.isArray(structuur) ? structuur : [];
  if (s.includes('enige_bestuurder') && s.includes('enige_eigenaar')) return false;
  return true;
}

/** Eerste niet-voltooide stap (1..7); 7 als alles voltooid is. */
export function berekenVolgendeStap(stappenVoltooid = []) {
  const set = new Set((stappenVoltooid || []).map(Number));
  for (let nr = 1; nr <= AANTAL_STAPPEN; nr += 1) {
    if (!set.has(nr)) return nr;
  }
  return AANTAL_STAPPEN;
}
