module.exports = {
  lintOnSave: false,
  devServer: {
    proxy: {
      '^/walks.json$': {
        target: 'https://routes.ubes.co.uk/walks.json',
        ignorePath: true,
        changeOrigin: true
      },
    }
  }
};
