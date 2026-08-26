/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Apple & Google High-End Luxury Dark Palette
        surface: {
          DEFAULT: "#0B0F12", // Deep OLED obsidian
          dim: "#070A0C",
          bright: "#2A323D",
          "container-lowest": "#05080A",
          "container-low": "#0F1418",
          container: "#151B21",
          "container-high": "#1C232B",
          "container-highest": "#252E38",
          variant: "#252E38",
          glass: "rgba(21, 27, 33, 0.75)",
        },
        "on-surface": {
          DEFAULT: "#F8FAFC", // Crisp pure white text
          variant: "#94A3B8", // High-clarity slate
          muted: "#64748B",
        },
        "inverse-surface": {
          DEFAULT: "#F8FAFC",
        },
        "inverse-on-surface": {
          DEFAULT: "#0B0F12",
        },
        outline: {
          DEFAULT: "#475569", // Slate 600
          variant: "#2A3441", // Subtle border stroke
          subtle: "rgba(255, 255, 255, 0.08)",
        },
        primary: {
          DEFAULT: "#818CF8", // Electric Indigo
          light: "#C7D2FE",
          container: "#1E1B4B",
          "on-container": "#A5B4FC",
          "on-primary": "#0F172A",
          inverse: "#4F46E5",
          fixed: "#E0E7FF",
          "fixed-dim": "#818CF8",
        },
        secondary: {
          DEFAULT: "#C084FC", // Radiant Violet
          light: "#E9D5FF",
          container: "#3B0764",
          "on-container": "#D8B4FE",
          "on-secondary": "#1E0436",
          fixed: "#F3E8FF",
          "fixed-dim": "#C084FC",
        },
        tertiary: {
          DEFAULT: "#34D399", // Emerald Verified Solution
          light: "#A7F3D0",
          container: "#064E3B",
          "on-container": "#6EE7B7",
          "on-tertiary": "#022C22",
          fixed: "#D1FAE5",
        },
        amber: {
          DEFAULT: "#FBBF24", // Scholar Gold / Reputation
          light: "#FDE68A",
          container: "#451A03",
          "on-container": "#FCD34D",
        },
        error: {
          DEFAULT: "#F87171", // Coral Red
          container: "#450A0A",
          "on-container": "#FECACA",
          "on-error": "#450A0A",
        },
        background: {
          DEFAULT: "#0B0F12",
        },
        "on-background": {
          DEFAULT: "#F8FAFC",
        },
      },
      fontFamily: {
        headline: ["Plus Jakarta Sans", "System", "sans-serif"],
        body: ["Inter", "System", "sans-serif"],
        sans: ["Inter", "System", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "14px",
        lg: "18px",
        xl: "22px",
        "2xl": "28px",
        "3xl": "36px",
        full: "9999px",
      },
      spacing: {
        base: "8px",
        "container-margin": "20px",
        gutter: "16px",
        "card-padding": "20px",
        "section-gap": "32px",
      },
    },
  },
  plugins: [],
};
