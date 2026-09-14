/** @type {import('tailwindcss').Config} */
// NOTE: This project uses Tailwind CSS v4.
// In v4, custom colors and theme tokens are defined via @theme in src/index.css — NOT here.
// This file is kept for compatibility but the theme section is ignored by v4.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
