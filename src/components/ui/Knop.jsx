/**
 * Knop.jsx — Herbruikbare button met variant + size systeem (UI-1).
 *
 * Geïnspireerd op ING's button component-tokens (padding, gap, borderWidth,
 * minHeight, fontWeight — alles consistent per variant).
 *
 * Variants:
 *   primary      — brand CTA (donkere achtergrond + witte tekst)
 *   secondary    — neutraal omkaderd (witte achtergrond + brand-tekst)
 *   ghost        — transparent (tertiaire acties, in card-headers)
 *   destructive  — minus-rood (delete, withdraw, irreversible)
 *
 * Sizes (min-height + padding):
 *   sm → 32px min-height, px-3
 *   md → 40px min-height, px-4 (default)
 *   lg → 48px min-height, px-6
 *
 * Met built-in loading-state (toont spinner + disabled).
 *
 * Voorbeeld:
 *   <Knop variant="primary" size="lg" laden={bezig}>
 *     Stuur bevestigingsmail
 *   </Knop>
 *
 *   <Knop variant="destructive" onClick={verwijderen}>
 *     Account verwijderen
 *   </Knop>
 */
import { forwardRef } from 'react';

const VARIANTS = {
  primary:
    'bg-brand-600 hover:bg-brand-700 text-white shadow-sm ' +
    'disabled:bg-fg-disabled disabled:cursor-not-allowed ' +
    'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
  secondary:
    'bg-surface border border-border-strong text-ink-1 ' +
    'hover:bg-surface-3 hover:border-border-emphasis ' +
    'disabled:bg-surface-2 disabled:text-fg-disabled disabled:cursor-not-allowed ' +
    'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
  ghost:
    'bg-transparent text-ink-2 hover:bg-surface-3 hover:text-ink-1 ' +
    'disabled:text-fg-disabled disabled:cursor-not-allowed ' +
    'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
  destructive:
    'bg-fg-minus hover:bg-fg-minus-soft text-white shadow-sm ' +
    'disabled:bg-fg-disabled disabled:cursor-not-allowed ' +
    'focus:outline-none focus:ring-2 focus:ring-red-500/40',
};

const SIZES = {
  sm: 'min-h-[32px] px-3 text-xs rounded-lg gap-1.5',
  md: 'min-h-[40px] px-4 text-sm rounded-xl gap-2',
  lg: 'min-h-[48px] px-6 text-base rounded-xl gap-2.5',
};

function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const Knop = forwardRef(function Knop(
  {
    variant = 'primary',
    size = 'md',
    laden = false,
    disabled,
    fullWidth = false,
    type = 'button',
    className = '',
    children,
    ...rest
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;
  const widthClass = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || laden;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={laden || undefined}
      className={
        `inline-flex items-center justify-center font-semibold transition active:scale-[0.98] ` +
        `${variantClass} ${sizeClass} ${widthClass} ${className}`
      }
      {...rest}
    >
      {laden && <Spinner className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {children}
    </button>
  );
});

export default Knop;
