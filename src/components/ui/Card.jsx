/**
 * Card.jsx — Herbruikbare container met variant-systeem (UI-1).
 *
 * Geïnspireerd op ING design-system review: containers hebben ROLLEN
 * (expressive accent vs neutral) — niet alle cards zijn gelijk.
 *
 * Variants:
 *   default     — neutrale info/data card (surface + border)
 *   accent      — brand-tinted CTA-zone (brand-50 tint, sterker bij hover)
 *   elevated    — uitgelichte panel met schaduw (sticky widgets, modals)
 *   danger      — risk-zone (delete account, irreversible actions)
 *   success     — bevestigings-zone (transactie voltooid)
 *
 * Sizes (padding-schaal):
 *   sm  → p-3
 *   md  → p-4 (default)
 *   lg  → p-6
 *
 * Met dark-mode automatisch via EE++ semantic tokens.
 *
 * Voorbeeld:
 *   <Card variant="accent" size="lg">
 *     <h3>CTA-titel</h3>
 *     <p>Inhoud</p>
 *   </Card>
 */
import { forwardRef } from 'react';

const VARIANTS = {
  default: 'bg-surface border border-border',
  accent:  'bg-brand-50 border border-brand-100 dark:bg-brand-900/20 dark:border-brand-800/40',
  elevated:'bg-surface border border-border-subtle shadow-soft-md',
  danger:  'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/40',
  success: 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800/40',
};

const SIZES = {
  sm: 'p-3 rounded-xl',
  md: 'p-4 rounded-2xl',
  lg: 'p-6 rounded-2xl',
};

const Card = forwardRef(function Card(
  { variant = 'default', size = 'md', as: Tag = 'div', className = '', children, ...rest },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.default;
  const sizeClass = SIZES[size] || SIZES.md;
  return (
    <Tag
      ref={ref}
      className={`${variantClass} ${sizeClass} transition-colors ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default Card;
