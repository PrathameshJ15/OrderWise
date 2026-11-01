/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        s: '#161616',
        s2: '#232323',
        bd: '#2A2A2A',
        t: '#FFFFFF',
        t2: '#A8A8A8',
        ac: {
          DEFAULT: '#E50914',
          hover: '#c90812',
        },
        series: '#8A8A8A',
        ok: '#4ADE80',
        wa: '#F5B544',
        no: '#FF7A7A',
        alert: {
          bg: '#2B2010',
          border: '#5A4210',
        },
        // Backward-compatibility mapping for components using arcade-* tokens
        arcade: {
          surface: '#0A0A0A',
          neutral: '#161616',
          card: '#161616',
          border: '#2A2A2A',
          'border-light': '#383838',
          primary: '#FFFFFF',
          secondary: '#A8A8A8',
          accent: '#E50914',
          danger: '#FF7A7A',
          warning: '#F5B544',
          success: '#4ADE80',
          info: '#8A8A8A',
        },
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        pill: '999px',
        bar: '4px',
      },
      maxWidth: {
        container: '1120px',
      },
      boxShadow: {
        'hero-glow': '0 0 120px rgba(229, 9, 20, 0.15)',
      },
    },
  },
  plugins: [],
}
