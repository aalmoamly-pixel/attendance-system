module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: 'hsl(210, 50%, 50%)',
        secondary: 'hsl(260, 40%, 45%)',
        accent: 'hsl(30, 80%, 55%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-rtl')],
};
