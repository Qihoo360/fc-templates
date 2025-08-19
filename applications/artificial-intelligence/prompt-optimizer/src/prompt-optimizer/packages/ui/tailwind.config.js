/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 启用基于类的暗黑模式
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        card: 'var(--color-card)',
        text: 'var(--color-text)',
        border: 'var(--color-border)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    function({ addVariant, e }) {
      // 添加自定义主题变体
      addVariant('theme-blue', ['.theme-blue &', ':root.theme-blue &'])
      addVariant('theme-green', ['.theme-green &', ':root.theme-green &'])
      addVariant('theme-purple', ['.theme-purple &', ':root.theme-purple &'])
    }
  ],
}