/**
 * useKybAanvraag — state + acties voor de KYB-klantflow.
 *
 * De server is de waarheid: na elke mutatie nemen we de teruggegeven aanvraag
 * over (of herladen we). Er wordt niets in local/sessionStorage bewaard
 * (geen PII op het toestel). Contract: swiftbridge-api/docs/KYB_API.md.
 *
 * Gebruik:
 *   const { aanvraag, account, kvk, laden, fout, start, slaStapOp, ... } = useKybAanvraag();
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as kybApi from '../services/kyb';
import { berekenVolgendeStap } from '../components/kyb/kybOpties';

function parseJson(waarde, fallback) {
  if (waarde == null) return fallback;
  if (typeof waarde === 'string') {
    try { return JSON.parse(waarde); } catch { return fallback; }
  }
  return waarde;
}

function pak(raw, ...namen) {
  for (const naam of namen) {
    if (raw[naam] !== undefined && raw[naam] !== null) return raw[naam];
  }
  return undefined;
}

/**
 * Normaliseert de aanvraag uit de API naar een vaste, camelCase-vorm zodat de
 * componenten niet hoeven te weten of een blok als `bedrijf` of `bedrijf_json`
 * (eventueel als JSON-string) binnenkomt.
 */
export function normaliseerAanvraag(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const stappenVoltooid = (parseJson(pak(raw, 'stappenVoltooid', 'stappen_voltooid'), []) || []).map(Number);
  const volgendeStap = Number(pak(raw, 'volgendeStap', 'volgende_stap')) || berekenVolgendeStap(stappenVoltooid);
  const ubos = parseJson(pak(raw, 'ubos', 'ubo', 'ubo_json'), []) || [];
  return {
    ...raw,
    id: raw.id,
    versie: raw.versie,
    status: raw.status || 'concept',
    stappenVoltooid,
    volgendeStap,
    bedrijf: parseJson(pak(raw, 'bedrijf', 'bedrijf_json'), {}) || {},
    ubos: Array.isArray(ubos) ? ubos : [],
    persoon: parseJson(pak(raw, 'persoon', 'persoon_json'), {}) || {},
    toestel: parseJson(pak(raw, 'toestel', 'toestel_json'), {}) || {},
    gebruik: parseJson(pak(raw, 'gebruik', 'gebruik_json'), {}) || {},
    identiteit: parseJson(pak(raw, 'identiteit', 'identiteit_json'), {}) || {},
    aanvullend: parseJson(pak(raw, 'aanvullend', 'aanvullend_json'), {}) || {},
    toestemming: parseJson(pak(raw, 'toestemming', 'toestemming_json'), {}) || {},
    documenten: (parseJson(raw.documenten, []) || []).filter((d) => d && !d.verwijderdOp && !d.verwijderd_op),
    ingediendOp: pak(raw, 'ingediendOp', 'ingediend_op') ?? null,
    ingediendCount: Number(pak(raw, 'ingediendCount', 'ingediend_count')) || 0,
    verwachtUiterlijkOp: pak(raw, 'verwachtUiterlijkOp', 'verwacht_uiterlijk_op') ?? null,
    infoVerzoek: parseJson(pak(raw, 'infoVerzoek', 'info_verzoek', 'info_verzoek_json'), null),
    berichtKlant: pak(raw, 'berichtKlant', 'bericht_klant') ?? null,
    besluitRedenCode: pak(raw, 'besluitRedenCode', 'besluit_reden_code') ?? null,
    beoordeeldOp: pak(raw, 'beoordeeldOp', 'beoordeeld_op') ?? null,
  };
}

const LEEG = { aanvraag: null, account: null, kvk: null, slaWerkdagen: 5, oefenmodus: false };

export function useKybAanvraag({ auto = true } = {}) {
  const [data, setData] = useState(LEEG);
  const [laden, setLaden] = useState(!!auto);
  const [fout, setFout] = useState(null);
  const levend = useRef(true);

  useEffect(() => {
    levend.current = true;
    return () => { levend.current = false; };
  }, []);

  const zetAanvraag = useCallback((raw) => {
    setData((d) => ({ ...d, aanvraag: normaliseerAanvraag(raw) }));
  }, []);

  /**
   * Haalt de aanvraag op. State-updates gebeuren uitsluitend in de promise-callbacks,
   * zodat dit ook vanuit een effect mag (geen synchrone setState). Geeft de respons
   * terug, of null bij een fout (de fout staat dan in `fout`).
   */
  const haal = useCallback(() => kybApi.haalAanvraag()
    .then((res) => {
      if (levend.current) {
        setData({
          aanvraag: normaliseerAanvraag(res?.aanvraag),
          account: res?.account || null,
          kvk: res?.kvk || null,
          slaWerkdagen: Number(res?.slaWerkdagen) || 5,
          oefenmodus: !!res?.oefenmodus,
        });
        setFout(null);
      }
      return res;
    })
    .catch((e) => {
      if (levend.current) setFout(e);
      return null;
    })
    .finally(() => {
      if (levend.current) setLaden(false);
    }), []);

  /** Expliciet herladen (na een actie of via een knop): toont eerst de laadstatus. */
  const herlaad = useCallback(() => {
    setLaden(true);
    setFout(null);
    return haal();
  }, [haal]);

  // Eerste keer laden: `laden` staat initieel al op true (zie useState), dus geen setState vooraf.
  useEffect(() => {
    if (auto) haal();
  }, [auto, haal]);

  const start = useCallback(async () => {
    const res = await kybApi.startAanvraag();
    if (res?.aanvraag) zetAanvraag(res.aanvraag);
    else await herlaad();
    return res;
  }, [zetAanvraag, herlaad]);

  const slaStapOp = useCallback(async (nr, body, opties = {}) => {
    const res = await kybApi.slaStapOp(nr, body, opties);
    if (res?.aanvraag) zetAanvraag(res.aanvraag);
    return res;
  }, [zetAanvraag]);

  const indienen = useCallback(async () => {
    const res = await kybApi.dienIn();
    await herlaad();
    return res;
  }, [herlaad]);

  const intrekken = useCallback(async () => {
    const res = await kybApi.intrekken();
    await herlaad();
    return res;
  }, [herlaad]);

  const uploadDocument = useCallback(async (soort, file, onProgress) => {
    const res = await kybApi.uploadDocument(soort, file, onProgress);
    if (res?.document) {
      setData((d) => {
        if (!d.aanvraag) return d;
        return { ...d, aanvraag: { ...d.aanvraag, documenten: [...(d.aanvraag.documenten || []), res.document] } };
      });
    }
    return res;
  }, []);

  const verwijderDocument = useCallback(async (id) => {
    const res = await kybApi.verwijderDocument(id);
    setData((d) => {
      if (!d.aanvraag) return d;
      return { ...d, aanvraag: { ...d.aanvraag, documenten: (d.aanvraag.documenten || []).filter((doc) => doc.id !== id) } };
    });
    return res;
  }, []);

  const infoAntwoord = useCallback(async (antwoord) => {
    const res = await kybApi.stuurInfoAntwoord(antwoord);
    await herlaad();
    return res;
  }, [herlaad]);

  return {
    aanvraag: data.aanvraag,
    account: data.account,
    kvk: data.kvk,
    slaWerkdagen: data.slaWerkdagen,
    oefenmodus: data.oefenmodus,
    laden,
    fout,
    herlaad,
    start,
    slaStapOp,
    indienen,
    intrekken,
    uploadDocument,
    verwijderDocument,
    infoAntwoord,
  };
}

export default useKybAanvraag;
