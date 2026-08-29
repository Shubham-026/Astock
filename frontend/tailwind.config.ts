import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#030712",
          soft: "#070B16",
          deep: "#010206",
        },
        aqua: {
          DEFAULT: "#5EEAD4",
          dim: "#2DD4BF",
          glow: "#99F6E4",
        },
        violet: {
          DEFAULT: "#A78BFA",
          dim: "#8B5CF6",
        },
        up: "#34D399",
        down: "#FB7185",
        warn: "#FBBF24",
        ink: {
          DEFAULT: "#E7ECF3",
          muted: "#8B95A7",
          faint: "#4B5468",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(rgba(94,234,212,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.06) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(circle at 50% 0%, rgba(94,234,212,0.14), transparent 60%)",
      },
      backgroundSize: {
        grid: "42px 42px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "node-travel": {
          "0%": { offsetDistance: "0%", opacity: "0" },
          "8%": { opacity: "1" },
          "92%": { opacity: "1" },
          "100%": { offsetDistance: "100%", opacity: "0" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0px rgba(94,234,212,0)" },
          "50%": { boxShadow: "0 0 34px rgba(94,234,212,0.28)" },
        },
      },
      animation: {
        marquee: "marquee 42s linear infinite",
        "fade-in": "fade-in 0.7s ease-out forwards",
        "pulse-soft": "pulse-soft 3.2s ease-in-out infinite",
        glow: "glow 3.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
