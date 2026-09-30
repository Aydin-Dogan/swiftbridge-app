/**
 * kycLabels.js — Leesbare teksten voor het particuliere KYC-dossierscherm.
 *
 * Bewust klein gehouden. De API stuurt bij risicofactoren en bij ontbrekende
 * onderdelen al een geschreven toelichting mee, dus die worden hier NIET nog een
 * keer vertaald: dat zou twee bronnen maken die uit elkaar gaan lopen. Hier
 * staan alleen de dingen waar de API enkel een code voor geeft.
 *
 * Teksten lopen via useTx uit kybAdminLabels: die gebruikt de vertaling als die
 * bestaat en anders de Nederlandse tekst die hier staat. Zo hoeven er geen
 * nieuwe sleutels in de vijf taalbestanden, wat de pariteitstest zou breken.
 */

/** Kleur per risicoklasse. Dezelfde pill-vorm als STATUS_STIJL bij zakelijk. */
export const RISICO_STIJL = {
  laag: 'bg-success-50 text-success-700 border-success-100',
  midden: 'bg-amber-50 text-amber-700 border-amber-200',
  hoog: 'bg-red-50 text-red-600 border-red-200',
};

/** Kleur per status van een particulier dossier. */
export const KYC_STATUS_STIJL = {
  in_behandeling: 'bg-amber-50 text-amber-700 border-amber-200',
  in_beoordeling: 'bg-brand-50 text-brand-700 border-brand-100',
  info_nodig: 'bg-accent-400/10 text-accent-600 border-accent-400/40',
  wacht_op_tweede: 'bg-brand-50 text-brand-700 border-brand-100',
  goedgekeurd: 'bg-success-50 text-success-700 border-success-100',
  afgewezen: 'bg-red-50 text-red-600 border-red-200',
  geblokkeerd: 'bg-red-50 text-red-600 border-red-200',
};

export const RISICO_LABEL = { laag: 'Laag', midden: 'Midden', hoog: 'Hoog' };

export const STATUS_LABEL = {
  in_behandeling: 'Wacht op beoordeling',
  in_beoordeling: 'In beoordeling',
  info_nodig: 'Informatie opgevraagd',
  wacht_op_tweede: 'Wacht op tweede beoordelaar',
  goedgekeurd: 'Goedgekeurd',
  afgewezen: 'Afgewezen',
  geblokkeerd: 'Geblokkeerd',
};

export const DOCUMENT_LABEL = {
  paspoort_eu: 'Paspoort (EU)',
  paspoort_niet_eu: 'Paspoort (buiten EU)',
  id_kaart: 'Identiteitskaart',
  rijbewijs: 'Rijbewijs',
};

export const BRON_LABEL = {
  idin: 'iDIN',
  kyc_bestaand: 'Eerdere verificatie',
  upload_telefoon: 'Upload via telefoon',
  upload_web: 'Upload via web',
};

/** De zes checklistpunten uit werkpakket 5. */
export const CHECKLIST_LABEL = {
  identiteit_geverifieerd: 'Identiteit vastgesteld',
  document_geldig: 'Document geldig',
  gelijkenis_gecontroleerd: 'Gelijkenis met de foto gecontroleerd',
  sancties_gecontroleerd: 'Sanctielijsten gecontroleerd',
  pep_beoordeeld: 'Politiek prominente positie beoordeeld',
  doel_gebruik_begrepen: 'Doel en gebruik begrepen',
};

/**
 * Wat de medewerker moet doen bij een ontbrekend onderdeel. De API geeft per
 * punt een actiecode; dit is de zin die erbij hoort.
 */
export const ACTIE_LABEL = {
  informatie_opvragen: 'Informatie opvragen bij de klant',
  screening_uitvoeren: 'Controle zelf uitvoeren',
  intake_uitbreiden: 'Vraag ontbreekt in de aanvraag',
  aanvaarden_als_risico: 'Weegt mee in het risico',
};

/**
 * De aanbeveling voor het hele dossier, in gewone taal. Dit is het eerste wat de
 * medewerker leest, dus het moet zeggen wat hij nu moet doen.
 */
export const VERVOLG_LABEL = {
  kan_beoordelen: 'Dit dossier kan beoordeeld worden',
  informatie_opvragen: 'Vraag eerst gegevens op bij de klant',
  screening_uitvoeren: 'Voer eerst de verplichte controles uit',
  intake_uitbreiden: 'De aanvraag mist vragen die nooit zijn gesteld',
};

/** Kleur van de aanbeveling: groen als het kan, anders oranje. */
export const VERVOLG_STIJL = {
  kan_beoordelen: 'bg-success-50 text-success-700 border-success-100',
  informatie_opvragen: 'bg-amber-50 text-amber-700 border-amber-200',
  screening_uitvoeren: 'bg-amber-50 text-amber-700 border-amber-200',
  intake_uitbreiden: 'bg-accent-400/10 text-accent-600 border-accent-400/40',
};

/** Leest een label uit een tabel, met de code zelf als terugval. */
export function label(tabel, code) {
  if (!code) return '-';
  return tabel[code] || String(code).replace(/_/g, ' ');
}
