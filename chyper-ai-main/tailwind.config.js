/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundColor: {
        'gray-750': '#2D3748', // Custom shade between gray-700 and gray-800
      },
      colors: {
        gray: {
          850: '#1a202e', // Custom dark shade
          750: '#2D3748', // Custom medium shade
        }
      },
      boxShadow: {
        'auth': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [
    // Add custom utility classes if needed
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow': {
          'text-shadow': '0 2px 4px rgba(0,0,0,0.1)'
        },
        '.text-shadow-md': {
          'text-shadow': '0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)'
        }
      };
      addUtilities(newUtilities);
    }
  ],
};
