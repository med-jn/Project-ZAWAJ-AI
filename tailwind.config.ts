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
      fontSize: {
        'xs':   ['var(--text-xs)',   { lineHeight: '1.5' }],
        'sm':   ['var(--text-sm)',   { lineHeight: '1.5' }],
        'base': ['var(--text-base)', { lineHeight: '1.6' }],
        'md':   ['var(--text-md)',   { lineHeight: '1.6' }],
        'lg':   ['var(--text-lg)',   { lineHeight: '1.6' }],
        'xl':   ['var(--text-xl)',   { lineHeight: '1.4' }],
        '2xl':  ['var(--text-2xl)',  { lineHeight: '1.3' }],
        '3xl':  ['var(--text-3xl)',  { lineHeight: '1.2' }],
      },
      spacing: {
        '1':  'var(--sp-1)',
        '2':  'var(--sp-2)',
        '3':  'var(--sp-3)',
        '4':  'var(--sp-4)',
        '5':  'var(--sp-5)',
        '6':  'var(--sp-6)',
        '8':  'var(--sp-8)',
        '10': 'var(--sp-10)',
      },
      height: {
        nav:    'var(--nav-h)',
        header: 'var(--header-h)',
        btn:    'var(--btn-h)',
      },
      minHeight: {
        nav:    'var(--nav-h)',
        header: 'var(--header-h)',
      },
      width: {
        'avatar-sm': 'var(--avatar-sm)',
        'avatar-md': 'var(--avatar-md)',
        'avatar-lg': 'var(--avatar-lg)',
        'avatar-xl': 'var(--avatar-xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        gold: 'var(--color-gold)',
        'gold-hover': 'var(--color-gold-hover)',
        main: 'var(--bg-luxury-gradient)',
        card: 'var(--bg-surface)',
        'gold-text': '#D4AF37',
        'silver-text': '#757575',
        'bronze-text': '#4E342E',
        'diamond-text': '#E0E0FF',
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