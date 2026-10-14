/**
 * VragenVoorBetalen.jsx — eerst de vijf vragen over doel en gebruik, dan pas
 * verder (voorstel aanmeldroute, stap 6; 14-10-2026).
 *
 * Staat in App.jsx om de betaalflow (en om de identificatie zolang de klant nog
 * niet is goedgekeurd). Heeft de klant de vragen al beantwoord, dan zie je dit
 * onderdeel niet: het toont meteen wat erin staat. Ontbreken de antwoorden, dan
 * eerst KycVragen, en daarna gaat de klant direct verder.
 *
 * De route wordt dus alleen langer voor wie nog niet antwoordde, en dat is één
 * keer. Wie in deze sessie al antwoordde, wacht ook niet meer op de server
 * (services/kycAntwoorden.js onthoudt dat per klant).
 *
 * Kan de app de antwoorden niet ophalen (netwerk, storing), dan houdt dit
 * scherm niemand tegen: de KYC-poort van de server keurt toch niemand goed
 * zonder antwoorden, en een al goedgekeurde klant moet kunnen blijven betalen.
 *
 * Props: gebruikerId, overslaan (true = meteen door), children
 */
import { useEffect, useState } from 'react';
import { useTaal } from '../../i18n';
import { haalAntwoorden, isBekendBeantwoord } from '../../services/kycAntwoorden';
import KycVragen from './KycVragen';

function Nakijken() {
  const { t } = useTaal();
  return (
    <section role="status" aria-live="polite" className="max-w-md mx-auto bg-surface border border-border rounded-md p-5 shadow-soft">
      <h2 className="font-display text-xl font-medium text-ink-1">{t('kyc_vragen_nakijken_titel')}</h2>
      <p className="text-sm text-ink-2 mt-1">{t('kyc_vragen_nakijken_tekst')}</p>
      <button type="button" className="btn-inst w-full mt-5 min-h-[48px] text-sm"
        onClick={() => window.dispatchEvent(new CustomEvent('swiftbridge_navigate', { detail: 'dashboard' }))}>
        {t('kyc_vragen_naar_overzicht')}
      </button>
    </section>
  );
}

export default function VragenVoorBetalen({ gebruikerId, overslaan = false, children }) {
  const { t } = useTaal();
  // 'laden' | 'vragen' | 'nakijken' | 'klaar'
  const [stand, setStand] = useState(() => (overslaan || isBekendBeantwoord(gebruikerId) ? 'klaar' : 'laden'));
  const [eerder, setEerder] = useState(null);

  useEffect(() => {
    if (stand !== 'laden') return undefined;
    let weg = false;
    haalAntwoorden(gebruikerId)
      .then((d) => {
        if (weg) return;
        if (d.beantwoord) {
          setStand('klaar');
        } else {
          setEerder(d.antwoorden);
          setStand('vragen');
        }
      })
      .catch(() => { if (!weg) setStand('klaar'); });
    return () => { weg = true; };
  }, [stand, gebruikerId]);

  if (overslaan || stand === 'klaar') return children;
  if (stand === 'nakijken') return <Nakijken />;
  if (stand === 'vragen') {
    return (
      <KycVragen
        gebruikerId={gebruikerId}
        beginwaarden={eerder}
        onKlaar={(uit) => setStand(uit.opnieuwInBeoordeling ? 'nakijken' : 'klaar')}
      />
    );
  }
  return <div className="py-10 text-center text-ink-3 animate-pulse">{t('laden')}</div>;
}
