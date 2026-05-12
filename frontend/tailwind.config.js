/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf3",
          100: "#d1fae1",
          600: "#15803d",
          700: "#166534",
          800: "#14532d",
          900: "#0f3f24",
        },
      },
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        handwriting: ['"Segoe Print"', '"Bradley Hand ITC"', "cursive"],
      },
    },
  },
  plugins: [],
};
