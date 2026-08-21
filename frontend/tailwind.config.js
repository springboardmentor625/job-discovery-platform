/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B1524',
        surface: '#121F35',
        surfaceHi: '#182A47',
        dossier: '#F3EEDF',
        inkOnPaper: '#1B1B18',
        gold: '#D6A24E',
        teal: '#2BB3A3',
        coral: '#E2604C',
        textHi: '#F5F3EC',
        textLo: '#9AA6B8',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['"General Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        dossier: '0 12px 30px -8px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.25)',
      },
      keyframes: {
        stampIn: {
          '0%': { transform: 'scale(0.4) rotate(-18deg)', opacity: '0' },
          '60%': { transform: 'scale(1.08) rotate(-8deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-8deg)', opacity: '1' },
        },
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(-90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
      },
      animation: {
        stampIn: 'stampIn 420ms cubic-bezier(.2,.9,.3,1.2) both',
        flip: 'flip 400ms ease-in-out',
      },
    },
  },
  plugins: [],
};
