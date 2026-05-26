/**
 * Avatar.jsx — kleur-cirkel avatar met initialen voor ontvangers (HHH).
 *
 * Genereert deterministisch een kleur + initialen uit de naam zodat dezelfde
 * naam altijd dezelfde avatar krijgt. Geen upload, geen netwerk, alleen CSS.
 *
 * Gebruik:
 *   <Avatar naam="Mehmet Yilmaz" />
 *   <Avatar naam="Mehmet Yilmaz" size={48} />
 *   <Avatar naam="Mehmet Yilmaz" size="sm" />
 */

// 8 brand-vriendelijke kleuren (geen rood — die reserveren we voor errors)
const PALETTE = [
  '#2563EB', // blue-600
  '#7C3AED', // violet-600
  '#0891B2', // cyan-600
  '#059669', // emerald-600
  '#D97706', // amber-600
  '#DB2777', // pink-600
  '#475569', // slate-600
  '#65A30D', // lime-600
];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0; // 32-bit int
  }
  return Math.abs(h);
}

export function initialenUitNaam(naam) {
  if (!naam || typeof naam !== 'string') return '?';
  const woorden = naam.trim().split(/\s+/).filter(Boolean);
  if (!woorden.length) return '?';
  if (woorden.length === 1) return woorden[0].slice(0, 2).toUpperCase();
  return (woorden[0][0] + woorden[woorden.length - 1][0]).toUpperCase();
}

export function kleurUitNaam(naam) {
  if (!naam) return PALETTE[0];
  return PALETTE[hashString(naam) % PALETTE.length];
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export default function Avatar({ naam, size = 'md', className = '' }) {
  const px = typeof size === 'number' ? size : (SIZE_MAP[size] || 40);
  const initialen = initialenUitNaam(naam);
  const kleur = kleurUitNaam(naam);
  const fontSize = Math.round(px * 0.4);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      style={{
        width: `${px}px`,
        height: `${px}px`,
        background: kleur,
        fontSize: `${fontSize}px`,
      }}
      aria-label={naam || 'Onbekend'}
      role="img"
    >
      {initialen}
    </div>
  );
}
