/** @type {import('svgo').Config} */
module.exports = {
  multipass: true,
  js2svg: { pretty: false },
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          convertPathData: { floatPrecision: 2 },
        },
      },
    },
    { name: 'convertColors', params: { currentColor: true } },
    'removeDimensions',
  ],
};
