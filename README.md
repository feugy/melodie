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

## TODO

### core

- [x] consider albums & artists as track lists? name + image + tracks
- [x] load (and save) folders and not files
- [x] run track analysis in the background
- [x] watch folder changes
- [x] send start/stop events when updating
- [x] embed file-loader's crawl() into chooseFolders()
- [x] reactive stores: send update on new albums/artists/tracks
- [x] images from AudioDB/discogs
- [x] local provider for album covers
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

### release

- [ ] usage statistics
- [ ] auto updater
- [ ] logo
- [ ] github page
- [ ] reference in Electron's [app list](https://www.electronjs.org/apps)
- [ ] reference in Svelte's [showcase](https://svelte-community.netlify.app/showcase)
- [ ] reference in [Snap store](https://snapcraft.io/)

### features

- [x] navigation bar: albums
- [x] icons
- [x] routing
- [x] list all albums
- [x] album details
- [x] enqueue & play album buttons on album details page
- [x] enqueue button on Album component
- [x] current play list
- [x] tracks' duration
- [x] albums' artists
- [x] animated transitions
- [x] manually set album's cover
- [x] manually set artist's avatar
- [x] suggest album's cover from 3rd party DBs
- [x] suggest artist's avatar from 3rd party DBs
- [x] list all artists
- [x] artist details
- [x] page navigation (to artists, to albums)
- [x] remove tracks from queue
- [x] update track queue on track changes
- [x] volume control
- [x] search input and results
- [x] navigation buttons
- [x] system notification on next track
- [x] reorder tracks queue with drag'n drop
- [x] settings panel with watched folders
- [x] memorize window position and state
- [x] language change
- [x] tracks without artists/album
- [x] shuffle, loop
- [x] [open containing folder](https://www.electronjs.org/docs/api/shell#shellshowiteminfolderfullpath) for tracks
- [x] display track's tags and details
- [x] playlists
- [ ] help and tips
      ---> release?
- [ ] configure replay gain from settings
- [ ] settings for simple/double click behaviour
- [ ] display years (artist & album details page)
- [ ] display album/artist descriptions
- [ ] block power save
- [ ] system tray integration
- [ ] loading indicators (one for all operation, fixed so it doesn't push content down)
- [ ] feedback on enqueue & play actions
- [ ] number of disk on album details page
- [ ] enqueue tracks/albums by dragging to tracks queue
- [ ] display tracks/albums/artists count in settings
- [ ] allow reseting database from settings

### Bugs and unresolved issues

1. ParseRaw issue: "Je vais bien, ne t'en fais pas" gives "Je vais bie"
1. Startup isn't quick: load artist/album/playlist on demand
1. Local provider returning too many results, some unusable, for "Rock & Pop for Ballet 2"
1. Undetected live changes: remove tracks and re-add them. This is a linux-only issue with chokidar
   - https://github.com/paulmillr/chokidar/issues/917
   - https://github.com/paulmillr/chokidar/issues/591
1. Files renamed or moved to other watched folders are removed and re-added. This is a limitation with chokidar
   - https://github.com/paulmillr/chokidar/issues/303
1. When loading new folders, enqueuing or going to album details will give incomplete results. Going back and forth won't load new data
1. Page navigation: use:link doesn't work in tests and raise Svelte warning. a.href is fine
1. Scroll handling: it'll be better to keep memory on albums/artists page, and reset it on details page
1. Testing routes: `import regexparam from 'regexparam'` must be replaced with require or `import * as regexparam`: https://github.com/ItalyPaleAle/svelte-spa-router/issues/81
1. If we knew current position in browser history, then we could disabled navigation button accordingly
1. Security: clean html in artist/album names (wrapWithRefs returns injectable markup)
1. Testing input: fireEvent.change, input or keyUp does not trigger svelte's bind:value on input

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

- Initially, albums & artists id where hash of their names. It was very convenient to keep a list of artist's albums just by storing album names in artist's `linked` array. UI would infer ids by applying the same hash.
  However, it is common to see albums with same name from different artists (like "Greatest hits").
  To mitigate this issue, I had to make album's id out of album name and album artist (when defined). This ruined the hash convention, and I had to replace all "links" by proper references (id + name). Now UI does not infer ids anymore.

- For system notifications, document.hidden and visibilityChange are too weak because they only notice when the app is minimized/restored

- System notification was tricky: HTML5 Notification API doesn't support actions, except from service workers.
  Using service workers was overkill, and didn't work in the end.
  Electron's native notificaiton does not support actions either.
  Using node-notifier was a viable possibility, but doesn't support actions in a portable fashion (notify-send on linux doesn't support it).
  Finally back to HTML5 notification API, without actions :(

- The discovery of mediaSession's metadata and handler was completely random. It's only supported by Chrome (hopefully for me!), and can be seen on Deezer, Spotify or Youtube Music. However, it does not display artworks.

- IntersectionObserver does not call the intersection entry when the position inside viewport is changing but the intersection doesn't.
  As a result, dropdown in the sheet will enter viewport during sheet animation, causing troubles positioning the menu

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
