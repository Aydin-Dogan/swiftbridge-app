/**
 * StappenIndicator.jsx — Visuele progress bar voor wizards (onboarding + KYB)
 *
 * - Toont een dot per stap, met huidige stap geaccentueerd
 * - Voltooide stappen krijgen een check icoon (success-token)
 * - Subtle connector lijntje tussen dots
 * - Huisstijl-tokens: bg-brand-600 (actief) / bg-success-500 (voltooid)
 * - A11y: aria-current="step" op de actieve dot
 */
import { Check } from '../icons/Icons';

export default function StappenIndicator({ huidigeStap, totaalStappen = 4, labels = [] }) {
  return (
    <div className="w-full" role="progressbar" aria-valuemin={1} aria-valuemax={totaalStappen} aria-valuenow={huidigeStap}>
      <ol className="flex items-center justify-between gap-1 px-2">
        {Array.from({ length: totaalStappen }).map((_, idx) => {
          const stap = idx + 1;
          const isVoltooid = stap < huidigeStap;
          const isActief = stap === huidigeStap;
          const isLaatst = idx === totaalStappen - 1;
          return (
            <li key={stap} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  aria-current={isActief ? 'step' : undefined}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all duration-300
                    ${isVoltooid
                      ? 'bg-success-500 border-success-500 text-white shadow-soft'
                      : isActief
                        ? 'bg-brand-600 border-brand-600 text-white shadow-soft-md scale-110'
                        : 'bg-surface border-border text-ink-3'}`}
                >
                  {isVoltooid ? <Check className="w-4 h-4" /> : stap}
                </span>
                {labels[idx] && (
                  <span
                    className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wider hidden sm:block
                      ${isActief ? 'text-brand-700' : isVoltooid ? 'text-success-600' : 'text-ink-3'}`}
                  >
                    {labels[idx]}
                  </span>
                )}
              </div>
              {!isLaatst && (
                <div
                  className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors duration-500
                    ${stap < huidigeStap ? 'bg-success-500' : 'bg-border'}`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
