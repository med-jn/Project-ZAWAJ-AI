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
      // ✅ موحّد مع layout.tsx — Cairo فقط
      fontFamily: {
        sans:  ['var(--font-cairo)', 'Cairo', 'sans-serif'],
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
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
        primary:        'var(--color-primary)',
        secondary:      'var(--color-secondary)',
        accent:         'var(--color-accent)',
        gold:           'var(--color-gold)',
        'gold-hover':   'var(--color-gold-hover)',
        main:           'var(--bg-luxury-gradient)',
        card:           'var(--bg-surface)',
        'gold-text':    '#D4AF37',
        'silver-text':  '#A1A1A1',
        'bronze-text':  '#6e3f23',
        'diamond-text': '#E0E0FF',
      },
      backgroundImage: {
        'bronze-metallic':  'linear-gradient(to right, #4a2c1a 0%, #8c4f2d 25%, #cd7f32 45%, #e6a15a 55%, #a9653a 75%, #5a341f 100%)',
        'silver-metallic':  'linear-gradient(to right, #8f8f8f 0%, #cfcfcf 25%, #f5f5f5 45%, #ffffff 55%, #c9c9c9 75%, #7a7a7a 100%)',
        'gold-metallic':    'linear-gradient(to right, #7a5c00 0%, #c9a227 25%, #ffd700 45%, #fff4b0 55%, #d4af37 75%, #6b5100 100%)',
        'diamond-metallic': 'linear-gradient(to right, #9fd8ff 0%, #dff6ff 25%, #ffffff 45%, #f0fbff 55%, #c8ecff 75%, #86cfff 100%)',
      },
      backdropBlur: {
        xs:   '2px',
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '20px',
        '2xl':'40px',
      },
      boxShadow: {
        'gold-glow':    '0 0 15px rgba(212, 175, 55, 0.5)',
        'diamond-glow': '0 0 20px rgba(178, 235, 242, 0.6)',
        'inner-shine':  'inset 0 1px 2px rgba(255, 255, 255, 0.4)',
      },
      animation: {
        'slow-fade':  'fadeIn 1.5s ease-in-out',
        float:        'floating 3s ease-in-out infinite',
        'slow-shine': 'slow-shine 8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        floating: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'slow-shine': {
          '0%':   { transform: 'translateX(-150%) rotate(25deg)' },
          '25%':  { transform: 'translateX(150%)  rotate(25deg)' },
          '100%': { transform: 'translateX(150%)  rotate(25deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;