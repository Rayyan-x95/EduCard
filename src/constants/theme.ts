/**
 * EduCard Design System — Archival Academic Obsidian Theme Tokens
 *
 * Designed according to app-designer principles:
 * - Specific, defended roles before values
 * - Archival, warm ink-obsidian ground
 * - Oxford Antique Brass/Gold primary accent (no generic Tailwind palette)
 * - Botanical Laurel Emerald for accepted/solved answers
 * - High-contrast text layers strictly meeting WCAG AA (>= 4.5:1 for body, >= 3:1 for metadata)
 */

export const THEME = {
  // Ground & Elevation Layers
  ground: "#0A0D11",
  groundDim: "#06080B",
  groundBright: "#1D2530",

  surface: {
    DEFAULT: "#0A0D11",
    dim: "#06080B",
    bright: "#1D2530",
    containerLowest: "#05070A",
    containerLow: "#0D1117",
    container: "#11161D",
    containerHigh: "#18202A",
    containerHighest: "#212C39",
    variant: "#212C39",
    glass: "rgba(17, 22, 29, 0.90)",
  },

  // Typographic Ink Layers (High Contrast)
  ink: {
    DEFAULT: "#F5F7FA", // 16.4:1 contrast on ground (WCAG AAA)
    variant: "#A3B3C4", // 9.0:1 contrast on ground, 8.1:1 on container (WCAG AAA)
    muted: "#76889B", // 5.0:1 contrast on ground, 4.5:1 on container (WCAG AA)
    disabled: "#4E5D6E",
  },

  // Structural Rules & Hairlines
  rule: {
    DEFAULT: "rgba(215, 230, 250, 0.08)",
    elevated: "rgba(215, 230, 250, 0.14)",
    subtle: "rgba(215, 230, 250, 0.05)",
  },

  // Oxford Antique Brass / Academic Gold (Brand & Core Action)
  primary: {
    DEFAULT: "#D49B35",
    light: "#F6CB76",
    dim: "#B58024",
    container: "#2B1D08",
    onContainer: "#F6CB76",
    onPrimary: "#181003",
  },

  // Secondary / Scholar Cyan (Specialized Research Metadata)
  secondary: {
    DEFAULT: "#38BDF8",
    light: "#7DD3FC",
    container: "#0C2E42",
    onContainer: "#BAE6FD",
    onSecondary: "#051D2B",
  },

  // Tertiary / Botanical Laurel Emerald (Accepted Solutions & Solved State)
  tertiary: {
    DEFAULT: "#2EBF7B",
    light: "#7FE2AF",
    container: "#0C2519",
    border: "#1A4E35",
    onContainer: "#7FE2AF",
    onTertiary: "#022013",
  },

  // Destructive / Scholarly Carmine Crimson
  error: {
    DEFAULT: "#EF4E61",
    light: "#FFCCD3",
    container: "#2E1015",
    border: "#5E1E28",
    onError: "#2A070D",
    onContainer: "#FFCCD3",
  },
} as const;

export type ThemeColors = typeof THEME;
