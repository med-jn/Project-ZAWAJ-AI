import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',  
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'sans-serif'],
      },
      colors: {
        primary: 'var(--color-primary)',
        secondary: '#1a1a1a', 
        accent: '#d4af37',
        main: 'var(--bg-main)',
        card: 'var(--bg-surface)',
        'gold-text': '#4A3701',
        'silver-text': '#1A1A1A',
        'bronze-text': '#FFD7BA',
        'diamond-text': '#006064',
      },
      backgroundImage: {
        'gold-metallic': 'linear-gradient(to bottom, #BF9B30 0%, #F7EF8A 50%, #BF9B30 100%)',
        'silver-metallic': 'linear-gradient(to bottom, #757575 0%, #E0E0E0 50%, #616161 100%)',
        'bronze-metallic': 'linear-gradient(to bottom, #8C5A3C 0%, #B08060 50%, #5D3A25 100%)',
        'diamond-metallic': 'linear-gradient(to bottom, #B2EBF2 0%, #E0F7FA 50%, #80DEEA 100%)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '20px',
        '2xl': '40px',
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.5)',
        'diamond-glow': '0 0 20px rgba(178, 235, 242, 0.6)',
        'inner-shine': 'inset 0 1px 2px rgba(255, 255, 255, 0.4)',
      },
      animation: {
        'slow-fade': 'fadeIn 1.5s ease-in-out',
        float: 'floating 3s ease-in-out infinite',
        'slow-shine': 'slow-shine 8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        floating: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slow-shine': {
          '0%': { transform: 'translateX(-150%) rotate(25deg)' },
          '25%': { transform: 'translateX(150%) rotate(25deg)' },
          '100%': { transform: 'translateX(150%) rotate(25deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;