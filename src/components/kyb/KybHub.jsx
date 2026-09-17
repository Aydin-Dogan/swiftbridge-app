/**
 * KybHub.jsx — stappenoverzicht (7 kaarten) voor een concept-aanvraag.
 * "Ga verder met stap {n}" + aanvraag verwijderen (ConfirmDialog).
 *
 * Props: aanvraag (genormaliseerd), onNaarStap(nr), onIntrekken() -> Promise, bezig
 */
import { useState } from 'react';
import { useTaal } from '../../i18n';
import ConfirmDialog from '../ConfirmDialog';
import { Check, ArrowRight, Trash } from '../icons/Icons';
import { STAPPEN, AANTAL_STAPPEN } from './kybOpties';

export default function KybHub({ aanvraag, onNaarStap, onIntrekken, bezig = false }) {
  const { t } = useTaal();
  const [bevestig, setBevestig] = useState(false);
  const [intrekBezig, setIntrekBezig] = useState(false);
  const voltooid = new Set((aanvraag?.stappenVoltooid || []).map(Number));
  const infoStappen = new Set(((aanvraag?.status === 'info_nodig' && aanvraag?.infoVerzoek?.stappen) || []).map(Number));
  const volgende = Number(aanvraag?.volgendeStap) || 1;

  async function intrek() {
    setIntrekBezig(true);
    try {
      await onIntrekken?.();
      setBevestig(false);
    } finally {
      setIntrekBezig(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600">{t('kyb_product_naam')}</p>
        <h1 className="font-display text-2xl text-ink-1 mt-1">{t('kyb_hub_kop')}</h1>
        <p className="text-sm text-ink-2 mt-1">{t('kyb_hub_uitleg')}</p>
      </div>

      <button type="button" onClick={() => onNaarStap?.(volgende)} disabled={bezig}
        className="btn-inst w-full min-h-[48px] inline-flex items-center justify-center gap-2 disabled:opacity-50">
        {t('kyb_hervat_knop', { stap: volgende })} <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>

      <ol className="space-y-2" aria-label={t('kyb_hub_kop')}>
        {STAPPEN.map((s) => {
          const klaar = voltooid.has(s.nr);
          const aanvullen = infoStappen.has(s.nr);
          const huidig = s.nr === volgende && !klaar;
          return (
            <li key={s.nr}>
              <button
                type="button"
                onClick={() => onNaarStap?.(s.nr)}
                aria-current={huidig ? 'step' : undefined}
                className={`w-full flex items-center gap-3 text-left rounded-md border bg-surface px-4 py-3 min-h-[64px] shadow-soft transition hover:bg-surface-2
                  ${huidig ? 'border-accent-500' : 'border-border'}`}
              >
                <span
                  aria-hidden="true"
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 border-2
                    ${klaar ? 'bg-success-500 border-success-500 text-white' : huidig ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface border-border text-ink-3'}`}
                >
                  {klaar ? <Check className="w-4 h-4" /> : s.nr}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2">
                    {t('kyb_stap_van', { huidig: s.nr, totaal: AANTAL_STAPPEN })} - {t(s.labelKey)}
                  </span>
                  <span className="block text-sm font-semibold text-ink-1">{t(s.titelKey)}</span>
                </span>
                <span className={aanvullen ? 'pill-warning' : klaar ? 'pill-success' : 'pill-neutral'}>
                  {aanvullen ? t('kyb_stap_aanvullen') : klaar ? t('kyb_stap_voltooid') : t('kyb_stap_open')}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {onIntrekken && (
        <div className="pt-2">
          <button type="button" onClick={() => setBevestig(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-3 hover:text-fg-error min-h-[44px]">
            <Trash className="w-4 h-4" aria-hidden="true" /> {t('kyb_verwijder_knop')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={bevestig}
        onClose={() => setBevestig(false)}
        onConfirm={intrek}
        title={t('kyb_verwijder_knop')}
        message={t('kyb_verwijder_bevestig')}
        confirmLabel={t('kyb_verwijder_knop')}
        variant="destructive"
        busy={intrekBezig}
      />
    </div>
  );
}
