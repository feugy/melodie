# Migrating from electron to desktop + web

The big idea

- Mélodie UI would have a "broadcast" option in its settings. When enable it would:
  1.  start a web server to serve the public folder, communication endpoint and the track files
  1.  display the url hosting Mélodie UI (and maybe a QR code to ease usage with tablet/mobile)
- Mélodie could support a CLI flag to run in server mode: broadcast and no Electron window.
- When served, Mélodie UI would:
  1.  invoke core functions through WebSocket instead of electron.ipcRenderer.invoke()
  1.  receive notifications through WebSocket instead of electron.ipcRenderer channels
  1.  disable some features: open containing folder, set Artist/Album media (to be tested), change tracked folders

TODO responsiveness:

- settings

TODO improvements/bugs

- merge components/Album|Artist|Playlist tests for GridItem + hover behaviour (desktop only)
- delay local provider sync after last fetch
- Catch startup errors
- bug scroll dropdown (Firefox only)
- swipe on mobile: up/down for player, left/right for track list

Future work

- progressive webapp
- Consider yarn2, once svelte-preprocess is fixed
- search tooling to find deps version mismatch, and maintain package.json same version
- Postcss (jest-css-modules-transform@4.1+ needs postcss8, which requires webpack@5, which storybook does not support yet)
- compare ajv serialization with stringify
- accessibility: ImageUploader file input, Loading input, and Nav search box have no label
- download files and cache them in browser

Browser support

- ok on Chrome (mostly)
- Firefox mobile does not provide next/prev action handler for MediaMetadata, and does not support title/artwork/album...

Logger:

storage path: app.getPath('userData')
log path: app.getPath('logs')
media path: app.getPath('pictures') + melodie-media

desktop sets `LOG_LEVEL_FILE` `.levels` in the [application `userData` folder][getpathname], and `LOG_DESTINATION` is `logs.txt` in the [application log path][todo] app.getPath('logs')
The folder used for artwork (`ARTWORK_DESTINATION` env variable) TODO

[getpathname]: https://www.electronjs.org/docs/api/app#appgetpathname
