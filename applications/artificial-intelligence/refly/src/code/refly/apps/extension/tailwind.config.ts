import forms from '@tailwindcss/forms';

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/ai-workspace-common/src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          100: '#F1F1F0',
          200: '#D9E3EA',
          300: '#C5D2DC',
          400: '#9BA9B4',
          500: '#707D86',
          600: '#55595F',
          700: '#33363A',
          800: '#25282C',
          900: '#151719',
          950: '#090A0A',
        },
        green: {
          50: '#eff4f7',
          100: '#E8FFFA',
          200: '#AAEADE',
          300: '#74D5C6',
          400: '#46C0B2',
          500: '#1FAB9F',
          600: '#0E9F77',
          700: '#008481',
          800: '#00716A',
          900: '#18242c',
        },
      },
      spacing: {
        '9/16': '56.25%',
        '3/4': '75%',
        '1/1': '100%',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'architects-daughter': ['"Architects Daughter"', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3.25rem',
        '6xl': '4rem',
      },
      inset: {
        full: '100%',
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.01em',
        wider: '0.02em',
        widest: '0.4em',
      },
      minWidth: {
        10: '2.5rem',
      },
      scale: {
        98: '.98',
      },
    },
  },
  plugins: [forms],
  corePlugins: {
    preflight: false,
  },
};
