import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F59E0B",
          dark: "#F97316",
        },
        accent: "#FB923C",
        relectrik: {
          black: "#000000",
          orange: "#F59E0B",
          white: "#FFFFFF",
          success: "#F59E0B",
          warning: "#FB923C",
          critical: "#EF4444",
          info: "#0EA5E9",
        },
      },
    },
  },
  plugins: [],
};

export default config;
