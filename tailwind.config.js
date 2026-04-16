/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Azeret Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        framer: {
          blue: '#dc2626', // Subtle medical red accent
          black: '#000000',
          white: '#ffffff',
          silver: '#a6a6a6',
          nearblack: '#090909',
        }
      },
      boxShadow: {
        'ring': 'rgba(220, 38, 38, 0.15) 0px 0px 0px 1px', // Red ring
        'ring-contained': 'rgb(9, 9, 9) 0px 0px 0px 2px',
        'floating': 'rgba(255, 255, 255, 0.1) 0px 0.5px 0px 0.5px, rgba(0, 0, 0, 0.25) 0px 10px 30px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
