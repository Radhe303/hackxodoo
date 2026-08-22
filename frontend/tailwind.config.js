/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        samsung: {
          black: '#000000',
          dark: '#0f0f11',
          surface: '#18181b',
          border: '#27272a',
          muted: '#71717a',
          gray: '#f4f4f6',
          light: '#fafafa',
          white: '#ffffff',
          accent: '#111111',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'samsung': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'samsung-lg': '0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.04)',
        'samsung-dark': '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
};
