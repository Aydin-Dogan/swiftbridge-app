/**
 * uboHelpers.js — pure hulpfuncties voor eigenaren/bestuurders (UBO's) in stap 1.
 * Apart van UboFormulier.jsx zodat dat bestand alleen een component exporteert (fast refresh).
 *
 * Validatie spiegelt kybStap1.ubos: rol 'ubo' vereist soort + omvang belang;
 * PEP = ja vereist een toelichting.
 */

export function uboGeldig(p) {
  if (!p) return false;
  if (!p.rol || !p.voornamen?.trim() || !p.achternaam?.trim()) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.geboortedatum || '')) return false;
  if (!/^[A-Z]{2}$/.test(p.nationaliteit || '')) return false;
  if (p.rol === 'ubo' && (!p.uboAard || !p.uboPercentageKlasse)) return false;
  if (p.pep && !p.pepToelichting?.trim()) return false;
  return true;
}

/** Zet een persoon om naar de API-body (lege optionele velden weglaten). */
export function uboNaarBody(p) {
  const body = {
    rol: p.rol,
    voornamen: p.voornamen.trim(),
    achternaam: p.achternaam.trim(),
    geboortedatum: p.geboortedatum,
    nationaliteit: p.nationaliteit,
    pep: !!p.pep,
  };
  if (p.id) body.id = p.id;
  if (p.tussenvoegsel?.trim()) body.tussenvoegsel = p.tussenvoegsel.trim();
  if (p.rol === 'ubo') {
    body.uboAard = p.uboAard;
    body.uboPercentageKlasse = p.uboPercentageKlasse;
  } else {
    body.uboAard = p.rol === 'pseudo_ubo' ? 'pseudo' : null;
    body.uboPercentageKlasse = null;
  }
  if (p.pep && p.pepToelichting?.trim()) body.pepToelichting = p.pepToelichting.trim();
  return body;
}
