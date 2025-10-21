/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // use .dark on html root
  content: [
    './public/index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#e0f0ff',
          200: '#b9dcff',
          300: '#83c3ff',
          400: '#4ba9ff',
          500: '#1d8fff',
          600: '#0b6fd4',
          700: '#0a53a1',
          800: '#0a3b6e',
          900: '#082846',
        },
        accent: {
          400: '#ffb347',
          500: '#ff951d',
          600: '#e77800',
        },
      },
      boxShadow: {
        'elevate-sm': '0 1px 2px 0 rgba(0,0,0,0.06), 0 1px 3px 1px rgba(0,0,0,0.08)',
        'elevate-md': '0 4px 12px -2px rgba(0,0,0,0.15), 0 2px 4px -1px rgba(0,0,0,0.1)',
        glow: '0 0 0 1px rgba(255,255,255,0.25), 0 4px 24px -4px rgba(30,60,150,0.4)',
      },
      borderRadius: {
        'xl': '1rem',
      },
      transitionTimingFunction: {
        'swift-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-bullets': theme('colors.primary.500'),
            a: {
              color: theme('colors.primary.600'),
              textDecoration: 'none',
              fontWeight: '500',
            },
            'a:hover': {
              color: theme('colors.primary.500'),
            },
            code: {
              backgroundColor: theme('colors.primary.50'),
              padding: '2px 4px',
              borderRadius: '4px',
              fontWeight: '500',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.slate.300'),
            a: { color: theme('colors.primary.400') },
            'a:hover': { color: theme('colors.primary.300') },
            code: { backgroundColor: theme('colors.slate.800'), color: theme('colors.primary.200') },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};