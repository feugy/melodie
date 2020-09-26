# Mélodie

[![CI](https://github.com/feugy/melodie/workflows/CI/badge.svg)](https://github.com/feugy/melodie/actions?query=workflow%3ACI)

**_...work in progress..._**

Melodie is a portable, simple-as-pie music player.

There are thunsands of them in the wild. This mine is an excuse for learning [Electron](https://www.electronjs.org), [Svelte](https://svelte.dev) and [reactive programming](https://www.learnrxjs.io).

## TODOs

### features

- [ ] tutorial: skip
- [ ] tutorial: prevent removing all tracks from queue
- [x] about & credits
- [ ] system integration (play folder/file)
- [ ] images from tags
- [ ] artists' albums
- [ ] smaller screen support (UI refactor)
- [ ] enqueue tracks/albums by dragging to tracks queue
- [ ] add to playlist from Album details/Playlist details/Search results pages
- [ ] configure replay gain from settings
- [ ] configurable simple/double click behaviour
- [ ] configurable "play now" behaviour: either clear & add, or enqueue and jump
- [ ] display years (artist & album details page)
- [ ] display album/artist descriptions
- [ ] number of disk on album details page
- [ ] display tracks/albums/artists count in settings
- [ ] allow reseting database from settings

### tools

- [ ] App automated end to end tests
- [ ] Code coverage follow-up
- [ ] more technical documentation (install & release process notably)

### release

- [ ] new name
- [ ] logo/icons
- [x] auto updater
- [ ] packages
  - [-] Linux snap: no OS music controls (need mpris integration)
  - [-] Linux AppImage: no desktop menu icon (need AppImageLauncher)
  - [-] Windows Nsis: not signed, the executable is flaged as insecure
  - [-] Windows Portable: not signed, and does not update automatically
- [ ] release on tag with github actions
- [ ] github page
- [ ] usage statistics
- [ ] references
  - [ ] Electron's [app list](https://www.electronjs.org/apps)
  - [ ] Svelte's [showcase](https://svelte-community.netlify.app/showcase)
  - [ ] [Snap store](https://snapcraft.io/)

### Bugs and known issues

1. empty UI when navigating back and forth between albums and artists list: end up with "duplicated keys in keyed each"
1. when manually asking for artworks/cover, first provider that throw rate error fails the whole function
1. attempt to search artworks/covers for items with no name (null)
1. tracks without album or artists display "null" in system notifications
1. startup performance isn't great
1. When DB has albums and playlists, tutorial enters infinite loop
1. Undetected live changes: remove tracks and re-add them. This is a linux-only issue with chokidar
   - https://github.com/paulmillr/chokidar/issues/917
   - https://github.com/paulmillr/chokidar/issues/591
1. Files renamed or moved to other watched folders are removed and re-added. This is a limitation with chokidar
   - https://github.com/paulmillr/chokidar/issues/303
1. When loading new folders, enqueuing or going to album details will give incomplete results. Going back and forth won't load new data
1. Security: clean html in artist/album names (wrapWithRefs returns injectable markup)
1. AppImage, when used with AppImageLauncher, fail to auto update: https://github.com/electron-userland/electron-builder/issues/4046#issuecomment-670367840
1. If we knew current position in browser history, then we could disabled navigation button accordingly
1. Page navigation: use:link doesn't work in tests and raise Svelte warning. a.href is fine
1. Disklist/TrackTable dropdown does not consider scroll position (in storybook only)
1. Testing input: fireEvent.change, input or keyUp does not trigger svelte's bind:value on input

## Logging

Log level file is `.levels` in the [application `userData` folder](https://www.electronjs.org/docs/api/app#appgetpathname).
Its syntax is:

```shell
# this is a comment
logger-name=level
wildcard*=level
```

logger names are:

- `core`
- `renderer`
- `updater`
- `services/`_<serviceName>_ where _<serviceName>_ is `tracks`, `playlists`, `media`, `settings`
- `providers/`_<providerName>_ where _<providerName>_ is `local`, `audiodb`, `discogs`
- `models/`_<modelName>_ where _<modelName>_ is `tracks`, `albums`, `artists`, `playlists`, `settings`

and levels are (in order): `trace` (most verbose), `debug`, `info`, `warn`, `error`, `fatal`, `silent` (no logs)

Wildcards can be at the beginning `*tracks` or the end `models/*`.
In case a logger name is matching several directives, the first always wins.

You can edit the file, and trigger logger level refresh by sending SIGUSR2 to the application: `kill -USR2 {pid}` (first log issued contains pid)

## Run locally

```shell
git clone git@github.com:feugy/melodie.git
cd melodie
npm i
npm run build
```

## Test

### Core services network mocks (nocks)

Some services are hitting external APIs, such as AudioDB.
As we don't want to flood them with test requests, these are using network mocks.

To use real services, run your tests with `REAL_NETWORK` environment variables (whatever its value).
When using real services, update the mocks by defining `UPDATE_NOCKS` environment variables (whatever its value).
**Nocks will stay unchanged on test failure**.

Some providers need access keys during tests. Just make a `.env` file in the root folder, with the appropriate values:

```
DISCOGS_TOKEN=XYZ
AUDIODB_KEY=1
```

## Notable facts

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

- AC/DC was displayed as 2 different artists ('AC' and 'DC'). This is an issue with ID3 tags: version 2.3 uses `/` as a separators for artists.
  Overitting mp3 tags with 2.4 [solved the issue](https://github.com/Borewit/music-metadata/issues/432)

#### How watch & diff works

- on app load, trigger diff
  1. get followed folders from store
  1. crawl followed folders, return array of paths + hashs + last changed
  1. get array of tracks with hash + last changed from DB
  1. compare to find new & changed hashes
     1. enrich with tags & media
     1. save
  1. compare to isolate deleted hashes
     1. remove corresponding tracks
- while app is running
  1. watch new & changed paths
     1. compute hash, enrich with tags & media
     1. save
  1. watch deleted paths
     1. compute hash
     1. remove corresponding tracks
- when adding new followed folder
  1. save in store
  1. crawl new folder, return array of paths
  1. compute hash, enrich with tags & media
  1. save

### How missing artworks/covers retrieval works

- on UI demand trigger process
  1. push all artists/albums without artwork/cover, and not process since N in a queue
  1. apply rate limit (to avoid flooding disks/providers)
  1. call providers one by one
     1. save first result as artwork/cover, stop
     1. on no results, but at least on provider returned rate limitation, enqueue artist/album
     1. on no results, save date on artist/album
