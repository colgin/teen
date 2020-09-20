module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: 3,
        targets: {
          chrome: '58',
          ie: '11',
        },
      },
    ],
    [
      '@babel/preset-react',
      {
        pragma: 'Teen.createElement',
        importSource: 'teen',
        pragmaFrag: 'Teen.Fragment',
        development: false, // 为true 有 __self和__source两个props
      },
    ],
  ],
}
