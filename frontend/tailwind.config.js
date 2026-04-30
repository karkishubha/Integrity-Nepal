/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#0f766e',
        'accent-2': '#c2410c',
        sun: '#f5d76e',
        ember: '#f59e0b',
        high: '#ef4444',
        ink: '#13262d',
        muted: '#5d6b73',
      },
    },
  },
  plugins: [],
}
