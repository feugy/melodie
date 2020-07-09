# Melodie

...work in progress...

## TODO

### internals

- [x] consider albums & artists as track lists? name + image + tracks
- [ ] load (and save) folders and not files
- [ ] run track analysis in the background
- [ ] watch folder changes
- [ ] reactive stores: send update on new albums/artists/tracks
- [ ] artists pictures
- [ ] research contextBridge

### tools

- [ ] reload on changes occuring in `main/` folder (rollup can only watch changes to the bundle, that is, in `renderer/`)

### features

- [ ] navigation bar: play list, albums, artists, search, settings
- [ ] routing
- [ ] list all albums
- [ ] current play list
- [ ] list all artists
- [ ] search input and results
- [ ] settings panel with watched folders
- [ ] icons
- [ ] system menus
- [ ] system integration (> open with, > open track containing folder, < add to play list, < open with )
  - on windows: `start "" file`
  - on mac: `open file`
  - on linux: `xdg-open file`
- [ ] system notification on next track
- [ ] block power save
- [ ] system tray integration
