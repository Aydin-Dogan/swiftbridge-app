/**
 * KybDashboardKaart.jsx — kaart op het Overzicht voor zakelijke accounts
 * zonder goedgekeurd zakelijk profiel (patroon van de KYC-waarschuwing).
 *
 * Props: gebruiker (uit /auth/me: accountType, kybStatus)
 * Haalt GET /kyb/status op voor volgendeStap / verwachtUiterlijkOp.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaal } from '../../i18n';
import { haalStatus } from '../../services/kyb';
import { Briefcase } from '../icons/Icons';
import { fmtDatum } from './stapHelpers';

export default function KybDashboardKaart({ gebruiker }) {
  const { t, taal } = useTaal();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const zakelijk = gebruiker?.accountType === 'zakelijk';
  const kybStatus = status?.kybStatus || gebruiker?.kybStatus || 'geen';

  useEffect(() => {
    if (!zakelijk) return undefined;
    let weg = false;
    haalStatus()
      .then((d) => { if (!weg && d) setStatus(d); })
      .catch(() => { /* kaart werkt ook op /auth/me alleen */ });
    return () => { weg = true; };
  }, [zakelijk, gebruiker?.kybStatus]);

  if (!zakelijk || kybStatus === 'goedgekeurd') return null;

  const volgendeStap = Number(status?.volgendeStap) || 1;
  let tekst = t('kyb_dashboard_geen');
  let knop = t('kyb_dashboard_knop_start');
  let doel = '/app/zakelijk-aanvraag';
  if (kybStatus === 'concept') {
    tekst = t('kyb_dashboard_concept', { stap: volgendeStap });
    knop = t('kyb_hervat_knop', { stap: volgendeStap });
    doel = `/app/zakelijk-aanvraag/stap/${volgendeStap}`;
  } else if (kybStatus === 'ingediend' || kybStatus === 'in_behandeling') {
    tekst = t('kyb_dashboard_ingediend', { datum: fmtDatum(status?.verwachtUiterlijkOp, taal) || '-' });
    knop = t('kyb_dashboard_knop_bekijk');
  } else if (kybStatus === 'info_nodig') {
    tekst = t('kyb_dashboard_info_nodig');
    knop = t('kyb_dashboard_knop_bekijk');
  } else if (kybStatus === 'afgewezen' || kybStatus === 'ingetrokken') {
    tekst = t('kyb_dashboard_afgewezen');
    knop = t('kyb_dashboard_knop_bekijk');
  }

  return (
    <div role="region" aria-label={t('kyb_dashboard_kaart_kop')}
      className="bg-surface border border-accent-400 rounded-md shadow-soft p-4 flex gap-3 items-start animate-fade-up">
      <Briefcase className="w-6 h-6 text-accent-600 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <div className="font-display font-medium text-ink-1 text-sm">{t('kyb_dashboard_kaart_kop')}</div>
        <div className="text-ink-2 text-xs mt-1">{tekst}</div>
        <button type="button" onClick={() => navigate(doel)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline underline-offset-4 focus:outline-none focus:underline min-h-[44px]">
          {knop}
        </button>
      </div>
    </div>
  );
}
