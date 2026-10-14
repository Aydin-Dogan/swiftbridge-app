/**
 * VastgehoudenUitbetalingen.jsx — betaald, maar (nog) niet uitbetaald.
 *
 * Externe review H-1: uitbetalingen die op handwerk wachten of die de API
 * vasthoudt (informatieverzoek open, KYC niet goedgekeurd, account opgeschort;
 * API: services/uitbetalingVasthouden.js). Per rij staat erbij of hij NU
 * vastgehouden is en waarom.
 *
 * Tot 14-10-2026 stond dit blok op /beheer (AdminPanel). Die pagina is weg
 * (besluit Aydin): hij nam KYC-besluiten buiten het dossierscherm om en vroeg
 * nog een gedeeld geheim in de adresbalk. Het blok staat nu op het overzicht van
 * de compliancewerkplek en gaat via apiFetch, dus via de medewerkerssessie.
 *
 * Endpoints: GET /admin/payouts/pending, POST /admin/payouts/:id/handmatig-uitbetaald
 * en POST /admin/payouts/:id/opnieuw.
 */
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, parseError } from '../services/api';
import { useTaal } from '../i18n';
import { AlertTriangle } from '../components/icons/Icons';
import { useTx } from '../components/admin/kyb/kybAdminLabels';

// Redenen waarom de API een uitbetaling vasthoudt (API:
// services/uitbetalingVasthouden.js). Een onbekende reden krijgt de algemene tekst.
const VASTHOUD_REDENEN = [
  'informatieverzoek', 'account_opgeschort', 'kyc_niet_goedgekeurd', 'kyb_niet_goedgekeurd', 'klant_onbekend',
];

function vastgehoudenTekst(t, reden) {
  return VASTHOUD_REDENEN.includes(reden)
    ? t(`admin_payout_vastgehouden_${reden}`)
    : t('admin_payout_vastgehouden');
}

function tijdGeleden(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'zojuist';
  if (m < 60) return `${m} min geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} uur geleden`;
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * De melding bij een geweigerde actie.
 *
 * Nog vastgehouden: de reden in gewone woorden. Anders de tekst van de server,
 * niet de algemene vertaling van de foutcode: bij CONFLICT zegt die alleen "kon
 * niet worden uitgevoerd", terwijl de server zegt waaróm (bijvoorbeeld dat de
 * klant nooit heeft betaald). Dit scherm is alleen voor medewerkers.
 */
function foutTekst(e, t) {
  if (e?.data?.reden) return vastgehoudenTekst(t, e.data.reden);
  return e?.data?.error || parseError(e, t);
}

