// ── SwiftBridge API client ─────────────────────────────────────────────────────
// Auth gaat via httpOnly cookie `sb_token` die de browser automatisch meestuurt
// als `credentials: 'include'` is gezet. We sturen GEEN Authorization header meer
// — daarmee is JWT niet leesbaar voor XSS-attacks.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// F58 fix (Cursor review Ronde 3): CSRF double-submit pattern.
// Backend CSRF-middleware eist X-CSRF-Token header op alle muterende
// werkwoorden zodra sb_csrf cookie is gezet (na login). Voorheen stuurde
// alleen een paar componenten dit handmatig — apiFetch deed het niet,
// waardoor admin endpoints + /recurring stilletjes 403 retourneerden of
// CSRF-bypass actief was als cookie ontbrak.
function leesCsrfCookie() {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)sb_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

const MUTERENDE_METHODES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Wrapper rondom fetch die:
 *  - automatisch de juiste base URL prefixt
 *  - `credentials: 'include'` zet zodat de sb_token cookie wordt meegestuurd
 *  - JSON content-type zet als er een body is en hij niet al overschreven is
 *  - X-CSRF-Token header toevoegt op muterende requests (F58)
 *  - response JSON parsed en bij !ok een error throwt met server-error message
 */
export async function apiFetch(path, opties = {}) {
  const { method = 'GET', body, headers = {}, ...rest } = opties;

  const finaleHeaders = { ...headers };
  let finaleBody = body;

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    if (typeof body === 'object' && !(body instanceof Blob)) {
      finaleHeaders['Content-Type'] = finaleHeaders['Content-Type'] || 'application/json';
      finaleBody = JSON.stringify(body);
    }
  }

  // F58: voeg CSRF-token toe op muterende methodes (caller mag override door
  // expliciet X-CSRF-Token header mee te geven).
  if (MUTERENDE_METHODES.has(String(method).toUpperCase()) && !finaleHeaders['X-CSRF-Token']) {
    const csrf = leesCsrfCookie();
    if (csrf) finaleHeaders['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: finaleHeaders,
    body: finaleBody,
    ...rest,
  });

  const tekst = await res.text();
  let data = null;
  if (tekst) {
    try { data = JSON.parse(tekst); } catch { data = tekst; }
  }

  if (!res.ok) {
    const fout = new Error((data && data.error) || `Verzoek mislukt (${res.status})`);
    fout.status = res.status;
    fout.data = data;
    // Machine-leesbare code voor i18n-vertaling op de frontend
    fout.errorCode = (data && (data.errorCode || data.code)) || null;
    fout.error = data && data.error;
    throw fout;
  }

  return data;
}

/**
 * Vertaalt een API-fout naar een gebruikersvriendelijke tekst.
 *
 * Backend stuurt zowel `errorCode` (machine-leesbaar) als `error` (NL string).
 * Frontend i18n vertaalt op basis van de code; als die niet bestaat valt het
 * terug op de NL string uit `error`/`message`, en uiteindelijk op een
 * algemene SERVER_ERROR vertaling.
 *
 * Volgorde:
 *   1. err.errorCode → t(`errors.<CODE>`)
 *   2. err.data?.errorCode of err.data?.code (rauw API antwoord)
 *   3. err.error (NL fallback van backend)
 *   4. err.message (Error object van fetch zelf)
 *   5. generieke SERVER_ERROR fallback
 *
 * @param {object|Error} err — Het Error object van apiFetch, of een raw API body
 * @param {function} t — De `t()` functie uit useTaal()
 * @returns {string}
 */
export function parseError(err, t) {
  const translate = typeof t === 'function' ? t : (k) => k;
  const fallback = translate('errors.SERVER_ERROR');

  if (!err) return fallback;

  const code = err.errorCode || err.code || err.data?.errorCode || err.data?.code;
  if (code) {
    const key = `errors.${code}`;
    const vertaald = translate(key);
    // Onze t() valt terug op de key zelf als hij niets vindt.
    if (vertaald && vertaald !== key) return vertaald;
  }

  if (err.error)   return err.error;
  if (err.data?.error) return err.data.error;
  if (err.message) return err.message;
  return fallback;
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
export async function haalProfiel() {
  // Geeft null terug bij 401 (niet ingelogd) i.p.v. throw — zo kan de caller dit
  // gemakkelijk checken zonder try/catch overal.
  try {
    return await apiFetch('/auth/me');
  } catch (e) {
    if (e.status === 401) return null;
    throw e;
  }
}

export async function login({ email, password }) {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password } });
}

export async function registreer({ email, password, naam, telefoon }) {
  return apiFetch('/auth/register', { method: 'POST', body: { email, password, naam, telefoon } });
}

export async function verifieer2FA({ userId, code }) {
  return apiFetch('/auth/2fa-verifieer', { method: 'POST', body: { userId, code } });
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Best-effort — als de server al de sessie kwijt is is dat oké, cookie wordt nog steeds gewist.
  }
}
