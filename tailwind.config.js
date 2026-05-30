/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class', // 🚀 Listo para dark/light mode
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // 🚀 Tipografía base
      },
    },
  },
  plugins: [],
}