/**
 * passkey.js — WebAuthn-helpers (BIO-1: biometrisch inloggen).
 *
 * De @simplewebauthn/browser-lib wordt lazy geïmporteerd zodat hij alleen
 * laadt wanneer iemand echt een passkey gebruikt. Support-check is sync en
 * dependency-vrij: WebAuthn bestaat alleen in een secure context (https of
 * 127.0.0.1/localhost) — via het LAN-IP in de oefenomgeving dus niet, en
 * daar verbergen de knoppen zichzelf.
 */
import { apiFetch } from './api';

export function passkeySupport() {
  return typeof window !== 'undefined'
    && window.isSecureContext
    && typeof window.PublicKeyCredential !== 'undefined';
}

// Registreer een nieuwe passkey voor de ingelogde gebruiker.
export async function passkeyRegistreer(apparaatNaam) {
  const { startRegistration } = await import('@simplewebauthn/browser');
  const { opties, challengeToken } = await apiFetch('/auth/webauthn/registreer-opties', { method: 'POST', body: {} });
  const respons = await startRegistration({ optionsJSON: opties });
  return apiFetch('/auth/webauthn/registreer', {
    method: 'POST',
    body: { respons, challengeToken, apparaatNaam },
  });
}

// Log in met een passkey (discoverable credential — het toestel toont de kiezer).
// Returnt de login-response ({ token, csrfToken, gebruiker }); cookies zijn dan gezet.
export async function passkeyLogin() {
  const { startAuthentication } = await import('@simplewebauthn/browser');
  const { opties, challengeToken } = await apiFetch('/auth/webauthn/login-opties', { method: 'POST', body: {} });
  const respons = await startAuthentication({ optionsJSON: opties });
  return apiFetch('/auth/webauthn/login', { method: 'POST', body: { respons, challengeToken } });
}

// Door de gebruiker geannuleerde ceremonies zijn geen echte fouten.
export function isGeannuleerd(err) {
  return err && (err.name === 'NotAllowedError' || err.name === 'AbortError');
}
