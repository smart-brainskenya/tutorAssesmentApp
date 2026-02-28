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
      colors: {
        // SBK Brand Colors - Complete palette
        sbk: {
          // Primary brand color
          primary: '#3B9DD9',    // Deep navy blue (main CTA, focus states)

          // Accent colors for highlights
          accent: '#F5A623',     // Warm gold/orange (highlights, badges)

          // Depth color for secondary elements
          depth: '#2C7A9E',      // Darker teal (hover states, secondary buttons)

          // Legacy names (maintained for backwards compatibility)
          blue: '#3B9DD9',
          orange: '#F5A623',
          teal: '#2C7A9E',
          gold: '#FFC107',

          // Semantic colors for feedback
          success: '#10B981',    // Muted green
          warning: '#F59E0B',    // Soft amber
          danger: '#DC2626',     // Controlled red
          info: '#3B82F6',       // Blue for info

          // Semantic Backgrounds
          'success-50': '#ecfdf5',
          'success-100': '#d1fae5',
          'warning-50': '#fffbeb',
          'warning-100': '#fef3c7',
          'danger-50': '#fef2f2',
          'danger-100': '#fee2e2',
          'info-50': '#eff6ff',
          'info-100': '#dbeafe',

          // Neutral palette
          neutral: {
            light: '#F8FAFC',    // Very light background
            border: '#E2E8F0',   // Border color
            text: '#334155',     // Primary text
          },

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
          },

          // Gray palette (for legacy support if needed, mapped to slate)
          gray: {
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
