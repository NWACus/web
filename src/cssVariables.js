// Shared CSS variables used by tailwind.config.mjs and components
// Single source of truth for breakpoints and container widths

export const cssVariables = {
  breakpoints: {
    '3xl': 1920,
    '2xl': 1536,
    xl: 1280,
    lg: 1024,
    md: 768,
    sm: 640,
  },
  // Container max-widths at each breakpoint (in pixels)
  // Used by tailwind container class and for calculating responsive image sizes
  container: {
    sm: 640, // 40rem
    md: 768, // 48rem
    lg: 1024, // 64rem
    xl: 1280, // 80rem
    '2xl': 1376, // 86rem
  },
}
