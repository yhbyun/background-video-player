# background-video-player

Electron app to play videos in the background

## Project setup
```
yarn install
```

## To start a Development Server
```
yarn electron:serve
```

#### warning  in ./node_modules/@ffmpeg-installer/ffmpeg/index.js
Critical dependency: the request of a dependency is an expression
- 무시

#### Cannot find module "[...]@ffmpeg-installer/darwin-x64/package.json"

vue.config.js
```js
module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      // List native deps here if they don't work
      externals: ['@ffmpeg-installer/ffmpeg']
```

#### (node:41023) ExtensionLoadWarning: Warnings loading extension at /Users/yhbyun/Library/Application Support/background-video-player/extensions/ljjemllljcmogpfapbkkighbhhppjdbg:
  Unrecognized manifest key 'browser_action'.
  Unrecognized manifest key 'update_url'.
  Permission 'contextMenus' is unknown or URL pattern is malformed.
  Cannot load extension with file or directory name _metadata. Filenames starting with "_" are reserved for use by the system.
(Use `Electron --trace-warnings ...` to show where the warning was created)
- 무시

## To Build Your App
```
yarn electron:build
```

## todo lists

- [ ] mkv file format
- [ ] Subtitle supports

## References

- https://github.com/ziyang0116/rockplayer
