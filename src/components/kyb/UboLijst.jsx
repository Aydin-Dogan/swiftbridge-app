/**
 * UboLijst.jsx — lijst met eigenaren en bestuurders (max 10) + toevoegen,
 * bewerken en verwijderen. De aanvrager zelf wordt door de server toegevoegd
 * (isAanvrager) en is hier alleen-lezen.
 *
 * Props: ubos [], onChange(ubos[]), maxPersonen (default 10)
 */
import { useState } from 'react';
import { useTaal } from '../../i18n';
import { Users, Trash, Plus } from '../icons/Icons';
import { landNaam } from './landNaam';
import UboFormulier from './UboFormulier';
import { MAX_PERSONEN, optieTKey } from './kybOpties';

let volgnummer = 0;
function lokaalId() {
  volgnummer += 1;
  return `lokaal-${Date.now()}-${volgnummer}`;
}

export default function UboLijst({ ubos = [], onChange, maxPersonen = MAX_PERSONEN }) {
  const { t } = useTaal();
  const [bewerk, setBewerk] = useState(null); // null | 'nieuw' | lokaalId/id
  const lijst = Array.isArray(ubos) ? ubos : [];
  const vol = lijst.length >= maxPersonen;

  function bewaar(persoon) {
    const sleutel = persoon._lokaal || persoon.id;
    if (bewerk === 'nieuw' || !sleutel) {
      onChange?.([...lijst, { ...persoon, _lokaal: lokaalId() }]);
    } else {
      onChange?.(lijst.map((p) => ((p._lokaal || p.id) === sleutel ? { ...p, ...persoon } : p)));
    }
    setBewerk(null);
  }

  function verwijder(p) {
    onChange?.(lijst.filter((x) => x !== p));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Users className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="font-display text-lg text-ink-1">{t('kyb_ubo_kop')}</h3>
          <p className="text-xs text-ink-2 mt-1">{t('kyb_ubo_uitleg')}</p>
        </div>
      </div>

      {lijst.length > 0 && (
        <ul className="divide-y divide-border-subtle border border-border rounded-md overflow-hidden">
          {lijst.map((p) => {
            const sleutel = p._lokaal || p.id || `${p.voornamen}-${p.achternaam}`;
            if (bewerk === sleutel) {
              return (
                <li key={sleutel} className="p-2">
                  <UboFormulier waarde={p} onOpslaan={bewaar} onAnnuleer={() => setBewerk(null)} />
                </li>
              );
            }
            return (
              <li key={sleutel} className="flex items-center gap-3 px-3.5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-1 truncate">
                    {[p.voornamen, p.tussenvoegsel, p.achternaam].filter(Boolean).join(' ')}
                    {p.isAanvrager && <span className="ml-2 pill-neutral">{t('kyb_stap2_label')}</span>}
                  </div>
                  <div className="text-xs text-ink-3">
                    {t(optieTKey('UBO_ROL', p.rol))}
                    {p.rol === 'ubo' && p.uboPercentageKlasse ? ` - ${t(optieTKey('UBO_PCT', p.uboPercentageKlasse))}` : ''}
                    {p.nationaliteit ? ` - ${landNaam(p.nationaliteit)}` : ''}
                  </div>
                </div>
                {!p.isAanvrager && (
                  <>
                    <button type="button" onClick={() => setBewerk(sleutel)}
                      className="text-sm font-semibold text-brand-700 hover:underline underline-offset-4 min-h-[44px] px-2">
                      {t('kyb_wijzig')}
                    </button>
                    <button type="button" onClick={() => verwijder(p)}
                      aria-label={`${t('kyb_verwijder_knop')}: ${p.voornamen} ${p.achternaam}`}
                      className="w-10 h-10 rounded-md flex items-center justify-center text-ink-3 hover:text-fg-error hover:bg-surface-2 transition">
                      <Trash className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {bewerk === 'nieuw' ? (
        <UboFormulier onOpslaan={bewaar} onAnnuleer={() => setBewerk(null)} />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setBewerk('nieuw')}
            disabled={vol}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-md border border-border-strong text-sm font-semibold text-ink-1 hover:bg-surface-2 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> {t('kyb_ubo_toevoegen')}
          </button>
          {vol && <p className="text-xs text-ink-3">{t('kyb_ubo_limiet')}</p>}
        </>
      )}
    </div>
  );
}
