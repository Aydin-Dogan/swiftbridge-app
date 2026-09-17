/**
 * KybVraag.jsx — één vraag in een KYB-stap, met rode markering als die nog
 * niet is ingevuld nadat de klant probeerde verder te gaan.
 *
 * Props: veld (string of string[]; sleutel(s) uit de ontbrekend-lijst van de stap),
 *        kop, uitleg, children, className
 */
import { useTaal } from '../../i18n';
import { AlertTriangle } from '../icons/Icons';
import { VeldGroep } from '../ui';
import { useKybVeldMist } from './kybFoutContext';

/** VeldGroep die rood wordt (met melding) als `veld` nog niet is ingevuld. */
export function KybVeldGroep({ veld, fout, ...props }) {
  const { t } = useTaal();
  const mist = useKybVeldMist(veld);
  return (
    <div data-kyb-ontbreekt={mist ? 'true' : undefined} className={props.className}>
      <VeldGroep {...props} className={undefined} fout={mist ? t('kyb_veld_ontbreekt') : fout} />
    </div>
  );
}

export default function KybVraag({ veld, kop, uitleg, children, className = '' }) {
  const { t } = useTaal();
  const mist = useKybVeldMist(veld);
  return (
    <div
      data-kyb-ontbreekt={mist ? 'true' : undefined}
      className={`${className} ${mist ? 'border-l-4 border-border-error bg-red-50/60 rounded-r-md pl-3 pr-2 py-2 -ml-1' : ''}`}
    >
      {kop && <div className={`text-sm font-medium mb-2 ${mist ? 'text-fg-error' : 'text-ink-1'}`}>{kop}</div>}
      {uitleg && <p className="text-xs text-ink-3 mb-2">{uitleg}</p>}
      {children}
      {mist && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-fg-error">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          {t('kyb_veld_ontbreekt')}
        </p>
      )}
    </div>
  );
}
