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
          DEFAULT: '#2563EB', // blue-600
          hover: '#1d4ed8', // blue-700
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F3F4F6', // gray-100
          foreground: '#1F2937', // gray-800
        },
        background: '#F9FAFB', // gray-50
        text: {
          DEFAULT: '#374151', // gray-700
          light: '#6B7280', // gray-500
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
}