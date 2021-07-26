module.exports = {
  configureWebpack: {
    // Webpack configuration applied to web builds and the electron renderer process
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      // List native deps here if they don't work
      externals: ['@ffmpeg-installer/ffmpeg', 'electron-prompt'],
      chainWebpackMainProcess: config => {
        // Chain webpack config for electron main process only
        // https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/139
        config.plugin('define').tap(args => {
          args[0]['process.env.FLUENTFFMPEG_COV'] = false
          return args
        })
      },
      chainWebpackRendererProcess: config => {
        // Chain webpack config for electron renderer process only (won't be applied to web builds)
      },
    }
  }
}
