/**
 * VeldGroep.jsx — Form field wrapper met label, input, hint en error (UI-1).
 *
 * Lost het patroon op dat door ALLE modals en forms heen herhaald wordt:
 *   <div>
 *     <label>...</label>
 *     <input className="border-2 border-gray-200 rounded-xl px-3 py-2.5 ..." />
 *     <p className="text-xs text-gray-500">...</p>
 *   </div>
 *
 * Eén component, één consistente styling, automatic dark-mode + a11y koppeling.
 *
 * Props:
 *   label       — verplichte label-tekst
 *   id          — auto-gegenereerd als niet meegegeven, voor htmlFor + aria-describedby
 *   hint        — kleine uitleg onder het veld (grijs)
 *   fout        — foutmelding (verbergt hint, kleurt input-border rood)
 *   leading     — element vóór input (icoon, prefix)
 *   trailing    — element na input (knop, icoon)
 *   verplicht   — toont kleine '*' indicator
 *   as          — 'input' (default) of 'textarea'
 *   ...rest     — gaat naar het input element
 *
 * Voorbeeld:
 *   <VeldGroep
 *     label="Nieuw e-mailadres"
 *     type="email"
 *     value={x}
 *     onChange={e => setX(e.target.value)}
 *     hint="We sturen een bevestigingslink"
 *     fout={fouten.email}
 *     verplicht
 *   />
 */
import { forwardRef, useId } from 'react';

const VeldGroep = forwardRef(function VeldGroep(
  {
    label,
    id: idProp,
    hint,
    fout,
    leading,
    trailing,
    verplicht = false,
    as = 'input',
    className = '',
    rows = 3,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  const hintId = `${id}-hint`;
  const foutId = `${id}-fout`;
  const heeftFout = Boolean(fout);

  const Input = as === 'textarea' ? 'textarea' : 'input';
  const inputExtra = as === 'textarea' ? { rows } : {};

  const inputClasses =
    `w-full bg-surface text-ink-1 placeholder:text-ink-3 ` +
    `border-2 rounded-xl px-3 py-2.5 text-sm outline-none transition ` +
    `disabled:bg-surface-2 disabled:text-fg-disabled disabled:cursor-not-allowed ` +
    (heeftFout
      ? `border-border-error focus:border-fg-error focus:ring-2 focus:ring-fg-error/20`
      : `border-border focus:border-border-focus focus:ring-2 focus:ring-brand-500/20`) +
    ` ${leading ? 'pl-10' : ''} ${trailing ? 'pr-10' : ''}`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-ink-2 mb-1">
          {label}
          {verplicht && <span className="text-fg-error ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {leading && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none">
            {leading}
          </div>
        )}
        <Input
          ref={ref}
          id={id}
          aria-invalid={heeftFout || undefined}
          aria-describedby={heeftFout ? foutId : hint ? hintId : undefined}
          className={inputClasses}
          {...inputExtra}
          {...rest}
        />
        {trailing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        )}
      </div>
      {heeftFout && (
        <p id={foutId} role="alert" className="text-[11px] text-fg-error mt-1">
          {fout}
        </p>
      )}
      {!heeftFout && hint && (
        <p id={hintId} className="text-[11px] text-ink-3 mt-1">
          {hint}
        </p>
      )}
    </div>
  );
});

export default VeldGroep;
