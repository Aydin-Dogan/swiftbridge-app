/**
 * StapIdentiteit.jsx — stap 5: je identiteit.
 *
 * Drie routes (contract sectie 4):
 *   1. al geverifieerd (kyc goedgekeurd of iDIN) -> alleen gegevens controleren
 *   2. iDIN via de bestaande IdinKnop (snelst; geen documentkopie)
 *   3. foto's: op de telefoon inline DocumentUploadFlow, op de computer de
 *      QR/link-handoff (TelefoonHandoff, doel 'kyb') of "geen telefoon bij de hand"
 * Daarna IdGegevensControle -> PUT /kyb/aanvraag/stap/5.
 *
 * Props: aanvraag, account, oefenmodus, bezig, serverFout, opgeslagenOm,
 *        onOpslaan(body), onTerug(), onIdinGelukt()
 */
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useTaal } from '../../i18n';
import { TelefoonHandoff } from '../kyc/TelefoonHandoff';
import { CheckCircle, IdCard, Smartphone } from '../icons/Icons';
import { Knop } from '../ui';
import KybStapKader from './KybStapKader';
import IdGegevensControle from './IdGegevensControle';
import { isTelefoon } from './stapHelpers';

const DocumentUploadFlow = lazy(() => import('../kyc/DocumentUploadFlow'));
// IdinKnop leeft in Profiel.jsx (bestaande component, hergebruikt — geen tweede iDIN-implementatie).
const IdinKnop = lazy(() => import('../Profiel').then((m) => ({ default: m.IdinKnop })));

const ID_TYPES = ['paspoort_eu', 'paspoort_niet_eu', 'id_kaart'];

export default function StapIdentiteit({
  aanvraag, account, oefenmodus = false, bezig, serverFout, opgeslagenOm, onOpslaan, onTerug, onIdinGelukt,
}) {
  const { t } = useTaal();
  const persoon = aanvraag?.persoon || {};
  const identiteit = aanvraag?.identiteit || {};
  const alGeverifieerd = account?.kycStatus === 'goedgekeurd' || account?.idinStatus === 'geverifieerd' || !!identiteit.bevestigdOp;
  const [fotosOntvangen, setFotosOntvangen] = useState(account?.kycStatus === 'in_behandeling');
  const [inlineUpload, setInlineUpload] = useState(false);
  const telefoon = isTelefoon();

  // Support-chat verbergen zolang de camera/upload in beeld is.
  useEffect(() => {
    if (!inlineUpload) return undefined;
    window.dispatchEvent(new CustomEvent('swiftbridge_kyc_scan', { detail: true }));
    return () => window.dispatchEvent(new CustomEvent('swiftbridge_kyc_scan', { detail: false }));
  }, [inlineUpload]);

  const fotosKlaar = useCallback(() => {
    setFotosOntvangen(true);
    setInlineUpload(false);
  }, []);

  const controleBegin = {
    voornamen: identiteit.snapshot?.voornamen || persoon.voornamen || '',
    tussenvoegsel: identiteit.snapshot?.tussenvoegsel || persoon.tussenvoegsel || '',
    achternaam: identiteit.snapshot?.achternaam || persoon.achternaam || '',
    geboortedatum: identiteit.snapshot?.geboortedatum || persoon.geboortedatum || '',
    nationaliteit: identiteit.snapshot?.nationaliteit || persoon.nationaliteit || '',
  };

  const handoffForm = {
    voornaam: persoon.voornamen || '',
    achternaam: persoon.achternaam || '',
    email: account?.email || '',
    geboortedatum: persoon.geboortedatum || '',
    nationaliteit: persoon.nationaliteit || '',
    telefoon: persoon.telefoonMobiel || account?.telefoon || '',
  };

  const toonControle = alGeverifieerd || fotosOntvangen;

  return (
    <KybStapKader
      nr={5}
      titel={t('kyb_stap5_titel')}
      onTerug={() => onTerug?.()}
      onOpslaan={null}
      bezig={bezig}
      serverFout={serverFout}
      opgeslagenOm={opgeslagenOm}
    >
      {alGeverifieerd && (
        <div className="rounded-md border border-border-success bg-surface p-4 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0" aria-hidden="true" />
          <div className="text-sm text-ink-1">{t('kyb_id_al_geverifieerd')}</div>
        </div>
      )}

      {!alGeverifieerd && fotosOntvangen && (
        <div className="rounded-md border border-border-success bg-surface p-4 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0" aria-hidden="true" />
          <div className="text-sm font-semibold text-ink-1">{t('kyb_id_fotos_ontvangen')}</div>
        </div>
      )}

      {!toonControle && (
        <>
          <div className="flex items-start gap-3">
            <IdCard className="w-6 h-6 text-brand-600 flex-shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm text-ink-2">{t('kyb_id_uitleg')}</p>
              <p className="text-xs text-ink-3">{t('kyb_id_geen_rijbewijs')}</p>
            </div>
          </div>

          {/* (a) iDIN — snelst */}
          <div className="space-y-2">
            <h3 className="font-display text-lg text-ink-1">{t('kyb_id_idin_kop')}</h3>
            <p className="text-xs text-ink-2">{t('kyb_id_idin_uitleg')}</p>
            <Suspense fallback={<p className="text-sm text-ink-3">{t('laden')}</p>}>
              <IdinKnop token="cookie" onSucces={() => onIdinGelukt?.()} />
            </Suspense>
          </div>

          {/* (b)/(c) foto's */}
          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <h3 className="font-display text-lg text-ink-1 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-brand-600" aria-hidden="true" /> {t('kyb_id_telefoon_kop')}
            </h3>
            {(telefoon || inlineUpload) ? (
              <Suspense fallback={<p className="text-sm text-ink-3">{t('laden')}</p>}>
                <DocumentUploadFlow
                  toegestaneTypes={ID_TYPES}
                  context="kyb"
                  beginWaarden={{ geboortedatum: persoon.geboortedatum || '', nationaliteit: persoon.nationaliteit || '' }}
                  onSuccess={fotosKlaar}
                  onAnnuleer={inlineUpload && !telefoon ? () => setInlineUpload(false) : undefined}
                />
              </Suspense>
            ) : (
              <>
                <p className="text-xs text-ink-2">{t('kyb_id_qr_uitleg')}</p>
                <TelefoonHandoff form={handoffForm} token="cookie" doel="kyb" onFotosKlaar={fotosKlaar} />
                <Knop variant="secondary" size="md" fullWidth onClick={() => setInlineUpload(true)}>
                  {t('kyb_id_geen_telefoon')}
                </Knop>
              </>
            )}
            {oefenmodus && !telefoon && !inlineUpload && (
              <p className="text-[11px] text-ink-3">{t('kyb_id_wachten')}</p>
            )}
          </div>
        </>
      )}

      {toonControle && (
        <IdGegevensControle begin={controleBegin} bezig={bezig} onBevestig={(body) => onOpslaan?.(body)} />
      )}
    </KybStapKader>
  );
}
