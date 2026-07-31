/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        git: {
          dark: '#0d1117',
          panel: '#161b22',
          border: '#30363d',
          accent: '#238636',
          cyan: '#38bdf8',
          violet: '#a855f7',
          highlight: '#1f6feb',
          danger: '#da3633',
          warning: '#d29922'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
