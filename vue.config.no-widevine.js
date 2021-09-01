module.exports = {
    configureWebpack: {
        // Webpack configuration applied to web builds and the electron renderer process
    },
    pluginOptions: {
        electronBuilder: {
            preload: {
                // preload: 'src/preload.js',
                // 'client-header': 'src/client-header.js',
                'webview-inject': 'public/webview-inject.js',
                'ritmo-inject': 'public/ritmo-inject.js',
            },
            nodeIntegration: true,
            // List native deps here if they don't work
            externals: ['@ffmpeg-installer/ffmpeg', 'electron-prompt'],
            mainProcessFile: 'src/main-process/main.js',
            builderOptions: {
                productName: 'Background Video Player',
                extraResources: ['extensions/**/*'],
            },
            chainWebpackMainProcess: (config) => {
                // Chain webpack config for electron main process only
                // https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/139
                config.plugin('define').tap((args) => {
                    args[0]['process.env.FLUENTFFMPEG_COV'] = false;
                    return args;
                });

                config.module
                    .rule('babel')
                    .test(
                        /(main\-process|common|node_modules\/electron\-tween\/electron\-tween).*\.js$/
                    )
                    .use('babel')
                    .loader('babel-loader')
                    .options({
                        presets: [['@babel/preset-env', { modules: false }]],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-transform-runtime',
                        ],
                    });
            },
            chainWebpackRendererProcess: (config) => {
                // Chain webpack config for electron renderer process only (won't be applied to web builds)
            },
        },
    },
};
