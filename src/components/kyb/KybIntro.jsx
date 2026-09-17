/**
 * KybIntro.jsx — startscherm van "Zakelijk profiel aanvragen": wat het is,
 * wat het kost, wat je nodig hebt en de toezichtzin. Knop "Aanvraag starten".
 *
 * Props: slaWerkdagen, onStart(), bezig, intakeOpen (false = knop weg + melding), fout
 */
import { useTaal } from '../../i18n';
import { Card } from '../ui';
import { Briefcase, IdCard, Building, Clock, CheckCircle } from '../icons/Icons';

export default function KybIntro({ slaWerkdagen = 5, onStart, bezig = false, intakeOpen = true, fout = '' }) {
  const { t } = useTaal();
  const nodig = [
    { Icoon: IdCard, tekst: t('kyb_intro_nodig_1') },
    { Icoon: Building, tekst: t('kyb_intro_nodig_2') },
    { Icoon: Clock, tekst: t('kyb_intro_nodig_3') },
  ];

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <Briefcase className="w-6 h-6 text-brand-600" />
        </div>
        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-600">{t('kyb_product_naam')}</p>
          <h1 className="font-display text-2xl text-ink-1 mt-1">{t('kyb_titel')}</h1>
        </div>
      </div>

      <Card size="lg" className="space-y-3 shadow-soft">
        <p className="text-sm text-ink-1">{t('kyb_product_uitleg')}</p>
        <p className="text-sm text-ink-2">{t('kyb_prijs_regel')}</p>
        <p className="text-sm text-ink-2">{t('kyb_limieten_regel')}</p>
      </Card>

      <Card size="lg" className="space-y-3 shadow-soft">
        <h2 className="font-display text-lg text-ink-1">{t('kyb_intro_kop')}</h2>
        <p className="text-sm text-ink-2">{t('kyb_intro_tekst')}</p>
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-2 pt-1">{t('kyb_intro_nodig_kop')}</h3>
        <ul className="space-y-2">
          {nodig.map(({ Icoon, tekst }) => (
            <li key={tekst} className="flex items-center gap-3 text-sm text-ink-1">
              <span className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Icoon className="w-4 h-4 text-brand-600" />
              </span>
              {tekst}
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2 text-sm text-ink-2 pt-1">
          <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{t('kyb_intro_beoordeling', { dagen: slaWerkdagen })}</span>
        </p>
      </Card>

      {fout && <div role="alert" className="rounded-md border border-border-error bg-surface px-4 py-3 text-sm text-fg-error">{fout}</div>}

      {/* Juridische documenten v1.0: acceptatiecriteria (04) vóór stap 1, nieuw tabblad */}
      <p className="text-sm">
        <a href="/zakelijk/acceptatiecriteria" target="_blank" rel="noopener noreferrer"
          className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-600">
          {t('kyb_acceptatiecriteria_link')}
        </a>
      </p>

      {intakeOpen ? (
        <button type="button" onClick={onStart} disabled={bezig} aria-busy={bezig || undefined}
          className="btn-inst w-full min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed">
          {bezig ? t('laden') : t('kyb_intro_start')}
        </button>
      ) : (
        <div role="status" className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-ink-1">
          {t('kyb_intake_gesloten')}
        </div>
      )}

      <p className="text-xs text-ink-3">{t('kyb_disclaimer_emi')}</p>
    </div>
  );
}