export default function VastgehoudenUitbetalingen() {
  const { t } = useTaal();
  // tx en niet "t(sleutel) || tekst": t geeft bij een ontbrekende sleutel de
  // sleutel zelf terug, en dan stond op /beheer letterlijk
  // "admin_payouts_pending_titel" als kop.
  const tx = useTx();
  const [payouts, setPayouts] = useState([]);

  // Vernieuwen gebeurt door deze teller op te hogen; het ophalen zit in het
  // effect zelf, met een annuleervlag (zelfde aanpak als KycDossiers).
  const [versie, setVersie] = useState(0);
  const laad = useCallback(() => setVersie((v) => v + 1), []);

  // Een fout bij het ophalen laat het blok weg, zoals op de oude pagina: het
  // overzicht eromheen moet bruikbaar blijven.
  useEffect(() => {
    let geannuleerd = false;
    (async () => {
      try {
        const d = await apiFetch('/admin/payouts/pending');
        if (!geannuleerd) setPayouts(d?.payouts || []);
      } catch {
        if (!geannuleerd) setPayouts([]);
      }
    })();
    return () => { geannuleerd = true; };
  }, [versie]);

  async function payoutActie(id, actie) {
    const labels = {
      'handmatig-uitbetaald': tx('admin_payout_actie_markeren', 'als handmatig uitbetaald markeren'),
      'opnieuw': tx('admin_payout_actie_opnieuw', 'opnieuw inplannen'),
    };
    if (!confirm(`${tx('admin_payout_bevestig', 'Weet je zeker dat je deze uitbetaling wilt')} ${labels[actie] || actie}?`)) return;
    try {
      await apiFetch(`/admin/payouts/${id}/${actie}`, { method: 'POST' });
      laad();
    } catch (e) {
      alert('Fout: ' + foutTekst(e, t));
    }
  }

  if (payouts.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-lg font-medium text-ink-1 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-accent-600" />
        {tx('admin_payouts_pending_titel', 'Vastgehouden uitbetalingen')} ({payouts.length})
      </h2>
      <div className="bg-accent-400/10 border border-accent-400/30 rounded-md p-3 text-sm text-ink-2 mb-3">
        {tx('admin_payouts_pending_uitleg', 'Betaald maar (nog) niet uitbetaald — er is geen echte payout-rail actief. Handmatige opvolging vereist.')}
        {payouts.some(p => p.vastgehouden) && (
          <div className="mt-1 font-medium text-ink-1">{t('admin_payout_vastgehouden_uitleg')}</div>
        )}
      </div>
      <div className="overflow-x-auto bg-surface rounded-md border border-border shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[0.7rem] uppercase tracking-[0.16em] text-gray-500 border-b border-border">
              <th className="px-3 py-2">Ref</th>
              <th className="px-3 py-2">{tx('admin_payouts_ontvanger', 'Ontvanger')}</th>
              <th className="px-3 py-2">{tx('admin_payouts_methode', 'Methode')}</th>
              <th className="px-3 py-2 text-right">{tx('admin_payouts_bedrag', 'Bedrag')}</th>
              <th className="px-3 py-2">{tx('admin_payouts_aangemaakt', 'Aangemaakt')}</th>
              <th className="px-3 py-2 text-right">{tx('admin_payouts_actie', 'Actie')}</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p.id} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{p.referentieNr || String(p.id).slice(0, 8)}</td>
                <td className="px-3 py-2">
                  <div className="font-medium text-ink-1">{p.ontvangerNaam || '—'}</div>
                  <div className="text-xs text-ink-3">{p.uitbetaalReferentie || p.ontvangerBank || ''}</div>
                  {p.vastgehouden && (
                    <div className="text-xs font-medium text-red-700 mt-1">{vastgehoudenTekst(t, p.redenVasthouden)}</div>
                  )}
                </td>
                <td className="px-3 py-2 capitalize">{p.uitbetaalMethode || '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  €{Number(p.eurBedrag).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                  <div className="text-xs text-ink-3">{p.valuta} {Math.round(p.tryBedrag).toLocaleString('nl-NL')}</div>
                </td>
                <td className="px-3 py-2 text-ink-2 whitespace-nowrap">{tijdGeleden(p.aangemaaktOp)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {/* Vastgehouden: niet met de hand uitbetalen. "Opnieuw" kijkt
                      of de reden weg is; zo niet, dan zegt de API welke. Een
                      geannuleerde of mislukte overboeking: geen knoppen. */}
                  {p.status !== 'in_behandeling' && !p.vastgehouden ? (
                    <span className="text-xs text-ink-3 whitespace-normal">
                      {t('admin_payout_niet_uitbetaald_status', { status: p.status })}
                    </span>
                  ) : (
                    <>
                      {!p.vastgehouden && (
                        <button
                          onClick={() => payoutActie(p.id, 'handmatig-uitbetaald')}
                          className="text-[0.7rem] font-medium uppercase tracking-[0.14em] bg-success-600 hover:bg-success-700 text-white px-2.5 py-1.5 rounded-md transition">
                          {tx('admin_payout_btn_uitbetaald', 'Uitbetaald')}
                        </button>
                      )}
                      {p.status === 'in_behandeling' && (
                        <button
                          onClick={() => payoutActie(p.id, 'opnieuw')}
                          className="ml-1.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] bg-surface-3 hover:bg-surface-2 text-ink-2 px-2.5 py-1.5 rounded-md transition">
                          {tx('admin_payout_btn_opnieuw', 'Opnieuw')}
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
