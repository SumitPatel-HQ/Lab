/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'dropdown-open': 'dropdownOpen 0.2s ease-out forwards',
        'card-appear': 'cardAppear 0.5s ease-out forwards',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'slide-in': 'slideIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'modal-in': 'modalIn 0.3s ease-out forwards',
        'modal-out': 'modalOut 0.2s ease-in forwards',
        'image-zoom-in': 'imageZoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'image-zoom-out': 'imageZoomOut 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        dropdownOpen: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        cardAppear: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.85)' },
          '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        },
        modalIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        modalOut: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
        imageZoomIn: {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        imageZoomOut: {
          '0%': { opacity: 1, transform: 'scale(1)' },
          '100%': { opacity: 0, transform: 'scale(0.9)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      transitionProperty: {
        'transform-opacity': 'transform, opacity',
      },
      transitionTimingFunction: {
        'bounce-in-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
};