/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        s: 'rgb(var(--s-rgb) / <alpha-value>)',
        s2: 'rgb(var(--s2-rgb) / <alpha-value>)',
        bd: 'rgb(var(--bd-rgb) / <alpha-value>)',
        divider: 'var(--divider)',
        outline: 'var(--outline)',
        t: 'rgb(var(--t-rgb) / <alpha-value>)',
        t2: 'rgb(var(--t2-rgb) / <alpha-value>)',
        ac: 'rgb(var(--ac-rgb) / <alpha-value>)',
        'ac-hover': 'var(--ac-hover)',
        series: 'var(--series)',
        ok: 'rgb(var(--ok-rgb) / <alpha-value>)',
        wa: 'rgb(var(--wa-rgb) / <alpha-value>)',
        no: 'rgb(var(--no-rgb) / <alpha-value>)',
        alert: {
          bg: 'var(--alert-bg)',
          border: 'var(--alert-border)',
        },
        arcade: {
          surface: 'rgb(var(--bg-rgb) / <alpha-value>)',
          neutral: 'rgb(var(--s-rgb) / <alpha-value>)',
          card: 'rgb(var(--s-rgb) / <alpha-value>)',
          border: 'rgb(var(--bd-rgb) / <alpha-value>)',
          'border-light': 'var(--divider)',
          primary: 'rgb(var(--t-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--t2-rgb) / <alpha-value>)',
          accent: '#E50914',
          danger: 'rgb(var(--no-rgb) / <alpha-value>)',
          warning: 'rgb(var(--wa-rgb) / <alpha-value>)',
          success: 'rgb(var(--ok-rgb) / <alpha-value>)',
          info: '#8A8A8A',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        pill: '999px',
        bar: '4px',
      },
      maxWidth: {
        container: '1200px',
      },
      boxShadow: {
        'hero-glow': '0 0 120px rgba(229, 9, 20, 0.15)',
        'card-light': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 12px 40px rgba(229, 9, 20, 0.14)',
      },
    },
  },
  plugins: [],
}
