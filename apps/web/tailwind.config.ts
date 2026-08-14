import type { Config } from 'tailwindcss';

// Branding "emergemos · Medicina Integrativa".
// Verde salvia (#869786) = calma/salud; magenta/vino (flor del logo) = acento;
// gris claro (#E8EDED) = fondo limpio y profesional.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde salvia de la marca (color principal).
        brand: {
          50: '#f2f5f3',
          100: '#e3eae4',
          200: '#c8d5ca',
          300: '#a9bbab',
          400: '#95a897',
          500: '#869786',
          600: '#6d7f6f',
          700: '#57665a',
          800: '#475249',
          900: '#3b443d',
        },
        // Acento magenta/vino (la flor del logo).
        accent: {
          50: '#f9ecf2',
          100: '#f1d3e1',
          500: '#93285f',
          600: '#7c2151',
          700: '#631a41',
        },
        // Gris/blanco de marca para fondos.
        mist: '#E8EDED',
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      fontSize: {
        base: ['1.0625rem', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [],
};

export default config;
