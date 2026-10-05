/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Oxford Editorial & Academic Guild Luxury Dark Palette
        surface: {
          DEFAULT: "#0C1014", // Deep archival ink-obsidian ground
          dim: "#080B0E",
          bright: "#242E3B",
          "container-lowest": "#06080A",
          "container-low": "#0F141A",
          container: "#131920", // Primary scholarly card surface
          "container-high": "#19222C", // Secondary elevated surface / controls
          "container-highest": "#212C38", // Active chips / pressed states
          variant: "#212C38",
          glass: "rgba(19, 25, 32, 0.88)",
        },
        "on-surface": {
          DEFAULT: "#F4F6F8", // Crisp warm ivory text (high contrast ≥ 12:1)
          variant: "#A1B0C2", // Legible warm slate (high contrast ≥ 4.8:1)
          muted: "#6D7E92",
        },
        "inverse-surface": {
          DEFAULT: "#F4F6F8",
        },
        "inverse-on-surface": {
          DEFAULT: "#0C1014",
        },
        outline: {
          DEFAULT: "rgba(255, 255, 255, 0.12)",
          variant: "rgba(255, 255, 255, 0.08)", // Refined hairline
          subtle: "rgba(255, 255, 255, 0.05)",
        },
        primary: {
          DEFAULT: "#E5A93C", // Oxford Academic Amber / Warm Antique Brass
          light: "#F5C772",
          container: "#2B1F08",
          "on-container": "#F5C772",
          "on-primary": "#1A1203",
          inverse: "#B87F1E",
          fixed: "#FDF0D5",
          "fixed-dim": "#E5A93C",
        },
        secondary: {
          DEFAULT: "#38BDF8", // Scholar Blue / Research accent
          light: "#7DD3FC",
          container: "#0C4A6E",
          "on-container": "#BAE6FD",
          "on-secondary": "#082F49",
          fixed: "#E0F2FE",
          "fixed-dim": "#38BDF8",
        },
        tertiary: {
          DEFAULT: "#10B981", // Oxford Botanical Emerald — Solved / Accepted Answer
          light: "#6EE7B7",
          container: "#063726",
          "on-container": "#A7F3D0",
          "on-tertiary": "#022C22",
          fixed: "#D1FAE5",
        },
        amber: {
          DEFAULT: "#E5A93C", // Scholar Gold / Reputation
          light: "#FDE68A",
          container: "#382305",
          "on-container": "#FCD34D",
        },
        error: {
          DEFAULT: "#F43F5E", // Scholarly Coral Crimson
          container: "#4C0519",
          "on-container": "#FECDD3",
          "on-error": "#4C0519",
        },
        background: {
          DEFAULT: "#0C1014",
        },
        "on-background": {
          DEFAULT: "#F4F6F8",
        },
      },
      fontFamily: {
        headline: ["Georgia", "Times New Roman", "New York", "serif"],
        serif: ["Georgia", "Times New Roman", "New York", "serif"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "System", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "System", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "14px",
        lg: "18px",
        xl: "22px",
        "2xl": "26px",
        "3xl": "32px",
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
