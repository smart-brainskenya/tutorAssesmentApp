/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        sbk: {
          // Smart Brains Kenya Brand Colors
          blue: '#3B9DD9',      // Primary brand blue
          orange: '#F5A623',    // Secondary accent orange
          teal: '#2C7A9E',      // Darker teal for depth
          gold: '#FFC107',      // Gold accent
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

