/**
 * Betaalverzoeken.jsx — deelbare betaalverzoeken maken en beheren
 * (BETAALVERZOEK-1, "Tikkie"-concept onder eigen merk).
 *
 * Aanmaken → deelkaart met link, QR-code, kopieer- en WhatsApp-knop.
 * Daaronder de eigen verzoeken met status; open verzoeken zijn in te trekken.
 * De lijst-GET ververst open checkouts lazy bij de betaalprovider.
 */
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useTaal } from '../../i18n';
import { apiFetch } from '../../services/api';
import { Trash, Info } from '../icons/Icons';

function fmtEur(n) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

const STATUS_STIJL = {
  open: 'bg-brand-50 text-brand-700',
  betaald: 'bg-success-50 text-success-700',
  verlopen: 'bg-surface-2 text-ink-3',
  ingetrokken: 'bg-surface-2 text-ink-3',
};

export default function Betaalverzoeken() {
  const { t } = useTaal();
  const [bedrag, setBedrag] = useState('');
  const [omschrijving, setOmschrijving] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState(null);
  const [nieuw, setNieuw] = useState(null); // { deelUrl, verzoek }
  const [qr, setQr] = useState(null);
  const [verzoeken, setVerzoeken] = useState(null);
  const [gekopieerd, setGekopieerd] = useState(false);

  const laad = useCallback(() => {
    return apiFetch('/betaalverzoeken')
      .then((d) => setVerzoeken(d?.verzoeken || []))
      .catch(() => setVerzoeken([]));
  }, []);

  useEffect(() => { laad(); }, [laad]);

  useEffect(() => {
    if (!nieuw?.deelUrl) { setQr(null); return; }
    QRCode.toDataURL(nieuw.deelUrl, { width: 220, margin: 1 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [nieuw]);

  async function maakVerzoek(e) {
    e?.preventDefault();
    if (bezig) return;
    setFout(null);
    const b = Number(String(bedrag).replace(',', '.'));
    if (!isFinite(b) || b < 1 || b > 5000) {
      setFout(t('bv_bedrag_fout', { min: fmtEur(1), max: fmtEur(5000) }));
      return;
    }
    setBezig(true);
    try {
      const d = await apiFetch('/betaalverzoeken', {
        method: 'POST',
        body: { bedragEur: b, omschrijving: omschrijving.trim() || null },
      });
      setNieuw(d);
      setBedrag('');
      setOmschrijving('');
      setGekopieerd(false);
      await laad();
    } catch (err) {
      setFout(typeof err?.error === 'string' ? err.error : t('bv_maak_fout'));
    } finally {
      setBezig(false);
    }
  }

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(nieuw.deelUrl);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2500);
    } catch { /* clipboard geweigerd — de link staat zichtbaar in beeld */ }
  }

  function deelWhatsApp() {
    const tekst = `${t('bv_wa_tekst', { bedrag: fmtEur(nieuw.verzoek.bedragEur) })} ${nieuw.deelUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(tekst)}`, '_blank', 'noopener');
  }

  async function trekIn(id) {
    try {
      await apiFetch(`/betaalverzoeken/${id}`, { method: 'DELETE' });
      await laad();
    } catch { /* lijst blijft staan; opnieuw proberen kan altijd */ }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink-1">{t('bv_titel')}</h1>
      <p className="text-sm text-ink-2">{t('bv_uitleg')}</p>

      {/* Oefenfunctie-melding: eerlijk dat dit nog niet voor echte klanten is */}
      <p className="flex items-start gap-2 text-[12px] text-ink-3 bg-surface-2 border border-border rounded-md px-3 py-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>{t('bv_oefen_melding')}</span>
      </p>

      {/* Nieuw verzoek */}
      <form onSubmit={maakVerzoek} className="rounded-md border border-border bg-surface shadow-soft p-4 space-y-3"
        aria-label={t('bv_nieuw')}>
        <h2 className="font-display font-medium text-ink-1 text-sm">{t('bv_nieuw')}</h2>
        <div>
          <label htmlFor="bv-bedrag" className="block text-xs font-medium text-ink-2 mb-1">{t('ovs_bedrag')}</label>
          <input id="bv-bedrag" type="text" inputMode="decimal" value={bedrag}
            onChange={(e) => setBedrag(e.target.value)}
            placeholder="25,00"
            className="w-full rounded-[3px] border border-border bg-surface px-3 py-2 text-base sm:text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <p className="text-[11px] text-ink-3 mt-1">{t('bv_bedrag_hint', { min: fmtEur(1), max: fmtEur(5000) })}</p>
        </div>
        <div>
          <label htmlFor="bv-omschrijving" className="block text-xs font-medium text-ink-2 mb-1">{t('ovs_omschrijving')}</label>
          <input id="bv-omschrijving" type="text" maxLength={140} value={omschrijving}
            onChange={(e) => setOmschrijving(e.target.value)}
            placeholder={t('bv_omschrijving_placeholder')}
            className="w-full rounded-[3px] border border-border bg-surface px-3 py-2 text-base sm:text-sm text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        {fout && <p role="alert" className="text-sm text-fg-error">{fout}</p>}
        <button type="submit" disabled={bezig} className="btn-inst px-5 py-2.5 disabled:opacity-50">
          {t('bv_maak_knop')}
        </button>
      </form>

      {/* Deelkaart van het zojuist gemaakte verzoek */}
      {nieuw && (
        <div className="rounded-md border border-border bg-surface shadow-soft p-4 space-y-3" aria-live="polite">
          <h2 className="font-display font-medium text-ink-1 text-sm">
            {t('bv_deel_titel', { bedrag: fmtEur(nieuw.verzoek.bedragEur) })}
          </h2>
          {qr && (
            <img src={qr} alt={t('bv_qr_alt')} width={160} height={160}
              className="rounded-md border border-border-subtle" />
          )}
          <p className="text-[12px] text-ink-2 break-all bg-surface-2 rounded-md px-3 py-2">{nieuw.deelUrl}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={kopieer} className="btn-inst px-4 py-2">
              {gekopieerd ? t('bv_gekopieerd') : t('bv_kopieer')}
            </button>
            <button type="button" onClick={deelWhatsApp}
              className="px-4 py-2 rounded-[3px] border border-border text-ink-2 text-sm font-medium hover:bg-surface-2 transition">
              {t('bv_whatsapp')}
            </button>
          </div>
        </div>
      )}

      {/* Eigen verzoeken */}
      <section className="rounded-md border border-border bg-surface shadow-soft overflow-hidden"
        aria-label={t('bv_lijst_titel')}>
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-display font-medium text-ink-1 text-sm">{t('bv_lijst_titel')}</h2>
          <button type="button" onClick={laad}
            className="text-xs text-brand-700 font-semibold hover:underline underline-offset-4">
            {t('bv_ververs')}
          </button>
        </div>
        {verzoeken == null && <p className="text-sm text-ink-3 px-4 py-6">{t('laden')}</p>}
        {verzoeken && verzoeken.length === 0 && (
          <p className="text-sm text-ink-3 px-4 py-6">{t('bv_leeg')}</p>
        )}
        {verzoeken && verzoeken.length > 0 && (
          <ul className="divide-y divide-border-subtle">
            {verzoeken.map((v) => (
              <li key={v.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-ink-1 text-sm truncate">
                    {v.omschrijving || t('bv_zonder_omschrijving')}
                  </div>
                  <div className="text-[11px] text-ink-3 mt-0.5">
                    {(v.aangemaaktOp || '').slice(0, 10)}
                    {v.status === 'betaald' && v.betalerNaam ? ` · ${t('bv_betaald_door', { naam: v.betalerNaam })}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${STATUS_STIJL[v.status] || STATUS_STIJL.verlopen}`}>
                    {t(`bv_status_${v.status}`)}
                  </span>
                  <div className="font-display font-medium text-sm tabular-nums text-ink-1">{fmtEur(v.bedragEur)}</div>
                  {v.status === 'open' && (
                    <button type="button" onClick={() => trekIn(v.id)}
                      aria-label={`${t('bv_intrekken')} ${fmtEur(v.bedragEur)}`}
                      className="text-ink-3 hover:text-fg-error transition">
                      <Trash className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
