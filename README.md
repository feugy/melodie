# Mélodie

[![CI](https://github.com/feugy/melodie/workflows/CI/badge.svg)](https://github.com/feugy/melodie/actions?query=workflow%3ACI)

**_...work in progress..._**

Melodie is a portable, simple-as-pie music player.

There are thunsands of them in the wild. This mine is an excuse for learning [Electron](https://www.electronjs.org), [Svelte](https://svelte.dev) and [reactive programming](https://www.learnrxjs.io).

## Run

```shell
git clone git@github.com:feugy/melodie.git
cd melodie
npm i
npm run build
```

## TODOs

### core

- [x] consider albums & artists as track lists? name + image + tracks
- [x] load (and save) folders and not files
- [x] run track analysis in the background
- [x] watch folder changes
- [x] send start/stop events when updating
- [x] embed file-loader's crawl() into chooseFolders()
- [x] reactive stores: send update on new albums/artists/tracks
- [x] images from AudioDB/discogs
- [ ] artists' albums
- [ ] consider knex-migrate
- [ ] images from tags

### tools

- [x] reload on changes occuring in `main/` folder (rollup can only watch changes to the bundle, that is, in `renderer/`)
- [x] logs with level hot reloading
- [ ] logging to file
- [x] Core automated unit tests
- [x] UI automated unit tests
- [ ] App automated end to end tests
- [x] Continuous integration
- [ ] Code coverage follow-up

### features

- [x] navigation bar: albums
- [x] routing
- [x] list all albums
- [x] album details
- [x] enqueue & play album buttons on album details page
- [x] enqueue button on Album component
- [x] current play list
- [ ] remove tracks from queue
- [ ] update track queue on track changes
- [x] tracks' duration
- [x] albums' artists
- [ ] manually set album's cover
- [x] manually set artist's avatar
- [ ] suggest album's cover from 3rd party DBs
- [x] suggest artist's avatar from 3rd party DBs
- [x] list all artists
- [x] artist details
- [x] page navigation (to artists, to albums)
- [ ] display years (artist & album details page)
- [ ] filter albums, artists, or tracks
- [ ] search input and results
- [ ] settings panel with watched folders
- [x] icons
- [ ] system menus
- [ ] system integration (> open with, > open track containing folder, < add to play list, < open with )
  - on windows: `start "" file`
  - on mac: `open file`
  - on linux: `xdg-open file`
- [ ] system notification on next track
- [ ] block power save
- [ ] system tray integration
- [x] animated transitions
- [ ] loading indicators
- [ ] feedback on enqueue & play actions
- [ ] drag'n drop to tracks queue

### bugs

1. Undetected live changes: remove tracks and re-add them. This is a linux-only issue with chokidar
   - https://github.com/paulmillr/chokidar/issues/917
   - https://github.com/paulmillr/chokidar/issues/591
1. When loading new folders, enqueuing or going to album details will give incomplete results. Going back and forth won't load new data
1. In tracks table, the rank column has variable width (BraveHeart), play icon is not vertically centered (2-lines rows)
1. Page navigation: use:link doesn't work in tests and raise Svelte warning. a.href is fine
1. Scroll handling: it'll be better to keep memory on albums/artists page, and reset it on details page
1. Cover change not possible as file paths are the same
1. Testing routes: `import regexparam from 'regexparam'` must be replaced with require or `import * as regexparam`: https://github.com/ItalyPaleAle/svelte-spa-router/issues/81

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
- chokidar is the best of breed watch tool, but has this annoying linux-only big when moving folders outside of the watched paths
  Watchman is a C program that'll be hard to bundle.
  node-watch does not send file event when removing/renaming folders
  watchr API seems overly complex
  watch-pack is using chokidar and the next version isn't ready

- wiring jest, storybook, svelte and tailwind was really painfull. Too many configuration files now :(
  To make storyshots working, I had to downgrade Jest because of an annoying bug [reference](https://github.com/storybookjs/storybook/issues/10351#issuecomment-644667392)

- I considered Sapper for its nice conventional router, but given all the unsued feature (service workers, SSR) I chose a simpler router.
  It is based on hash handling, as electron urls are using file:// protocol which makes it difficult to use with history-based routers.

musings on watch & diff

- [x] on app load, trigger diff
  1.  [x] get followed folders from store
  1.  [x] crawl followed folders, return array of paths + hashs + last changed
  1.  [x] get array of tracks with hash + last changed from DB
  1.  [x] compare to find new & changed hashes
      1. [x] enrich with tags & media
      1. [x] save
  1.  [x] compare to isolate deleted hashes
      1. [x] remove corresponding tracks
- [x] while app is running
  1.  [x] watch new & changed paths
      1. [x] compute hash, enrich with tags & media
      1. [x] save
  1.  [x] watch deleted paths
      1. [x] compute hash
      1. [x] remove corresponding tracks
- [x] when adding new followed folder
  1.  [x] save in store
  1.  [x] crawl new folder, return array of paths
  1.  [x] compute hash, enrich with tags & media
  1.  [x] save

## Logging

Log level file is `.levels` in execution folder.
It can be configured wth `LOG_LEVEL_FILE` env variable
Its syntax is:

```shell
# this is a comment
logger-name=level
wildcard*=level
```

logger names are:

- core
- services/list
- services/file
- services/tag
- models/tracks
- models/albums
- models/artists
- models/settings

levels are:

- trace
- debug
- info
- warn
- error
- fatal
- silent

Wildcards can be at the beginning `*tracks` or the end `models*`.
In case a logger name is matching several directives, the first always wins.

You can edit the file, and trigger logger level refresh by sending SIGUSR2 to the application: `kill -USR2 {pid}` (first log issued contains pid)

## Testing

### Core services network mocks (nocks)

Some services are hitting external APIs, such as AudioDB.
As we don't want to flood them with test requests, these are using network mocks.

To use real services, run your tests with `REAL_NETWORK` environment variables (whatever its value).
When using real services, update the mocks by defining `UPDATE_NOCKS` environment variables (whatever its value).
**Nocks will stay unchanged on test failure**.
