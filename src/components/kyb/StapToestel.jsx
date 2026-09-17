/**
 * StapToestel.jsx — stap 3: dit toestel koppelen (6-cijferige toegangscode)
 * en optioneel biometrie (passkey). Altijd over te slaan.
 *
 * Props: aanvraag, bezig, serverFout, opgeslagenOm, onOpslaan(body), onTerug()
 */
import { useEffect, useState } from 'react';
import { useTaal } from '../../i18n';
import { apiFetch, parseError } from '../../services/api';
import { passkeySupport, passkeyRegistreer, isGeannuleerd } from '../../services/passkey';
import { CodeInvoer, CODE_LENGTE } from '../../pages/DeviceLogin';
import { Knop } from '../ui';
import { Smartphone, CheckCircle, Fingerprint } from '../icons/Icons';
import KybStapKader from './KybStapKader';

export default function StapToestel({ aanvraag, bezig, serverFout, opgeslagenOm, onOpslaan, onTerug }) {
  const { t } = useTaal();
  const [gekoppeld, setGekoppeld] = useState(!!aanvraag?.toestel?.gekoppeld);
  const [fase, setFase] = useState('kies'); // kies | herhaal | biometrie
  const [code, setCode] = useState('');
  const [code2, setCode2] = useState('');
  const [koppelBezig, setKoppelBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [bioBezig, setBioBezig] = useState(false);
  const [bioKlaar, setBioKlaar] = useState(false);
  const [bioFout, setBioFout] = useState('');

  useEffect(() => {
    let weg = false;
    apiFetch('/auth/apparaat/status')
      .then((d) => { if (!weg && d?.gekoppeld) setGekoppeld(true); })
      .catch(() => { /* niet gekoppeld of geen verbinding: koppelscherm tonen */ });
    return () => { weg = true; };
  }, []);

  async function koppel() {
    if (fase === 'kies') {
      if (code.length !== CODE_LENGTE) return;
      setFout('');
      setFase('herhaal');
      return;
    }
    if (code2 !== code) {
      setFout(t('kyb_code_ongelijk'));
      setCode(''); setCode2(''); setFase('kies');
      return;
    }
    setKoppelBezig(true);
    setFout('');
    try {
      const naam = typeof navigator !== 'undefined' ? (navigator.platform || 'Dit apparaat') : 'Dit apparaat';
      await apiFetch('/auth/apparaat/koppelen', { method: 'POST', body: { toegangscode: code, apparaatNaam: naam } });
      setGekoppeld(true);
      setFase('biometrie');
    } catch (e) {
      setFout(parseError(e, t));
      setCode(''); setCode2(''); setFase('kies');
    } finally {
      setKoppelBezig(false);
    }
  }

  async function biometrieAan() {
    setBioBezig(true);
    setBioFout('');
    try {
      const naam = typeof navigator !== 'undefined' ? (navigator.platform || 'Dit apparaat') : 'Dit apparaat';
      await passkeyRegistreer(naam);
      setBioKlaar(true);
    } catch (e) {
      if (!isGeannuleerd(e)) setBioFout(parseError(e, t));
    } finally {
      setBioBezig(false);
    }
  }

  const huidig = fase === 'herhaal' ? code2 : code;
  const setHuidig = fase === 'herhaal' ? setCode2 : setCode;
  const toonBiometrie = gekoppeld && (fase === 'biometrie' || !aanvraag?.toestel?.gekoppeld);

  return (
    <KybStapKader
      nr={3}
      titel={t('kyb_stap3_titel')}
      onTerug={() => onTerug?.()}
      onOpslaan={gekoppeld ? () => onOpslaan?.({ overgeslagen: false }) : null}
      kanOpslaan={gekoppeld}
      bezig={bezig}
      serverFout={serverFout}
      opgeslagenOm={opgeslagenOm}
    >
      <p className="text-sm text-ink-2">{t('kyb_toestel_uitleg')}</p>

      {gekoppeld ? (
        <div className="rounded-md border border-border-success bg-surface p-4 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0" aria-hidden="true" />
          <div className="text-sm font-semibold text-ink-1">{t('kyb_toestel_al_gekoppeld')}</div>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-brand-600" aria-hidden="true" />
          </div>
          <div className="text-sm font-semibold text-ink-1">
            {fase === 'kies' ? t('kyb_code_kies') : t('kyb_code_herhaal')}
          </div>
          <CodeInvoer key={fase} waarde={huidig} setWaarde={setHuidig} disabled={koppelBezig} />
          {fout && <p role="alert" className="text-sm text-fg-error">{fout}</p>}
          <Knop variant="primary" size="lg" fullWidth laden={koppelBezig} disabled={huidig.length !== CODE_LENGTE} onClick={koppel}>
            {fase === 'kies' ? t('volgende') : t('bevestigen')}
          </Knop>
        </div>
      )}

      {toonBiometrie && !bioKlaar && (
        <div className="rounded-md border border-border bg-surface-2 p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-ink-1 text-sm">
            <Fingerprint className="w-5 h-5 text-brand-600" aria-hidden="true" /> {t('kyb_biometrie_kop')}
          </div>
          <p className="text-xs text-ink-2">{t('kyb_biometrie_uitleg')}</p>
          {passkeySupport() ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Knop variant="primary" size="md" laden={bioBezig} onClick={biometrieAan}>{t('kyb_biometrie_aan')}</Knop>
              <Knop variant="ghost" size="md" onClick={() => onOpslaan?.({ overgeslagen: false })} disabled={bezig}>{t('kyb_biometrie_niet_nu')}</Knop>
            </div>
          ) : (
            <p className="text-xs text-ink-3">{t('kyb_biometrie_niet_beschikbaar')}</p>
          )}
          {bioFout && <p role="alert" className="text-xs text-fg-error">{bioFout}</p>}
        </div>
      )}
      {bioKlaar && (
        <div className="rounded-md border border-border-success bg-surface p-3 flex items-center gap-2 text-sm text-ink-1">
          <CheckCircle className="w-5 h-5 text-success-600" aria-hidden="true" /> {t('kyb_biometrie_kop')}: {t('kyb_stap_voltooid')}
        </div>
      )}

      <div className="pt-1 border-t border-border-subtle">
        <button type="button" onClick={() => onOpslaan?.({ overgeslagen: true })} disabled={bezig}
          className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4 min-h-[44px] disabled:opacity-50">
          {t('kyb_toestel_overslaan')}
        </button>
      </div>
    </KybStapKader>
  );
}
