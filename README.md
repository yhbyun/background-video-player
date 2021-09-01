# background-video-player

Electron app to play videos in the background

## Project setup

```sh
$ yarn install
```

## To start a Development Server

```sh
$ yarn electron:serve
```

If `TypeError: Invalid Version: https://github.com/castlabs/electron-releases\#v13.2.1-wvvmp` error happens, the following will solve this.
```sh
$ vi node_modules/vue-cli-plugin-electron-builder/node_modules/semver/classes/semver.js

7 class SemVer {
8   constructor (version, options) {
9     // add the following line
9     return;
```

## To Build Your App

```sh
$ yarn electron:build

$ python3 -m castlabs_evs.account signup
Signing up for castLabs EVS
 - A valid e-mail address is required for account verification
>> E-mail Address []: me@example.com
>> First Name []: Me
>> Last Name []: Example
>> Organization []: Example, Inc
>> Account Name []: example
>> Password []: XXXXXXXX
>> Verify Password []: XXXXXXXX
Confirming EVS account
 - A confirmation code has been sent to your e-mail address
>> Confirmation Code []: XXXXXX
Discarding authorization token(s)
Refreshing authorization token(s)

# Intel MAC
$ python3 -m castlabs_evs.vmp sign-pkg --persistent ./dist_electron/mac

# Apple M1
$ python3 -m castlabs_evs.vmp sign-pkg --persistent ./dist_electron/mac-arm64
```

## todo lists

- [X] Set opacity 1 on mouse hover
- [ ] subtitle supports
- [ ] keyboard shortcuts
- [X] netflix play

## Credit

-  https://github.com/ziyang0116/rockplayer

