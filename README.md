# Melodie

...work in progress...

## TODO

### internals

- [x] consider albums & artists as track lists? name + image + tracks
- [x] load (and save) folders and not files
- [x] run track analysis in the background
- [ ] watch folder changes
- [x] reactive stores: send update on new albums/artists/tracks
- [ ] artists pictures
- [ ] research contextBridge
- [ ] consider knex-migrate

### tools

- [ ] reload on changes occuring in `main/` folder (rollup can only watch changes to the bundle, that is, in `renderer/`)

### features

- [ ] navigation bar: play list, albums, artists, search, settings
- [ ] routing
- [x] list all albums
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
- [ ] images from tags
- [ ] animated transitions
- [ ] loading indicators
- [ ] feedback when adding to play list

### bugs

- Can not add the same track twice to play list (duplicated ids in each)

## History

- Started with a search engine (FlexSearch) to store tracks, and serialized JS lists for albums & artists.
  Altough very performant (50s to index the whole music library), the memory footprint is heavy (700Mo) since
  FlexSearch is loading entire indices in memory
- Moved to sqlite3 denormalized tables (drawback: no streaming supported)
