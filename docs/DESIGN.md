# Academic Intelligence Design System

## 1. Overview
This design system establishes a "Modern Academic" aesthetic, blending the prestige of traditional scholarly journals with the fluidity of contemporary knowledge networks. It targets high-achieving students, researchers, and mentors who value signal over noise.

The visual style is **Corporate / Modern** with an **Editorial** edge. It avoids the frantic, dopamine-driven patterns of traditional social media in favor of a calm, authoritative environment. The interface prioritizes intellectual clarity through generous whitespace, structured information density, and a focus on long-form readability.

## 2. Color System
```yaml
colors:
  surface: '#101416'
  surface-dim: '#101416'
  surface-bright: '#363a3c'
  surface-container-lowest: '#0b0f11'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2d'
  surface-container-highest: '#323538'
  on-surface: '#e0e3e6'
  on-surface-variant: '#c6c5d4'
  inverse-surface: '#e0e3e6'
  inverse-on-surface: '#2d3133'
  outline: '#908f9d'
  outline-variant: '#454652'
  surface-tint: '#bdc2ff'
  primary: '#bdc2ff'
  on-primary: '#1b247f'
  primary-container: '#1a237e'
  on-primary-container: '#8690ee'
  inverse-primary: '#4c56af'
  secondary: '#cdbdff'
  on-secondary: '#370096'
  secondary-container: '#5203d5'
  on-secondary-container: '#c0acff'
  tertiary: '#3ce36a'
  on-tertiary: '#003912'
  tertiary-container: '#003912'
  on-tertiary-container: '#00b048'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  background: '#101416'
  on-background: '#e0e3e6'
  surface-variant: '#323538'
```

## 3. Typography
- **Display Large**: Plus Jakarta Sans, 40px / 48px, Bold, tracking -0.02em
- **Headline Large**: Plus Jakarta Sans, 32px / 40px, Bold, tracking -0.01em
- **Headline Medium**: Plus Jakarta Sans, 24px / 32px, SemiBold
- **Body Large**: Inter, 18px / 30px, Regular
- **Body Medium**: Inter, 16px / 26px, Regular
- **Label Medium**: Inter, 14px / 20px, SemiBold, tracking 0.02em
- **Label Small**: Inter, 12px / 16px, Medium

## 4. Components & Tokens
- **Question Cards**: Headline Medium title, muted Label Small metrics in footer, subtle border with surface-container background.
- **Role Rings on Avatars**:
  - **Indigo Ring (`#1a237e` / `#bdc2ff`)**: Alumni.
  - **Violet Ring (`#5203d5` / `#cdbdff`)**: Mentor / Professional.
  - **Simple Gray (`#454652`)**: Student.
- **Solved State**: Card border transitions to subtle `Tertiary Green (#3ce36a)` with faint 5% green tint background and "Verified Solution" pill badge.
- **Helpful State**: Fills icon with `Accent Violet (#cdbdff)` with subtle glow.
- **Topic Chips**: Pill-shaped with dark-tinted fill and outline.
