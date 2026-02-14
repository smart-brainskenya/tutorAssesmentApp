/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Tailwind default for backwards compatibility
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
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
            700: '#334155',
            900: '#0F172A',
          }
        },
      },
    },
  },
  plugins: [],
}

