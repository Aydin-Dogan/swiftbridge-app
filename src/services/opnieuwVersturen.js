// ── Opnieuw versturen: een eerdere overboeking klaarzetten in de betaalflow ──
// "Snel opnieuw" op het overzicht, "Opnieuw versturen" op een bon of bij een
// mislukte overboeking, en het adresboek geven de betaalflow (PaymentFlow) de
// ontvanger, IBAN, bank, het laatste bedrag en de valuta mee.
//
// Aanmeldroute punt 11 (13-10-2026): de tweede overboeking in twee tikken.
//  - Via sessionStorage, niet via localStorage. Naam en IBAN horen niet op het
//    toestel achter te blijven; sessionStorage is weg als het tabblad sluit en
//    App.jsx wist hem bij uitloggen. Tot nu toe ging dit via localStorage.
//  - De bank gaat mee; die ontbrak, waardoor de klant hem opnieuw moest kiezen.
//  - `direct`: alles is bekend, dus de betaalflow mag meteen het bevestigscherm
//    tonen. De betaalflow controleert dat zelf nog (bedrag, IBAN, uitbetaalweg)
//    en de server controleert de overboeking daarna zoals altijd.
//
// De sleutel blijft dezelfde als vroeger: App.jsx kent hem al als gevoelig.

export const OPNIEUW_SLEUTEL = 'swiftbridge_repeat_tx';

// Is deze overboeking gelukt? Voltooid, of betaald en onderweg (uitbetalen gaat
// nu nog met de hand en kan even duren). Een mislukte of geannuleerde nooit.
export function isGeslaagd(tx) {
  if (!tx) return false;
  if (tx.status === 'mislukt' || tx.status === 'geannuleerd') return false;
  if (tx.status === 'voltooid') return true;
  return (tx.betalingStatus || tx.betaling_status) === 'paid';
}

// Wat de betaalflow van een eerdere overboeking overneemt.
export function gegevensUitTransactie(tx) {
  return {
    ontvanger: tx?.ontvangerNaam || tx?.ontvanger_naam || '',
    iban: tx?.ontvangerIBAN || tx?.ontvanger_iban || '',
    bank: tx?.ontvangerBank || tx?.ontvanger_bank || '',
    bedrag: tx?.eurBedrag ?? tx?.eur_bedrag,
    valuta: tx?.valuta || 'TRY',
  };
}

// Zet de gegevens klaar en ga naar de betaalflow.
export function zetOpnieuwKlaar(gegevens, { direct = false } = {}) {
  try {
    sessionStorage.setItem(OPNIEUW_SLEUTEL, JSON.stringify({ ...gegevens, direct: Boolean(direct) }));
  } catch { /* privémodus: de klant vult zelf in */ }
  // Een oude overdracht uit localStorage mag niet later alsnog opduiken.
  try { localStorage.removeItem(OPNIEUW_SLEUTEL); } catch { /* idem */ }
  window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'betaling' }));
}

// Lees de klaargezette gegevens één keer (daarna zijn ze weg). Leest ook nog een
// overdracht in localStorage van vóór deze versie.
export function haalOpnieuwKlaar() {
  let ruw = null;
  try { ruw = sessionStorage.getItem(OPNIEUW_SLEUTEL); } catch { /* privémodus */ }
  if (!ruw) {
    try { ruw = localStorage.getItem(OPNIEUW_SLEUTEL); } catch { /* idem */ }
  }
  try { sessionStorage.removeItem(OPNIEUW_SLEUTEL); } catch { /* idem */ }
  try { localStorage.removeItem(OPNIEUW_SLEUTEL); } catch { /* idem */ }
  if (!ruw) return null;
  try {
    const gegevens = JSON.parse(ruw);
    return gegevens && typeof gegevens === 'object' ? { direct: false, ...gegevens } : null;
  } catch {
    return null;
  }
}
