/**
 * TransactieDoel.jsx — "Waarvoor is deze uitgave?" (TX-DOEL).
 *
 * Herbruikbaar blok: categorie-chips + korte omschrijving + optionele foto
 * van bon/factuur (versleuteld opgeslagen, zelfde beveiliging als
 * KYC-documenten). Gebruikt in het transactiedetail; overslaan mag altijd.
 */
import { useRef, useState } from 'react';
import { useTaal } from '../../i18n';
import { apiFetch } from '../../services/api';

const CATEGORIEEN = ['familie', 'huur', 'zorg', 'onderwijs', 'cadeau', 'zakelijk', 'anders'];

export default function TransactieDoel({ transactieId, beginCategorie = null, beginOmschrijving = '', beginBewijs = false, onGezet }) {
  const { t } = useTaal();
  const [categorie, setCategorie] = useState(beginCategorie);
  const [omschrijving, setOmschrijving] = useState(beginOmschrijving || '');
  const [bewijs, setBewijs] = useState(!!beginBewijs);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState(null); // { soort: 'ok'|'fout', tekst }
  const bestandRef = useRef(null);

  async function slaOp() {
    if (bezig) return;
    setBezig(true);
    setMelding(null);
    try {
      await apiFetch(`/transactions/${transactieId}/doel`, {
        method: 'PATCH',
        body: { categorie: categorie || null, omschrijving: omschrijving.trim() || null },
      });
      setMelding({ soort: 'ok', tekst: t('txdoel_opgeslagen') });
      onGezet?.({ categorie: categorie || null, omschrijving: omschrijving.trim() || null });
    } catch (err) {
      setMelding({ soort: 'fout', tekst: typeof err?.error === 'string' ? err.error : t('txdoel_fout') });
    } finally {
      setBezig(false);
    }
  }

  async function uploadBewijs(e) {
    const bestand = e.target.files?.[0];
    e.target.value = '';
    if (!bestand || bezig) return;
    setBezig(true);
    setMelding(null);
    try {
      const vorm = new FormData();
      vorm.append('bewijs', bestand);
      // FormData: geen Content-Type zetten (browser bepaalt de boundary).
      const token = (() => { try { return localStorage.getItem('token'); } catch { return null; } })();
      const res = await fetch(`/api/transactions/${transactieId}/doel/bewijs`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: vorm,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw data || {};
      setBewijs(true);
      setMelding({ soort: 'ok', tekst: t('txdoel_bewijs_ok') });
    } catch (err) {
      setMelding({ soort: 'fout', tekst: typeof err?.error === 'string' ? err.error : t('txdoel_fout') });
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-border-subtle bg-surface-2 p-3 space-y-2.5">
      <p className="text-xs font-semibold text-ink-1">{t('txdoel_titel')}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('txdoel_titel')}>
        {CATEGORIEEN.map((c) => (
          <button key={c} type="button"
            onClick={() => setCategorie(categorie === c ? null : c)}
            aria-pressed={categorie === c}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition
              ${categorie === c ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface text-ink-2 border-border hover:border-brand-300'}`}>
            {t(`txdoel_cat_${c}`)}
          </button>
        ))}
      </div>
      <input type="text" maxLength={140} value={omschrijving}
        onChange={(e) => setOmschrijving(e.target.value)}
        placeholder={t('txdoel_omschrijving_placeholder')}
        aria-label={t('txdoel_omschrijving_placeholder')}
        className="w-full rounded-[3px] border border-border bg-surface px-3 py-2 text-base sm:text-xs text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand-300" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={slaOp} disabled={bezig}
          className="btn-inst px-4 py-2 disabled:opacity-50">
          {t('opslaan')}
        </button>
        <button type="button" onClick={() => bestandRef.current?.click()} disabled={bezig}
          className="px-4 py-2 rounded-[3px] border border-border text-ink-2 text-xs font-medium hover:bg-surface-2 transition disabled:opacity-50">
          {bewijs ? t('txdoel_bewijs_vervang') : t('txdoel_bewijs_knop')}
        </button>
        <input ref={bestandRef} type="file" accept="image/jpeg,image/png" className="hidden"
          onChange={uploadBewijs} aria-hidden="true" tabIndex={-1} />
        {bewijs && <span className="text-[11px] text-success-700 font-semibold">{t('txdoel_bewijs_aanwezig')}</span>}
      </div>
      {melding && (
        <p role={melding.soort === 'fout' ? 'alert' : 'status'}
          className={`text-[11px] ${melding.soort === 'ok' ? 'text-success-700' : 'text-fg-error'}`}>
          {melding.tekst}
        </p>
      )}
      <p className="text-[10px] text-ink-3">{t('txdoel_privacy')}</p>
    </div>
  );
}
