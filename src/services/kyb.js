/**
 * kyb.js — API-client voor "Zakelijk SwiftBridge-profiel aanvragen" (KYB).
 *
 * Alle aanroepen lopen via apiFetch (cookie-sessie + CSRF-header), behalve
 * uploadDocument: die gebruikt XMLHttpRequest zodat we voortgang kunnen tonen.
 * Contract: swiftbridge-api/docs/KYB_API.md, sectie 2.3.
 */
import { apiFetch, API_URL } from './api';

function leesCsrfCookie() {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)sb_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** GET /kyb/status — lichtgewicht status voor dashboard/profiel. */
export function haalStatus() {
  return apiFetch('/kyb/status');
}

/** GET /kyb/voorwaarden — versies, doorlooptijd, prijsonderdelen en links. */
export function haalVoorwaarden() {
  return apiFetch('/kyb/voorwaarden');
}

/** GET /kyb/aanvraag — de volledige aanvraag (of null) + accountcontext. */
export function haalAanvraag() {
  return apiFetch('/kyb/aanvraag');
}

/** POST /kyb/aanvraag — nieuw concept starten. */
export function startAanvraag() {
  return apiFetch('/kyb/aanvraag', { method: 'POST', body: {} });
}

/**
 * PUT /kyb/aanvraag/stap/:nr — stap opslaan. Met { gedeeltelijk: true } slaat
 * de server op zonder de stap als voltooid te markeren (opslaan en later verder).
 */
export function slaStapOp(nr, body, { gedeeltelijk = false } = {}) {
  const payload = gedeeltelijk ? { ...body, gedeeltelijk: true } : body;
  return apiFetch(`/kyb/aanvraag/stap/${Number(nr)}`, { method: 'PUT', body: payload });
}

/**
 * POST /kyb/aanvraag/documenten — multipart upload via XHR (met voortgang).
 * @param {string} soort  DOC_SOORT
 * @param {File} file     pdf/jpeg/png, max 8 MB
 * @param {(pct:number)=>void} [onProgress]
 */
export function uploadDocument(soort, file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('soort', soort);
    fd.append('bestand', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/kyb/aanvraag/documenten`);
    xhr.withCredentials = true;
    const csrf = leesCsrfCookie();
    if (csrf) xhr.setRequestHeader('X-CSRF-Token', csrf);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      let data;
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { data = null; }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
        return;
      }
      const err = new Error((data && data.error) || `Verzoek mislukt (${xhr.status})`);
      err.status = xhr.status;
      err.data = data;
      err.errorCode = (data && (data.errorCode || data.code)) || null;
      err.error = data && data.error;
      reject(err);
    };
    xhr.onerror = () => {
      const err = new Error('Kan de server niet bereiken. Controleer je internetverbinding.');
      err.status = 0;
      err.netwerk = true;
      err.errorCode = 'NETWERK';
      reject(err);
    };
    xhr.send(fd);
  });
}

/** DELETE /kyb/aanvraag/documenten/:id */
export function verwijderDocument(id) {
  return apiFetch(`/kyb/aanvraag/documenten/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** GET /kyb/kvk/zoeken?q= — naam of 8-cijferig KvK-nummer. */
export function zoekKvk(q) {
  return apiFetch(`/kyb/kvk/zoeken?q=${encodeURIComponent(String(q || '').trim())}`);
}

/** GET /kyb/kvk/basisprofiel/:kvkNummer */
export function haalKvkBasisprofiel(kvkNummer) {
  return apiFetch(`/kyb/kvk/basisprofiel/${encodeURIComponent(String(kvkNummer || '').trim())}`);
}

/** GET /kyb/kvk/status — { beschikbaar, bron } */
export function kvkStatus() {
  return apiFetch('/kyb/kvk/status');
}

/** POST /kyb/aanvraag/indienen */
export function dienIn() {
  return apiFetch('/kyb/aanvraag/indienen', { method: 'POST', body: {} });
}

/** POST /kyb/aanvraag/intrekken */
export function intrekken() {
  return apiFetch('/kyb/aanvraag/intrekken', { method: 'POST', body: {} });
}

/** POST /kyb/aanvraag/info-antwoord */
export function stuurInfoAntwoord(antwoord) {
  return apiFetch('/kyb/aanvraag/info-antwoord', { method: 'POST', body: { antwoord } });
}
