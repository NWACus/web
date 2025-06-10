/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
  prefix: '',
  safelist: [
    'bg-[#FFFFFF]',
    'bg-[#CBD5E1]',
    'bg-[#475569]',
    'bg-[#334155]',
    'border-border',
    'bg-card',
    'border-error',
    'bg-error/30',
    'border-success',
    'bg-success/30',
    'border-warning',
    'bg-warning/30',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        '2xl': '2rem',
        DEFAULT: '1rem',
        lg: '2rem',
        md: '2rem',
        sm: '1rem',
        xl: '2rem',
      },
      screens: {
        '2xl': '86rem',
        lg: '64rem',
        md: '48rem',
        sm: '40rem',
        xl: '80rem',
      },
    },
    extend: {
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        header: {
          DEFAULT: 'hsl(var(--header))',
          foreground: 'hsl(var(--header-foreground))',
          'foreground-highlight': 'hsl(var(--header-foreground-highlight))',
        },
        footer: {
          DEFAULT: 'hsl(var(--footer))',
          foreground: 'hsl(var(--footer-foreground))',
          'foreground-highlight': 'hsl(var(--footer-foreground-highlight))',
        },
        callout: {
          DEFAULT: 'hsl(var(--callout))',
          foreground: 'hsl(var(--callout-foreground))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand-500))',
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          200: 'hsl(var(--brand-200))',
          300: 'hsl(var(--brand-300))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          800: 'hsl(var(--brand-800))',
          900: 'hsl(var(--brand-900))',
          950: 'hsl(var(--brand-950))',
          foreground: {
            DEFAULT: 'hsl(var(--brand-foreground-500))',
            50: 'hsl(var(--brand-foreground-50))',
            100: 'hsl(var(--brand-foreground-100))',
            200: 'hsl(var(--brand-foreground-200))',
            300: 'hsl(var(--brand-foreground-300))',
            400: 'hsl(var(--brand-foreground-400))',
            500: 'hsl(var(--brand-foreground-500))',
            600: 'hsl(var(--brand-foreground-600))',
            700: 'hsl(var(--brand-foreground-700))',
            800: 'hsl(var(--brand-foreground-800))',
            900: 'hsl(var(--brand-foreground-900))',
            950: 'hsl(var(--brand-foreground-950))',
          },
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--error))',
      },
      fontFamily: {
        sans: ['var(--font-lato)'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      typography: ({ _theme }) => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--text)',
              '--tw-prose-headings': 'var(--text)',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
              },
              p: {
                marginTop: '1em',
                marginBottom: '1em',
                lineHeight: 1.2,
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: '2.5rem',
              },
              h2: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: '3.5rem',
              },
              h2: {
                fontSize: '1.5rem',
              },
            },
          ],
        },
      }),
    },
  },
}

export default config
