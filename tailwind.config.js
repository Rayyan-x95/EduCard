/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Archival Obsidian & Academic Guild Anti-Slop Palette
        ground: "#0A0D11",
        surface: {
          DEFAULT: "#0A0D11", // Deep archival ink-obsidian ground
          dim: "#06080B",
          bright: "#1D2530",
          "container-lowest": "#05070A",
          "container-low": "#0D1117",
          container: "#11161D", // Primary scholarly card surface
          "container-high": "#18202A", // Secondary elevated surface / controls
          "container-highest": "#212C39", // Active chips / pressed states
          variant: "#212C39",
          glass: "rgba(17, 22, 29, 0.90)",
        },
        "on-surface": {
          DEFAULT: "#F5F7FA", // Crisp warm ivory text (16.4:1 contrast on ground, WCAG AAA)
          variant: "#A3B3C4", // Warm tinted slate (9.0:1 on ground, 8.1:1 on card, WCAG AAA)
          muted: "#76889B", // Legible secondary/caption slate (5.0:1 on ground, 4.5:1 on card, WCAG AA)
        },
        "inverse-surface": {
          DEFAULT: "#F5F7FA",
        },
        "inverse-on-surface": {
          DEFAULT: "#0A0D11",
        },
        outline: {
          DEFAULT: "rgba(215, 230, 250, 0.12)",
          variant: "rgba(215, 230, 250, 0.08)", // Tinted hairline with slate-obsidian undertone
          subtle: "rgba(215, 230, 250, 0.05)",
        },
        primary: {
          DEFAULT: "#D49B35", // Oxford Antique Brass / Academic Gold
          light: "#F6CB76",
          dim: "#B58024",
          container: "#2B1D08",
          "on-container": "#F6CB76",
          "on-primary": "#181003",
          inverse: "#A87217",
          fixed: "#FDF0D5",
          "fixed-dim": "#D49B35",
        },
        secondary: {
          DEFAULT: "#38BDF8", // Scholar Blue / Research accent
          light: "#7DD3FC",
          container: "#0C2E42",
          "on-container": "#BAE6FD",
          "on-secondary": "#051D2B",
          fixed: "#E0F2FE",
          "fixed-dim": "#38BDF8",
        },
        tertiary: {
          DEFAULT: "#2EBF7B", // Oxford Botanical Emerald — Solved / Accepted Answer
          light: "#7FE2AF",
          container: "#0C2519",
          "on-container": "#7FE2AF",
          "on-tertiary": "#022013",
          fixed: "#D1FAE5",
        },
        amber: {
          DEFAULT: "#D49B35", // Scholar Gold / Reputation
          light: "#F6CB76",
          container: "#2B1D08",
          "on-container": "#F6CB76",
        },
        error: {
          DEFAULT: "#EF4E61", // Scholarly Carmine Crimson
          light: "#FFCCD3",
          container: "#2E1015",
          "on-container": "#FFCCD3",
          "on-error": "#2A070D",
        },
        background: {
          DEFAULT: "#0A0D11",
        },
        "on-background": {
          DEFAULT: "#F5F7FA",
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
