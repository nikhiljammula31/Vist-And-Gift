/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F8B8C8', // Rose Milk Pink
          light: '#FDE4EA',
          dark: '#E891A7',
        },
        secondary: {
          lavender: '#F4EFFF', // Soft Lavender
          peach: '#FFF2E6',    // Soft Peach
          skyblue: '#E6F7FF',  // Soft Sky Blue
          mint: '#EBF7F2',     // Mint Green
          cream: '#FEFCF5',    // Cream
          lightgray: '#FAFAFA', // Very Light Gray
          dark: '#1C1C1C',     // Dark Gray (for footer)
        }
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      animation: {
        'blob': 'blob 7s infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
