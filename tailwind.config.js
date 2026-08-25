/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0C',
        ink2: '#1E2024',
        muted: '#5F6368',
        muted2: '#80868B',
        line: '#E3E6EA',
        line2: '#F1F3F5',
        sand: '#F6F7F9',
        green: {
          DEFAULT: '#5BE49B',
          deep: '#00A05A',
          nav: '#3CD98A',
          mint: '#CFF7E1',
        },
        indigo: {
          DEFAULT: '#4B3FD1',
          soft: '#EEEBFF',
          ink: '#3B2FB5',
        },
        amber: { soft: '#FDF0CE', ink: '#8A5B06' },
        blue: { soft: '#DCE9FE', ink: '#1D4ED8' },
        teal: { soft: '#CFF6EF', ink: '#0D6E63' },
        violet: { soft: '#EBE6FE', ink: '#5B25C9' },
      },
      fontFamily: {
        sans: ['Carlito', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        pop: '0 14px 34px rgba(16,24,40,.16)',
      },
    },
  },
  plugins: [],
}
