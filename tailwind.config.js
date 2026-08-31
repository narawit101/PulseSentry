/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0075de',
        'primary-pressed': '#005bab',
        'night-band': '#213183',
        'canvas-soft': '#f6f5f4',
        'surface': '#ffffff',
        'hairline': '#e6e6e6',
        'ink': '#000000',
        'ink-charcoal': '#31302e',
        'ink-muted': '#615d59',
        'ink-faint': '#a39e98',
        'sticker-sky': '#62aef0',
        'sticker-purple': '#d6b6f6',
        'sticker-pink': '#ff64c8',
        'sticker-orange': '#dd5b00',
        'sticker-teal': '#2a9d99',
        'sticker-green': '#1aae39',
      },
      boxShadow: {
        'notion-card': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'notion-hover': '0 4px 12px rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        sans: ['var(--app-font)', 'Kanit', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
