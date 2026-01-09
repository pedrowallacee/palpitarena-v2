/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'nikao-green': '#a3e635',
        'nikao-dark': '#0f0f0f',
      },
      fontFamily: {
        // Se você configurou a fonte no next/font ou globals.css
        'sport': ['var(--font-teko)'],
      }
    },
  }
}