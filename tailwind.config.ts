import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#800020', // القرمزي الملكي
        secondary: '#1a1a1a', // الرمادي الغامق جداً
        accent: '#d4af37', // الذهبي (للتفاصيل)
        background: '#050505', // أسود عميق جداً
      },
      animation: {
        'slow-fade': 'fadeIn 1.5s ease-in-out',
        float: 'floating 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        floating: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
