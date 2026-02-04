/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base Network colors
        base: {
          blue: '#0052FF',
          light: '#E8F2FF',
          dark: '#001A3D',
        },
        // Stacks colors
        stacks: {
          purple: '#5546FF',
          orange: '#FC6432',
          light: '#F5F3FF',
          dark: '#1A1A1A',
        },
        // B2S Brand colors
        b2s: {
          primary: '#FF6B35',
          secondary: '#004E89',
          accent: '#00D9FF',
          success: '#06D6A0',
          warning: '#F77F00',
          error: '#EF476F',
        }
      },
      backgroundImage: {
        'gradient-base': 'linear-gradient(135deg, #0052FF 0%, #00D9FF 100%)',
        'gradient-stacks': 'linear-gradient(135deg, #5546FF 0%, #FC6432 100%)',
        'gradient-b2s': 'linear-gradient(135deg, #FF6B35 0%, #004E89 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
