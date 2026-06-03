/** @type {import('tailwindcss').Config} */
//
// SwiftBridge design-system — matte-modern (Wise-stijl)
//
// Eén brand-blauw, één success-groen, één accent-amber.
// Geen glassmorphism. Soft-shadows + meer whitespace.
//
// Gebruik in JSX:
//   bg-brand-500, text-brand-700, border-brand-200
//   bg-success-500, ring-success-500/30
//   bg-accent-400, text-accent-600
//
// Bestaande bg-blue-*, bg-emerald-*, bg-indigo-* etc. blijven werken
// (Tailwind defaults) — over tijd vervangen door brand-* tokens.
//
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // UU: dark-mode via .dark class op <html>. Toggle bewaart light/dark/system
  // in localStorage en zet de class voor de app rendert.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Primary brand (vervangt blue-*) ─────────────────────────────────
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',   // primary actie-kleur
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
        },
        // ── Success (vervangt emerald-*) ────────────────────────────────────
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // ── Accent (vervangt amber-*) — voor highlights, niet voor CTAs ────
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // ── Neutrals — gebruik gewoon Tailwind's gray-* ────────────────────

        // ── Semantische tokens (EE) — wijzig licht/donker via CSS vars
        //    in index.css, niet hier. Gebruik in JSX:
        //      bg-surface  text-ink-1  border-border
        //      bg-surface-2 text-ink-2 text-ink-3
        //    Vermijd hard-coded white/gray-* in nieuwe componenten.
        surface:    'rgb(var(--surface) / <alpha-value>)',
        'surface-2':'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3':'rgb(var(--surface-3) / <alpha-value>)',
        ink: {
          1: 'rgb(var(--ink-1) / <alpha-value>)',  // primary text
          2: 'rgb(var(--ink-2) / <alpha-value>)',  // secondary text
          3: 'rgb(var(--ink-3) / <alpha-value>)',  // muted / placeholder
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
      },
      // Soft shadow-system (vervangt glassmorphism)
      boxShadow: {
        'soft-sm':  '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        'soft':     '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
        'soft-md':  '0 8px 16px -4px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
        'soft-lg':  '0 16px 32px -8px rgba(15, 23, 42, 0.08), 0 8px 16px -4px rgba(15, 23, 42, 0.05)',
        'soft-xl':  '0 24px 48px -12px rgba(15, 23, 42, 0.10), 0 12px 24px -8px rgba(15, 23, 42, 0.06)',
      },
      // Brand-gradient als CSS-variable basis (1 plek aanpassen = overal updaten)
      backgroundImage: {
        'brand-hero': 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0ea5e9 100%)',
        'brand-cta':  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease-out',
        'fade-in':   'fadeIn 0.3s ease-out',
        'shimmer':   'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
