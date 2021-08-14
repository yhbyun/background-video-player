# background-video-player

Electron app to play videos in the background

## Project setup

```sh
yarn install
```

## To start a Development Server

```sh
yarn electron:serve
```

## To Build Your App

```sh
yarn electron:build
```
## Netflix play

On the development server, netflix play is not supported. To play a netflix video, you should build app through the follwing command.

```sh
$ git switch widevine
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

## References

-  https://github.com/ziyang0116/rockplayer

