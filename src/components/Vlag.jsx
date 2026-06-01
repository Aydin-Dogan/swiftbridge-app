/**
 * Vlag.jsx — Wereldwijde landvlaggen via flag-icons (alle ISO 3166-1 landen).
 *
 * Global herpositionering: voorheen 12 handmatige inline SVG's (alleen de
 * Turkse corridor). Nu schaalbaar naar elk land via de flag-icons CSS-library
 * — cross-platform SVG's, geen emoji-renderproblemen op Windows.
 *
 * API ongewijzigd: <Vlag land="TR" size={20} decorative={false} />
 */
import 'flag-icons/css/flag-icons.min.css';

// Volledige landnamen voor a11y / SEO. Niet exhaustief — onbekende codes
// vallen terug op "Vlag van {CODE}". Belangrijkste corridors expliciet.
const LANDNAMEN = {
  NL: 'Nederland', BE: 'België', DE: 'Duitsland', FR: 'Frankrijk', GB: 'Verenigd Koninkrijk',
  EU: 'Europese Unie', US: 'Verenigde Staten', TR: 'Türkiye', MA: 'Marokko',
  AZ: 'Azerbeidzjan', KZ: 'Kazachstan', UZ: 'Oezbekistan', TM: 'Turkmenistan',
  KG: 'Kirgizië', TJ: 'Tadzjikistan', IN: 'India', PK: 'Pakistan', BD: 'Bangladesh',
  PH: 'Filipijnen', ID: 'Indonesië', VN: 'Vietnam', TH: 'Thailand', CN: 'China',
  NG: 'Nigeria', GH: 'Ghana', KE: 'Kenia', EG: 'Egypte', ZA: 'Zuid-Afrika',
  MX: 'Mexico', BR: 'Brazilië', CO: 'Colombia', AR: 'Argentinië', PE: 'Peru',
  ES: 'Spanje', IT: 'Italië', PT: 'Portugal', PL: 'Polen', RO: 'Roemenië',
  UA: 'Oekraïne', RU: 'Rusland', GE: 'Georgië', AM: 'Armenië', LB: 'Libanon',
  AE: 'Verenigde Arabische Emiraten', SA: 'Saoedi-Arabië', LK: 'Sri Lanka',
  NP: 'Nepal', AU: 'Australië', CA: 'Canada', CH: 'Zwitserland', SE: 'Zweden',
  NO: 'Noorwegen', DK: 'Denemarken', JP: 'Japan', KR: 'Zuid-Korea',
};

export default function Vlag({ land = 'NL', size = 20, decorative = false }) {
  const raw = (land || 'NL').toString().toLowerCase();
  // EU is geen ISO-land in flag-icons; map naar de speciale 'eu' code (bestaat wel)
  const code = raw;
  const naam = LANDNAMEN[code.toUpperCase()] || code.toUpperCase();

  // flag-icons rendert een span met background-image. We forceren een vaste
  // pixel-grootte (4:3 ratio) + lichte radius voor de nette pill-look.
  const h = Math.round((size * 3) / 4);

  return (
    <span
      className={`fi fi-${code}`}
      role={decorative ? 'presentation' : 'img'}
      aria-label={decorative ? undefined : `Vlag van ${naam}`}
      aria-hidden={decorative ? 'true' : undefined}
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${h}px`,
        borderRadius: 2,
        backgroundSize: 'cover',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    />
  );
}
