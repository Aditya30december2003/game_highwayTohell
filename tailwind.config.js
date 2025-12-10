/** @type {import('tailwindcss').Config} */
export default {
 content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "coin-spin": {
          "0%": { "background-position": "0 0" },
          "100%": { "background-position": "-80px 0" }, // 5 * 16px
        },
      },
      animation: {
        "coin-spin": "coin-spin 0.6s steps(5) infinite",
      },
    },
  },
  plugins: [],
}
