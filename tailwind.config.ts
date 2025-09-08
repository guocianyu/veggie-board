import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色彩
        brandGreen: '#D1F472',
        brandOrange: '#C13D1A',
        
        // 中性色彩
        ink: '#111827',
        muted: '#6B7280',
        surface: '#FFFFFF',
        
        // 背景色
        bg: '#F7F8FA',
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'sans-serif'],
      },
      borderRadius: {
        'md': '16px',
        'xl': '22px',
        '3xl': '28px',
      },
      container: {
        center: true,
        padding: '24px',
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1320px',
        },
      },
      boxShadow: {
        'card': '0 8px 30px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

export default config