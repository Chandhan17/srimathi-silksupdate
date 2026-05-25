/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Lora"', 'serif'],
      },
      colors: {
        'brand-gold': 'rgb(var(--brand-gold-rgb) / <alpha-value>)',
        'brand-maroon': 'rgb(var(--brand-maroon-rgb) / <alpha-value>)',
        'brand-cream': 'rgb(var(--brand-cream-rgb) / <alpha-value>)',
      },
      boxShadow: {
        soft: '0 12px 40px rgba(90, 15, 28, 0.08)',
        elevated: '0 16px 44px rgba(90, 15, 28, 0.14)',
        royal: '0 20px 52px rgba(90, 15, 28, 0.22)',
      },
      backgroundImage: {
        brocade:
          'radial-gradient(circle at 20% 10%, rgba(201,161,74,0.18) 0, rgba(201,161,74,0) 36%), radial-gradient(circle at 80% 90%, rgba(90,15,28,0.14) 0, rgba(90,15,28,0) 40%)',
      },
    },
  },
  plugins: [],
}

