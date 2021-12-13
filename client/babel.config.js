// These config settings are only used by Jest
module.exports = {
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react',
        // '@babel/preset-typescript',
      ],
    },
  },
};
