import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        agrokasa: {
          50: "#E8F5EE",
          100: "#D6EDE1",
          200: "#B7DDC8",
          300: "#8BC9A7",
          400: "#5AAD80",
          500: "#0B7A3B",
          600: "#096832",
          700: "#07552A",
          800: "#064422",
          900: "#04351A"
        },
        fondo: "#F5F7F6",
        texto: "#10231A",
        borde: "#DDE7E1"
      },
      boxShadow: {
        suave: "0 12px 30px rgba(16, 35, 26, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;