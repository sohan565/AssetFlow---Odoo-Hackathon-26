/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aurora dark navy palette
        navy: {
          950: '#030710',
          900: '#060a14',
          850: '#080d1a',
          800: '#0c1120',
          750: '#0f1628',
          700: '#131a2e',
        },
      },
      backgroundImage: {
        'aurora-gradient': 'radial-gradient(ellipse at top left, rgba(99,102,241,0.08), transparent 50%), radial-gradient(ellipse at bottom right, rgba(168,85,247,0.08), transparent 50%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-indigo': '0 0 20px rgba(99,102,241,0.15)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.15)',
        'glow-rose': '0 0 20px rgba(244,63,94,0.15)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.15)',
      },
    },
  },
  plugins: [],
}
