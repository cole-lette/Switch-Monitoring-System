module.exports = {
  plugins: [
    require('@tailwindcss/postcss')({
      config: './tailwind.config.js', // adjust path if needed
    }),
    require('autoprefixer'),
  ],
};
