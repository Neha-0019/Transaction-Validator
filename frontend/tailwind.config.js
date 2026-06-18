/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1', // Indigo main branding
          600: '#4f46e5',
          700: '#4338ca',
        },
        cyber: {
          bg: '#070a13',
          card: 'rgba(15, 22, 40, 0.4)',
          cardHover: 'rgba(23, 31, 54, 0.55)',
          border: 'rgba(255, 255, 255, 0.05)',
          borderHover: 'rgba(255, 255, 255, 0.12)',
          accent: '#6366f1', // Indigo accent
          emerald: '#10b981', // Emerald success
          gold: '#f59e0b', // Gold warning/action
          rose: '#f43f5e', // Rose error
          glow: 'rgba(99, 102, 241, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.15)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'aurora': 'aurora 15s ease infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        aurora: {
          '0%': { transform: 'translateRotate(0deg) scale(1)' },
          '100%': { transform: 'translateRotate(360deg) scale(1.2)' },
        }
      }
    },
  },
  plugins: [],
}
