/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: '#000000',
        card: '#0a0a0a',
        elevated: '#121212',
        subtle: '#181818',
        borderDim: '#1f1f1f',
        borderMuted: '#2a2a2a',
      }
    },
  },
  plugins: [],
}

