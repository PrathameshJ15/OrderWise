/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arcade: {
          surface: '#0a0b08',
          neutral: '#11120f',
          card: '#141612',
          border: 'rgba(238, 240, 230, 0.08)',
          'border-light': 'rgba(238, 240, 230, 0.18)',
          primary: '#eef0e6',
          secondary: '#8a8f80',
          accent: '#c8ff3a', // high-voltage lime
          danger: '#ff4d4f',
          warning: '#faad14',
          success: '#52c41a',
        },
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '2px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
