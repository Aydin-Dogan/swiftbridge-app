/**
 * UI primitives — SwiftBridge design-system (UI-1).
 *
 * Geinspireerd op ING design-system review. Drie fundamentele bouwstenen
 * die het meest herhaalde patroon vervangen door consistente componenten.
 *
 *   import { Card, Knop, VeldGroep } from './components/ui';
 *
 * Alle componenten:
 *   - Dark-mode-aware via EE++ semantic tokens
 *   - forwardRef voor focus management
 *   - A11y koppeling (aria-busy, aria-invalid, aria-describedby)
 *
 * Toekomstige uitbreidingen die hier kunnen komen:
 *   - Pill / Badge (status indicators)
 *   - Modal wrapper (gemeenschappelijke backdrop + focus trap)
 *   - Switch / Toggle (notification preferences)
 *   - Avatar (huidige Avatar.jsx kan hierheen migreren)
 */
export { default as Card } from './Card';
export { default as Knop } from './Knop';
export { default as VeldGroep } from './VeldGroep';
