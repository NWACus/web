// Color mappings copied from colors.css since CSS variables don't work in OG images
// Separate file for onboarding checklist
export const centerColorMap = {
  nwac: {
    header: 'hsl(217 62% 21%)',
    headerForeground: 'hsl(193 42% 74%)',
  },
  sac: {
    header: 'hsl(0 2% 21%)',
    headerForeground: 'hsl(204 66% 86%)',
  },
  dvac: {
    header: 'hsl(0 0% 100%)',
    headerForeground: 'hsl(240 10% 3.9%)',
  },
  snfac: {
    header: 'hsl(0 0% 100%)',
    headerForeground: 'hsl(240 10% 3.9%)',
  },
  default: {
    header: 'hsl(0 0% 100%)',
    headerForeground: 'hsl(240 10% 3.9%)',
  },
}

export const isKnownCenter = (c: string): c is keyof typeof centerColorMap => c in centerColorMap
