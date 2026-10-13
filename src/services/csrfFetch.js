// ── CSRF-header voor losse fetch-aanroepen ────────────────────────────────────
// De API weigert elke POST/PUT/PATCH/DELETE met 403 zodra de sb_csrf-cookie
// staat (na het inloggen) en de X-CSRF-Token-header ontbreekt (F58,
// swiftbridge-api/src/middleware/csrf.js). apiFetch stuurt die header mee, maar
// zo'n 25 plekken gebruiken nog een losse fetch, waaronder de betaalknop in
// PaymentFlow (analyse 13-10-2026). In plaats van al die plekken om te bouwen
// vult deze wrapper de header centraal aan, uitsluitend voor verzoeken naar onze
// eigen API: het token gaat nooit naar een andere site.

const MUTERENDE_METHODES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function leesCsrfCookie() {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)sb_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function urlVan(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input?.url || '';
}

// '/api' (same-origin proxy in productie) of een volledige URL (lokaal).
function naarEigenApi(url, apiBasis, origin) {
  const basis = String(apiBasis || '').replace(/\/$/, '');
  if (!basis) return false;
  const kandidaten = basis.startsWith('/') ? [basis, `${origin}${basis}`] : [basis];
  return kandidaten.some((b) => url === b || url.startsWith(`${b}/`) || url.startsWith(`${b}?`));
}

export function installeerCsrfFetch(venster, apiBasis) {
  if (!venster?.fetch || venster.fetch.__sbCsrf) return;
  const origineel = venster.fetch;
  const origin = venster.location?.origin || '';

  const metCsrf = function csrfFetch(input, init = {}) {
    const methode = String(init.method || (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (MUTERENDE_METHODES.has(methode) && naarEigenApi(urlVan(input), apiBasis, origin)) {
      const csrf = leesCsrfCookie();
      if (csrf) {
        const headers = new Headers(init.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined));
        if (!headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', csrf);
        init = { ...init, headers };
      }
    }
    return origineel.call(venster, input, init);
  };
  metCsrf.__sbCsrf = true;
  venster.fetch = metCsrf;
}
