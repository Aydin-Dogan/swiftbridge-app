/**
 * KoersSparkline.jsx — mini chart EUR→valuta laatste 7 dagen.
 *
 * Verbetering X — bouwt vertrouwen op de Hero: "de koers ging recent omhoog".
 *
 * Data-bron: ECHTE historie via GET /transactions/historie (dagelijkse
 * mid-market snapshots in de backend; zelfde rauwe koers als /koersen, geen
 * FX-marge). Vervangt de vroegere deterministische nep-walk.
 *
 * Eerlijkheid: zolang er nog geen (≥2 dagen) echte historie is, tonen we BEWUST
 * niets (return null) i.p.v. een verzonnen curve. De backend backfilt TRY +
 * EUR-zone via frankfurter, dus de hoofd-corridor heeft meteen data; nieuwe
 * corridors vullen zich via de dagelijkse snapshot.
 *
 * NB: dit component is momenteel niet in de premium Hero gemount (orphaned na
 * de FASE 3-restyle). Het is klaar voor (her)gebruik zodra gewenst.
 */
import { useState, useEffect, useMemo } from 'react';
import { useTaal } from '../../i18n';
import { API_URL } from '../../services/api';

export default function KoersSparkline({ valuta = 'TRY', label }) {
  const { t } = useTaal();
  const [koersen, setKoersen] = useState(null); // null = laden · [] = geen data

  useEffect(() => {
    let actief = true;
    fetch(`${API_URL}/transactions/historie?valuta=${encodeURIComponent(valuta)}&dagen=7`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('http'))))
      .then((d) => { if (actief) setKoersen((d.punten || []).map((p) => p.koers)); })
      .catch(() => { if (actief) setKoersen([]); });
    return () => { actief = false; };
  }, [valuta]);

  const stat = useMemo(() => {
    if (!koersen || koersen.length < 2) return null;
    const vanaf = koersen[0];
    const naar = koersen[koersen.length - 1];
    return {
      punten: koersen,
      deltaPct: vanaf ? ((naar - vanaf) / vanaf) * 100 : 0,
      omhoog: naar >= vanaf,
    };
  }, [koersen]);

  // Geen echte data (cold-start of API down) → bewust niets tonen, geen nep-curve.
  if (!stat) return null;

  const { punten, deltaPct, omhoog } = stat;
  const W = 100;
  const H = 28;
  const min = Math.min(...punten);
  const max = Math.max(...punten);
  const range = max - min || 1;
  const path = punten
    .map((p, i) => {
      const x = (i / (punten.length - 1)) * W;
      const y = H - ((p - min) / range) * H;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
  const fillPath = `${path} L ${W} ${H} L 0 ${H} Z`;

  const kleur = omhoog ? '#10b981' /* emerald-500 */ : '#f97316' /* orange-500 */;
  const fillKleur = omhoog ? 'rgba(16, 185, 129, 0.12)' : 'rgba(249, 115, 22, 0.12)';

  return (
    <div className="flex items-center gap-3 text-xs">
      <svg width="100" height="28" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <path d={fillPath} fill={fillKleur} />
        <path d={path} fill="none" stroke={kleur} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle
          cx={W}
          cy={H - ((punten[punten.length - 1] - min) / range) * H}
          r="2.2"
          fill={kleur}
        />
      </svg>
      <div className="flex items-baseline gap-1.5">
        <span className="text-gray-500">{label || t('hero_koers_7d_label')}</span>
        <span className="font-bold" style={{ color: kleur }}>
          {omhoog ? '+' : ''}{deltaPct.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
