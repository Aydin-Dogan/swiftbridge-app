/**
 * ontvangerBijnaam.js — de bijnaam die de klant in de betaalflow opgeeft, bij
 * de opgeslagen ontvanger zetten (review aanmeldroute punt 11, 14-10-2026).
 *
 * AANLEIDING
 * Het vinkje "Bewaar als favoriete ontvanger" had geen zin meer: sinds punt 11
 * bewaart de server een bankontvanger na een geslaagde betaling toch al. In
 * PaymentFlow staat nu een optioneel veld "Bijnaam". Leeg = de app doet niets.
 * Ingevuld = de klant wil deze ontvanger met die naam in zijn lijst:
 *  - nog niet opgeslagen → POST /beneficiaries (de server screent de naam en
 *    haalt een eerdere verwijdering van deze IBAN weg; het was de klant die hem
 *    nu zelf een naam gaf);
 *  - al opgeslagen (409 met bestaandId) → alleen de bijnaam bijwerken.
 *
 * Best effort: de overboeking wacht hier nooit op en een fout gaat niet naar
 * de klant. Geen IBAN of naam in de console.
 */
import { apiFetch } from './api';

// Zelfde grens als de server (routes/beneficiaries.js).
export const BIJNAAM_MAX = 50;

// De betaalflow wacht hierop vóór het doorsturen naar de betaalpagina; een
// trage server mag dat niet lang ophouden (apiFetch wacht anders 30 s).
const WACHTTIJD_MS = 8000;

function kortSignaal() {
  return typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(WACHTTIJD_MS) : undefined;
}

export async function bewaarBijnaam({ naam, iban, bank, valuta, bijnaam, token } = {}) {
  const schoon = String(bijnaam || '').trim().slice(0, BIJNAAM_MAX);
  const ibanSchoon = String(iban || '').replace(/\s/g, '').toUpperCase();
  if (!schoon || !ibanSchoon) return { bewaard: false };

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    await apiFetch('/beneficiaries', {
      method: 'POST',
      headers,
      signal: kortSignaal(),
      body: {
        naam,
        iban: ibanSchoon,
        bank: bank || null,
        valuta,
        // Zonder land neemt de server TR aan; dan valt een NL-rekening erbuiten.
        land: ibanSchoon.slice(0, 2),
        bijnaam: schoon,
      },
    });
    return { bewaard: true };
  } catch (fout) {
    const bestaandId = fout?.status === 409 ? fout.data?.bestaandId : null;
    if (!bestaandId) return { bewaard: false };
    try {
      await apiFetch(`/beneficiaries/${encodeURIComponent(bestaandId)}`, {
        method: 'PATCH',
        headers,
        signal: kortSignaal(),
        body: { bijnaam: schoon },
      });
      return { bewaard: true };
    } catch {
      return { bewaard: false };
    }
  }
}
