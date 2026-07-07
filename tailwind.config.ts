import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1e3a5f",
          red: "#c0392b",
          gold: "#f39c12",
        },
        vanguard: {
          charcoal: "#0D0E10",
          volt: "#CCFF00",
          crimson: "#E50914",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
