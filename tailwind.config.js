import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
        display: ['Cairo', 'sans-serif'],
        body: ['Cairo', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-dark)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
          border: 'var(--primary-border)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          hover: 'var(--secondary-dark)',
          light: 'var(--secondary-light)',
        },
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
          border: 'var(--success-border)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
          border: 'var(--warning-border)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          light: 'var(--danger-light)',
          border: 'var(--danger-border)',
        },
        info: {
          DEFAULT: 'var(--info)',
          light: 'var(--info-light)',
          border: 'var(--info-border)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
          elevated: 'var(--surface-elevated)',
        },
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        'txt-primary': 'var(--text-primary)',
        'txt-secondary': 'var(--text-secondary)',
        'txt-muted': 'var(--text-muted)',
        'txt-disabled': 'var(--text-disabled)',
        'txt-inverse': 'var(--text-inverse)',
        sidebar: {
          bg: '#081028',
          hover: '#0B1739',
          active: 'var(--primary)',
        },
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'kpi': '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'modal': '0 20px 48px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08)',
        'sidebar': '4px 0 16px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.ms-auto': { 'margin-inline-start': 'auto' },
        '.me-auto': { 'margin-inline-end': 'auto' },
        '.ms-0': { 'margin-inline-start': '0' },
        '.me-0': { 'margin-inline-end': '0' },
        '.ps-4': { 'padding-inline-start': '1rem' },
        '.pe-4': { 'padding-inline-end': '1rem' },
        '.ps-6': { 'padding-inline-start': '1.5rem' },
        '.pe-6': { 'padding-inline-end': '1.5rem' },
        '.text-start': { 'text-align': 'start' },
        '.text-end': { 'text-align': 'end' },
        '.border-s': { 'border-inline-start': '1px solid var(--border)' },
        '.border-e': { 'border-inline-end': '1px solid var(--border)' },
        '.start-0': { 'inset-inline-start': '0' },
        '.end-0': { 'inset-inline-end': '0' },
        '.start-4': { 'inset-inline-start': '1rem' },
        '.end-4': { 'inset-inline-end': '1rem' },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          display: 'none',
        },
      })
    })
  ],
}
