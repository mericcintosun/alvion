/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        alvion: '1rem',
        'alvion-lg': '1.5rem',
        'alvion-xl': '2rem',
      },
      colors: {
        alvion: {
          primary: {
            100: '#2D2DF1',
            90: '#4444ED',
            80: '#5858F0',
            70: '#6C6CF1',
            60: '#8080F3',
            50: '#9595F5',
            40: '#A9A9F6',
            30: '#BFBFF9',
            20: '#D4D4FA',
            10: '#E9E9FD',
            // Dark mode için açık tonlar
            'dark-100': '#3A3AF5',
            'dark-90': '#4F4FF0',
            'dark-80': '#6363F2',
          },
          neutral: {
            // Light mode colors
            'light-100': '#FFFFFF',
            'light-90': '#F8F9FA',
            'light-80': '#F1F3F4',
            'light-70': '#E8EAED',
            'light-60': '#DADCE0',
            'light-50': '#BDC1C6',
            'light-40': '#9AA0A6',
            'light-30': '#80868B',
            'light-20': '#5F6368',
            'light-10': '#3C4043',
            // Dark mode colors
            'dark-100': '#001324',
            'dark-90': '#192A39',
            'dark-80': '#334250',
            'dark-70': '#4C5965',
            'dark-60': '#66717C',
            'dark-50': '#7F8991',
            'dark-40': '#99A1A7',
            'dark-30': '#B2B8BD',
            'dark-20': '#CCD0D3',
            'dark-10': '#E5E7E9',
          },
        },
      },
      fontFamily: {
        alvion: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  daisyui: {
    themes: ['lofi'],
    logs: false,
  },
  plugins: [require('daisyui')],
}
