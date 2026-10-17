/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // CRED Aesthetic Dark Mode Palette
        ground: "#000000",
        surface: {
          DEFAULT: "#000000", // True Pitch Black
          dim: "#050505",
          bright: "#1C1C1E",
          "container-lowest": "#000000",
          "container-low": "#0D0D0D",
          container: "#121212", // Neumorphic dark glass base
          "container-high": "#1C1C1E", // Elevated surface
          "container-highest": "#2C2C2E", // Active chips / pressed states
          variant: "#1C1C1E",
          glass: "rgba(18, 18, 18, 0.90)",
        },
        "on-surface": {
          DEFAULT: "#FFFFFF", // Pure white for max contrast on #000
          variant: "#8E8E93", // Cool metallic grey
          muted: "#636366", // Deep tertiary text
        },
        "inverse-surface": {
          DEFAULT: "#FFFFFF",
        },
        "inverse-on-surface": {
          DEFAULT: "#000000",
        },
        outline: {
          DEFAULT: "rgba(255, 255, 255, 0.12)",
          variant: "rgba(255, 255, 255, 0.08)", // Sharp glass border
          subtle: "rgba(255, 255, 255, 0.04)",
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
          DEFAULT: "#00FF9D", // CRED Neon Mint for Success
          light: "#66FFC4",
          container: "#00331F",
          "on-container": "#00FF9D",
          "on-tertiary": "#002214",
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
          DEFAULT: "#000000",
        },
        "on-background": {
          DEFAULT: "#FFFFFF",
        },
      },
      fontFamily: {
        headline: ["Inter", "-apple-system", "BlinkMacSystemFont", "System", "sans-serif"],
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
