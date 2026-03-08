/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        accent: "#22C55E",
        dark: "#0F172A",
        light: "#F3F4F6",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        drama: ['DM Serif Display', 'serif'],
      }
    },
  },
  plugins: [],
}
