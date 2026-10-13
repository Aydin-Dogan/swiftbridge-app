// ── De betaling van een aangemaakte overboeking starten ──────────────────────
// POST /payments/start geeft een Mollie-checkout-link. Dezelfde aanroep hervat
// een lopende betaling en betaalt opnieuw na een afgebroken of mislukte betaling
// (swiftbridge-api/src/routes/payments.js).
//
// Tot 13-10-2026 viel PaymentFlow bij ELKE fout hier "terug op demo modus" en
// toonde "Geld onderweg! Je iDEAL betaling is verwerkt", ook als er niets was
// betaald (analyse aanmeldroute). Alleen PAY_NIET_GECONFIGUREERD betekent dat
// betalen op deze server uit staat (de simulatie); elke andere uitkomst zonder
// checkout-link is een fout die de klant eerlijk te zien krijgt.
import { apiFetch } from './api';

/**
 * @returns {Promise<{ soort: 'doorsturen', checkoutUrl: string }
 *   | { soort: 'simulatie' }
 *   | { soort: 'fout', fout: object }>}  fout is geschikt voor parseError()
 */
export async function startBetaling({ transactieId, methode }) {
  try {
    const data = await apiFetch('/payments/start', {
      method: 'POST',
      body: { transactieId, methode },
    });
    if (data?.checkoutUrl) return { soort: 'doorsturen', checkoutUrl: data.checkoutUrl };
    return { soort: 'fout', fout: { errorCode: 'PAY_MOLLIE_FOUT' } };
  } catch (err) {
    if (err?.errorCode === 'PAY_NIET_GECONFIGUREERD') return { soort: 'simulatie' };
    return { soort: 'fout', fout: err };
  }
}

// Naar de betaalpagina van Mollie. Apart, zodat tests het doorsturen kunnen zien.
export function doorsturenNaar(url) {
  window.location.assign(url);
}
