/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E1B29",
        paper: "#FAFAFA",
        violet: {
          50: "#F3EFFB",
          100: "#E5DCF7",
          200: "#C9B3EE",
          500: "#6D28D9",
          600: "#5B21B6",
          700: "#4C1D95",
          900: "#2E1065",
        },
        muted: "#6B6478",
        line: "#E7E3EE",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};