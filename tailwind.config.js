/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'yahtzee-red': '#dc2626',
        'yahtzee-green': '#16a34a',
        'dice-cream': '#fef3c7'
      },
      animation: {
        'dice-roll': 'diceRoll 0.5s ease-out',
        'bounce-in': 'bounceIn 0.3s ease-out'
      },
      keyframes: {
        diceRoll: {
          '0%': { transform: 'rotateX(0deg) rotateY(0deg)' },
          '50%': { transform: 'rotateX(180deg) rotateY(180deg)' },
          '100%': { transform: 'rotateX(360deg) rotateY(360deg)' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
