module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        targets: {
          node: true,
        },
        useBuiltIns: 'usage',
        corejs: {
          version: 3.6,
          proposals: true,
        },
      },
    ],
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],

    [
      '@babel/plugin-transform-modules-commonjs',
      {
        allowTopLevelThis: true,
      },
    ],
  ],
};
