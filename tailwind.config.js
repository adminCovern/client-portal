module.exports = {
  content: [
    './index.jsx',
    './index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'neonGlow': 'neonGlow 1.5s ease-in-out infinite alternate',
        'glitch': 'glitch 0.8s infinite alternate',
        'flicker': 'flicker 1.5s infinite alternate',
      },
      keyframes: {
        neonGlow: {
          '0%': { boxShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF' },
          '100%': { boxShadow: '0 0 20px #00FFFF, 0 0 30px #00FFFF, 0 0 40px #00FFFF' },
        },
        glitch: {
          '0%': { textShadow: '2px 2px #00FFFF' },
          '100%': { textShadow: '-2px -2px #00FFFF' },
        },
        flicker: {
          '0%': { boxShadow: '0 0 20px #00FFFF' },
          '100%': { boxShadow: '0 0 30px #0000FF, 0 0 40px #00FFFF' },
        },
      },
    },
  },
  plugins: [],
};
