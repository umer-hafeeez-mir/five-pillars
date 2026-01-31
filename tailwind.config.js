
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3faf6",
          100: "#e7f6ee",
          200: "#cfeedd",
          300: "#a8dfc0",
          400: "#78c99a",
          500: "#4fb077",
          600: "#2f8d58",
          700: "#1f6f45",
          800: "#185a38",
          900: "#134a2f"
        }
      }
    }
  },
  plugins: []
};
