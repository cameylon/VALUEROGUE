import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#e8ecff",
          500: "#4f67ff",
          700: "#2f3fbf"
        }
      }
    }
  },
  plugins: []
};

export default config;
