/**
 * StappenIndicator.jsx — Visuele progress bar voor onboarding wizard
 *
 * - Toont 4 dots (1 per stap), met huidige stap geaccentueerd
 * - Voltooide stappen krijgen een check icoon en groene kleur
 * - Subtle connector lijntje tussen dots
 * - A11y: aria-current="step" op de actieve dot
 */
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
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : isActief
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/40 scale-110'
                        : 'bg-white border-slate-300 text-slate-400'}`}
                >
                  {isVoltooid ? <span aria-hidden="true">✓</span> : stap}
                </span>
                {labels[idx] && (
                  <span
                    className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wider hidden sm:block
                      ${isActief ? 'text-blue-700' : isVoltooid ? 'text-emerald-600' : 'text-slate-400'}`}
                  >
                    {labels[idx]}
                  </span>
                )}
              </div>
              {!isLaatst && (
                <div
                  className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors duration-500
                    ${stap < huidigeStap ? 'bg-emerald-400' : 'bg-slate-200'}`}
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
