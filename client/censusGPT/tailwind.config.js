/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}", "./src/*.{html,js}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark': {
          900: '#1F1F1F',
          800: '#292929',
          300: '#777777'
        }
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
    

