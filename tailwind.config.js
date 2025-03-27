/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        secondary: '#1e293b',
        highlight: '#38bdf8',
      },
      zIndex: {
        '100': '100',
        '200': '200',
      }
    },
  },
  plugins: [],
}

