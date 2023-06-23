const path = require('path');
const cracoBabelLoader = require('craco-babel-loader');

module.exports = {
  plugins: [
    {
      plugin: cracoBabelLoader,
      options: {
        includes: [path.resolve(__dirname, '../shared')],
      },
    },
  ],
};
