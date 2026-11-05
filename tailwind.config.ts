import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        geo: {
          dark: "#0b0f19",
          card: "#111827",
          border: "#1f293d",
          accent: "#3b82f6",
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b",
        }
      },
    },
  },
  plugins: [],
};
export default config;
