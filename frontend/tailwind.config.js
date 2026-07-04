/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Muted sage — the single accent that carries the "Refined Calm" identity.
        brand: {
          50:  '#f1f6f2',
          100: '#dfeae1',
          200: '#c2d6c6',
          300: '#9bbaa1',
          400: '#6f9879',
          500: '#4f7c59',
          600: '#3d6347',
          700: '#324f3a',
          800: '#2a4031',
          900: '#243529',
          950: '#111d15',
        },
        // Warm off-white canvas vs. crisp white cards.
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f4f3ee',
          subtle:  '#fbfaf6',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tightest: '-0.03em',
      },
      boxShadow: {
        // Warm-tinted, low-contrast shadows for an airy, calm depth.
        card:         '0 1px 2px 0 rgb(41 37 36 / 0.04), 0 4px 16px -6px rgb(41 37 36 / 0.06)',
        'card-hover': '0 4px 22px -6px rgb(41 37 36 / 0.12), 0 2px 6px -2px rgb(41 37 36 / 0.05)',
        modal:        '0 24px 70px -16px rgb(41 37 36 / 0.30)',
      },
      borderColor: {
        DEFAULT: '#e9e7e0',
        strong:  '#b8b4a9',
      },
      animation: {
        'fade-in':       'fadeIn 0.2s ease-out',
        'slide-up':      'slideUp 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'scale-in':      'scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn:      { from: { opacity: '0' },                                  to: { opacity: '1' } },
        slideUp:     { from: { opacity: '0', transform: 'translateY(8px)' },    to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-16px)' },  to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:     { from: { opacity: '0', transform: 'scale(0.97)' },        to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
