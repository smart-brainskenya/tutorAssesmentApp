/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Disable default colors to enforce strict design system usage
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
    },
    extend: {
      animation: {
        'breathe': 'breathe 2.5s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.85' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // SBK Brand Colors - Redesigned
        sbk: {
          // Primary brand colors
          blue: {
            dark: '#1054b8',   // Main CTA, headers
            light: '#6fb8ea',  // Hover states, highlights
          },
          accent: {
            orange: '#ffa500', // Badges, rank highlights
            yellow: '#f2be40', // Elite highlights
          },
          bg: {
            main: '#ffffff',
            alt: '#ebeaea',
          },
          // Legacy mappings to prevent app breaking during refactor
          primary: '#1054b8',    // Map to dark blue
          accent_legacy: '#ffa500', // Map to orange
          depth: '#1054b8',      // Map to dark blue

          // Semantic colors for feedback
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#DC2626',
          info: '#6fb8ea',

          // Slate palette (maintained for backwards compatibility)
          slate: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          }
        },
      },
    },
  },
  plugins: [],
}
