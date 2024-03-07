/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ['./src/**/*.{html,ts}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
    fontFamily: {
      sans: [
        'sans-serif',
      ],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
