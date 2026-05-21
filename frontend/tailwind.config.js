/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf7",
          100: "#dcfce9",
          200: "#bbf7d3",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        ink: {
          900: "#111827",
          950: "#07111f",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
        lift: "0 22px 60px rgba(2, 44, 34, 0.14)",
      },
      fontFamily: {
        handwriting: ['"Segoe Print"', '"Bradley Hand ITC"', "cursive"],
      },
    },
  },
  plugins: [],
};
