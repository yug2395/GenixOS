/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'genix-blue': '#00659D',
        'genix-yellow': '#FFCA00',
        'genix-white': '#FFFFFF',
        'terminal-bg': '#1E1E1E',
      },
      fontFamily: {
        'mono': ['SF Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      borderRadius: {
        'window': '14px',
      },
      boxShadow: {
        'window': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}

