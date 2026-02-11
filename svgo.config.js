module.exports = {
  multipass: true, // Optimización múltiple para mejor compresión
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Mantener IDs si se usan en CSS o JS
          cleanupIds: {
            remove: false,
            minify: false,
          },
        },
      },
    },
    // Mantener viewBox para responsividad (fuera del preset)
    {
      name: 'removeViewBox',
      active: false,
    },
  ],
}

