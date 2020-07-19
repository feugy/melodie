# Melodie

...work in progress...

## TODO

musings on watch & diff

- [ ] on app load, trigger diff
  1.  [ ] get followed folders from store
  1.  [x] crawl followed folders, return array of paths + hashs + last changed
  1.  [x] get array of tracks with hash + last changed from DB
  1.  [ ] compare to find new & changed hashes
      1. [x] enrich with tags & media
      1. [x] save
  1.  [ ] compare to isolate deleted hashes
      1. [x] remove corresponding tracks
- [ ] while app is running
  1.  [ ] watch new & changed paths
      1. [x] compute hash, enrich with tags & media
      1. [x] save
  1.  [ ] watch deleted paths
      1. [x] compute hash
      1. [x] remove corresponding tracks
- [x] when adding new followed folder
  1.  [x] save in store
  1.  [x] crawl new folder, return array of paths
  1.  [x] compute hash, enrich with tags & media
  1.  [x] save

### internals

- [x] consider albums & artists as track lists? name + image + tracks
- [x] load (and save) folders and not files
- [x] run track analysis in the background
- [ ] watch folder changes
- [x] reactive stores: send update on new albums/artists/tracks
- [ ] artists pictures
- [ ] consider knex-migrate
- [ ] images from tags

### tools

- [x] reload on changes occuring in `main/` folder (rollup can only watch changes to the bundle, that is, in `renderer/`)

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
- [ ] animated transitions
- [-] loading indicators
- [ ] feedback when adding to play list

### bugs

- Can not add the same track twice to play list (duplicated ids in each)

## History

- Started with a search engine (FlexSearch) to store tracks, and serialized JS lists for albums & artists.
  Altough very performant (50s to index the whole music library), the memory footprint is heavy (700Mo) since
  FlexSearch is loading entire indices in memory
- Moved to sqlite3 denormalized tables (drawback: no streaming supported)
- Dropped the idea to query tracks of a given albums/artists/genre/playlist by using SQL queries.
  Sqlite has a very poor json support, compared to Postgres. There is only one way to query json field: `json_extract`.
  It is possible to create indexes on expressions, and this makes retrieving tracks of a given album very efficient:
  ```
  create index track_album on tracks (trim(lower(json_extract(tags, '$.album'))))
  select id, tags from tracks where trim(lower(json_extract(tags, '$.album'))) = lower('Le grand bleu')
  ```
  However, it doesn't work on artists or genres, because they are modeled with arrays, and operator used do not leverage any index:
  ```
  select id, tags from tracks where instr(lower(json_extract(tags, '$.artists')), 'eric serra')
  select id, tags from tracks where json_extract(tags, '$.artists') like '%eric serra%'
  ```
