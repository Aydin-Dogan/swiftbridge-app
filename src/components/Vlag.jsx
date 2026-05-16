/**
 * Vlag.jsx — Inline SVG vlaggen die op alle apparaten werken
 * (vervangt emoji flags die op Windows niet altijd renderen)
 */

const FLAGS = {
  NL: (s) => (
    <svg viewBox="0 0 9 6" width={s} height={(s * 6) / 9} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="9" height="6" fill="#FFFFFF" />
      <rect width="9" height="2" fill="#AE1C28" />
      <rect y="4" width="9" height="2" fill="#21468B" />
    </svg>
  ),
  TR: (s) => (
    <svg viewBox="0 0 30 20" width={s} height={(s * 20) / 30} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="12" cy="10" r="4.5" fill="#FFFFFF" />
      <circle cx="13.5" cy="10" r="3.6" fill="#E30A17" />
      <polygon points="17.5,10 15.5,11.4 16.3,9.1 14.3,7.8 16.7,7.8 17.5,5.5 18.3,7.8 20.7,7.8 18.7,9.1 19.5,11.4" fill="#FFFFFF" />
    </svg>
  ),
  AZ: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="12" height="8" fill="#FFFFFF" />
      <rect width="12" height="2.67" fill="#00B5E2" />
      <rect width="12" height="2.67" y="2.67" fill="#EF3340" />
      <rect width="12" height="2.66" y="5.34" fill="#00AF66" />
    </svg>
  ),
  KZ: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="12" height="8" fill="#00AFCA" />
      <circle cx="6" cy="4" r="1.5" fill="#FEC50C" />
    </svg>
  ),
  UZ: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="12" height="8" fill="#FFFFFF" />
      <rect width="12" height="2.5" fill="#1EB53A" />
      <rect width="12" height="2.5" y="5.5" fill="#0099B5" />
    </svg>
  ),
  TM: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="12" height="8" fill="#00853E" />
      <rect width="2.5" height="8" fill="#C1272D" />
    </svg>
  ),
  KG: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="12" height="8" fill="#E8112D" />
      <circle cx="6" cy="4" r="1.5" fill="#FFEF00" />
    </svg>
  ),
  US: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="12" height="8" fill="#FFFFFF" />
      {[0, 2, 4, 6].map(y => <rect key={y} width="12" height="0.7" y={y * 1.05 + 0.5} fill="#B22234" />)}
      <rect width="5" height="4.2" fill="#3C3B6E" />
    </svg>
  ),
  GB: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="12" height="8" fill="#012169" />
      <path d="M0,0 L12,8 M12,0 L0,8" stroke="#FFFFFF" strokeWidth="1" />
      <path d="M6,0 V8 M0,4 H12" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M6,0 V8 M0,4 H12" stroke="#C8102E" strokeWidth="1" />
    </svg>
  ),
  EU: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="12" height="8" fill="#003399" />
      <circle cx="6" cy="4" r="2" fill="none" stroke="#FFCC00" strokeWidth="0.3" strokeDasharray="0.3 1.0" />
    </svg>
  ),
  MA: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="12" height="8" fill="#C1272D" />
      <polygon points="6,3 6.6,4.5 8,4.5 6.9,5.4 7.3,6.8 6,6 4.7,6.8 5.1,5.4 4,4.5 5.4,4.5" fill="none" stroke="#006233" strokeWidth="0.2" />
    </svg>
  ),
  BE: (s) => (
    <svg viewBox="0 0 12 8" width={s} height={(s * 8) / 12} style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}>
      <rect width="4" height="8" fill="#000000" />
      <rect width="4" height="8" x="4" fill="#FAE042" />
      <rect width="4" height="8" x="8" fill="#ED2939" />
    </svg>
  ),
};

export default function Vlag({ land = 'NL', size = 20 }) {
  const flag = FLAGS[land?.toUpperCase()];
  if (!flag) {
    // Fallback: gewoon de letters
    return <span style={{ fontWeight: 'bold', fontSize: size * 0.6 }}>{land}</span>;
  }
  return flag(size);
}
