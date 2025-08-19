/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "../../node_modules/@prompt-optimizer/ui/src/**/*.{vue,js,ts,jsx,tsx}",
    "../ui/src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      backgroundColor: {
        'input-bg': 'rgba(0, 0, 0, 0.2)',
      },
      textColor: {
        'input-text': 'rgba(255, 255, 255, 0.9)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
  ],
  important: true,
} 