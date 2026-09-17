/**
 * KybStatusScherm.jsx — status na indienen: ingediend / in behandeling /
 * actie nodig (info_nodig) / goedgekeurd / niet goedgekeurd / ingetrokken.
 *
 * Props: aanvraag (genormaliseerd), slaWerkdagen, onNieuw(), onInfoAntwoord(tekst) -> Promise,
 *        onNaarStap(nr), uploadDocument, verwijderDocument, onNaarOvermaken()
 *
 * Bij afwijzing tonen we uitsluitend `berichtKlant` zoals de server die
 * heeft vastgesteld (bij sanctie/PEP/risico is dat de generieke tekst,
 * Wwft art. 23). De reden-code zelf wordt nooit getoond.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { parseError } from '../../services/api';
import { Card, Knop, VeldGroep } from '../ui';
import { CheckCircle, Clock, AlertTriangle, XCircle } from '../icons/Icons';
import KybDocumentUpload from './KybDocumentUpload';
import { statusTKey } from './kybOpties';
import { fmtDatum } from './stapHelpers';

export default function KybStatusScherm({
  aanvraag, slaWerkdagen = 5, onNieuw, onInfoAntwoord, onIndienen, onNaarStap, uploadDocument, verwijderDocument, onNaarOvermaken,
}) {
  const { t, taal } = useTaal();
  const [antwoord, setAntwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [verstuurd, setVerstuurd] = useState(false);
  const status = aanvraag?.status || 'ingediend';
  const pill = <span className={status === 'goedgekeurd' ? 'pill-success' : status === 'afgewezen' || status === 'ingetrokken' ? 'pill-error' : status === 'info_nodig' ? 'pill-warning' : 'pill-neutral'}>{t(statusTKey(status))}</span>;

  async function verstuur() {
    if (antwoord.trim().length === 0 || bezig) return;
    setBezig(true);
    setFout('');
    try {
      await onInfoAntwoord?.(antwoord.trim());
      setVerstuurd(true);
      setAntwoord('');
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  // Na het aanpassen van de heropende stappen: opnieuw indienen zonder verplicht tekstantwoord.
  async function dienOpnieuwIn() {
    if (bezig || !onIndienen) return;
    setBezig(true);
    setFout('');
    try {
      await onIndienen();
    } catch (e) {
      setFout(parseError(e, t));
    } finally {
      setBezig(false);
    }
  }

  if (status === 'goedgekeurd') {
    return (
      <div className="space-y-4 animate-fade-up">
        <Card variant="success" size="lg" className="text-center space-y-3">
          <CheckCircle className="w-14 h-14 mx-auto text-success-600" aria-hidden="true" />
          <h1 className="font-display text-2xl text-ink-1">{t('kyb_goedgekeurd_kop')}</h1>
          <p className="text-sm text-ink-2">{t('kyb_goedgekeurd_tekst')}</p>
          <p className="text-xs text-ink-3">{t('kyb_limieten_regel')}</p>
          <button type="button" onClick={onNaarOvermaken} className="btn-inst w-full min-h-[48px]">{t('kyb_goedgekeurd_knop')}</button>
        </Card>
      </div>
    );
  }

  if (status === 'afgewezen' || status === 'ingetrokken') {
    return (
      <div className="space-y-4 animate-fade-up">
        <Card size="lg" className="space-y-3 shadow-soft">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-fg-error flex-shrink-0" aria-hidden="true" />
            <div>
              <h1 className="font-display text-2xl text-ink-1">
                {status === 'afgewezen' ? t('kyb_afgewezen_kop') : t('kyb_status_ingetrokken')}
              </h1>
              <div className="mt-1">{pill}</div>
            </div>
          </div>
          {status === 'afgewezen' && aanvraag?.berichtKlant && (
            <p className="text-sm text-ink-1 rounded-md bg-surface-2 border border-border px-3.5 py-3">{aanvraag.berichtKlant}</p>
          )}
          <p className="text-xs text-ink-2">
            {t('kyb_afgewezen_contact')}{' '}
            <Link to="/klachten" className="text-brand-700 underline underline-offset-4">{t('service_klacht')}</Link>
          </p>
          {onNieuw && (
            <Knop variant="primary" size="lg" fullWidth onClick={onNieuw}>{t('kyb_afgewezen_opnieuw')}</Knop>
          )}
        </Card>
      </div>
    );
  }

  if (status === 'info_nodig') {
    const iv = aanvraag?.infoVerzoek || {};
    const stappen = Array.isArray(iv.stappen) ? iv.stappen : [];
    const documentSoorten = Array.isArray(iv.documentSoorten) ? iv.documentSoorten : [];
    return (
      <div className="space-y-4 animate-fade-up">
        <Card size="lg" className="space-y-4 shadow-soft border-l-4 border-l-accent-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-accent-600 flex-shrink-0" aria-hidden="true" />
            <div>
              <h1 className="font-display text-2xl text-ink-1">{t('kyb_info_nodig_kop')}</h1>
              <div className="mt-1">{pill}</div>
            </div>
          </div>
          {iv.tekst && <p className="text-sm text-ink-1 rounded-md bg-surface-2 border border-border px-3.5 py-3">{iv.tekst}</p>}
          {stappen.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink-1 mb-2">{t('kyb_info_nodig_stappen')}</p>
              <ul className="flex flex-wrap gap-2">
                {stappen.map((nr) => (
                  <li key={nr}>
                    <Knop variant="secondary" size="md" onClick={() => onNaarStap?.(Number(nr))}>
                      {t('kyb_naar_stap', { stap: nr })}
                    </Knop>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {documentSoorten.length > 0 && uploadDocument && (
            <div className="space-y-3">
              {documentSoorten.map((soort) => (
                <KybDocumentUpload key={soort} soort={soort} documenten={aanvraag?.documenten || []}
                  uploadDocument={uploadDocument} verwijderDocument={verwijderDocument}
                  label={soort === 'kvk_uittreksel' ? t('kyb_uittreksel_label') : `${t('kyb_info_document_toevoegen')}: ${soort}`} />
              ))}
            </div>
          )}
          {documentSoorten.length === 0 && uploadDocument && (
            <KybDocumentUpload soort="info_antwoord" documenten={aanvraag?.documenten || []}
              uploadDocument={uploadDocument} verwijderDocument={verwijderDocument} />
          )}
          {verstuurd ? (
            <p role="status" className="text-sm text-success-700">{t('kyb_status_in_behandeling')}</p>
          ) : (
            <div className="space-y-2">
              <VeldGroep as="textarea" rows={4} label={t('kyb_info_antwoord_label')} value={antwoord}
                onChange={(e) => setAntwoord(e.target.value)} maxLength={2000} />
              {fout && <p role="alert" className="text-sm text-fg-error">{fout}</p>}
              <button type="button" onClick={verstuur} disabled={bezig || antwoord.trim().length === 0}
                className="btn-inst w-full min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed">
                {bezig ? t('laden') : t('kyb_info_antwoord_verstuur')}
              </button>
              {onIndienen && stappen.length > 0 && (
                <Knop variant="secondary" size="lg" fullWidth onClick={dienOpnieuwIn} disabled={bezig}>
                  {t('kyb_indienen_knop')}
                </Knop>
              )}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ingediend / in_behandeling
  return (
    <div className="space-y-4 animate-fade-up">
      <Card size="lg" className="space-y-3 shadow-soft">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-brand-600 flex-shrink-0" aria-hidden="true" />
          <div>
            <h1 className="font-display text-2xl text-ink-1">{t('kyb_klaar_kop')}</h1>
            <div className="mt-1">{pill}</div>
          </div>
        </div>
        <p className="text-sm text-ink-1">{t('kyb_klaar_tekst', { dagen: slaWerkdagen })}</p>
        {aanvraag?.verwachtUiterlijkOp && (
          <p className="text-sm font-semibold text-ink-1">{t('kyb_klaar_datum', { datum: fmtDatum(aanvraag.verwachtUiterlijkOp, taal) })}</p>
        )}
        <p className="text-xs text-ink-3">{t('kyb_klaar_nog_geen_overboeking')}</p>
      </Card>
      <p className="text-xs text-ink-3">{t('kyb_disclaimer_emi')}</p>
    </div>
  );
}
