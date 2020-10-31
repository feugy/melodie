# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.0.0](https://github.com/feugy/melodie/compare/v1.0.0-beta.2...v1.0.0) (2020-10-31)


### Features

* **ui:** sticky header for track queue ([2218285](https://github.com/feugy/melodie/commit/2218285f576af5b8aa56d58e53b6deebb2828c66))


### Bug Fixes

* **ui:** importing playlist during tutorial will skip latest steps ([f38a78b](https://github.com/feugy/melodie/commit/f38a78bc373c71cf72068f5be9ea442d76d5b26b))
* **ui:** removing items in tracks queue automatically scrolls to current track ([7a0d15c](https://github.com/feugy/melodie/commit/7a0d15c9529e98a4d6f09bc2de79cdf26387c71c))
* stylistic issues ([ec42c23](https://github.com/feugy/melodie/commit/ec42c23b5f1d0bc60d090cb2ca4d9dc2a1794c34))

## [1.0.0-beta.2](https://github.com/feugy/melodie/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2020-10-21)


### Features

* **core:** allow to open (and track) files & folders ([5d9dc58](https://github.com/feugy/melodie/commit/5d9dc58f7d9efaf400a65b2a67c9b459481484c5))
* **core:** creates playlists from m3u/m3u8 files ([1866ae1](https://github.com/feugy/melodie/commit/1866ae19ff2a3990997c9145ca5a45e1f5e79450))
* **core:** detect file renamals ([d236b6a](https://github.com/feugy/melodie/commit/d236b6aa39f447ed8c60414b6dc877b13f46872a))
* **core:** enforce single instance ([7ea2966](https://github.com/feugy/melodie/commit/7ea29667ff6062875e8f7d71a71c7e81fe28b966))
* **core:** open files on Mac (it does not use argv) ([424cb88](https://github.com/feugy/melodie/commit/424cb888076392d7e4d91b4bea126bbe374b3079))
* **ui:** export playlists as m3u(8) files ([85785de](https://github.com/feugy/melodie/commit/85785defffc640b71375d862f287bef126d0ad8f))


### Bug Fixes

* **ui:** given some tracks in queue, and queue scrolled down, playing new tracks immediately does not scrolls the queue up ([1ce2494](https://github.com/feugy/melodie/commit/1ce24941a6d88c9b07d2a120e42475a80efd083c))
* **ui:** playlist details page is not updated on track changes ([d049b6b](https://github.com/feugy/melodie/commit/d049b6bd00ebbc9b186e4fd07339a47bb3e8962b))

## [1.0.0-beta.1](https://github.com/feugy/melodie/compare/v1.0.0-beta.0...v1.0.0-beta.1) (2020-10-05)


### Bug Fixes

* **core:** autoUpdater is crashing the app ([b2ed6e9](https://github.com/feugy/melodie/commit/b2ed6e940f665491d06d71c0bb013793c350de67))

## [1.0.0-beta.0](https://github.com/feugy/melodie/compare/v1.0.0-alpha.6...v1.0.0-beta.0) (2020-10-04)


### Features

* **core:** settings for enqueue behaviour ([5b0ab82](https://github.com/feugy/melodie/commit/5b0ab8259eb53ae683df0028b88f8c08ebd80dbe))
* **ui:** add to playlist from Album details/Playlist details/Search results pages ([4bc5065](https://github.com/feugy/melodie/commit/4bc5065ad8c54634f81c2083e50b0e0ef25f8c7e))
* **ui:** auto-scroll track queue to current track ([c9936e8](https://github.com/feugy/melodie/commit/c9936e8ac18963c396ea441c9c7c23df982a1d2e))
* **ui:** configurable simple/double click behaviour (play or enqueue) ([0cb6bc0](https://github.com/feugy/melodie/commit/0cb6bc0210f8f9ebcacc1ab81e3e0b4845c72601))
* **ui:** display album years in artist and album details ([0d94f39](https://github.com/feugy/melodie/commit/0d94f39971032b11715970a52346a064bf3567e2))
* **ui:** display albums' year ([cadcf70](https://github.com/feugy/melodie/commit/cadcf703d35a907b0046d17c585a25d9141307b3))
* **ui:** feedback when adding to playlist ([c32d68a](https://github.com/feugy/melodie/commit/c32d68ae19bec514615d6893e175a778a4c709f1))
* **ui:** fetch and display artist bio ([fc6e524](https://github.com/feugy/melodie/commit/fc6e52401c4f801489a371b15b3a60ebf78772dd))
* **ui:** more efficient sortable list component with drag'n drop events ([f98684d](https://github.com/feugy/melodie/commit/f98684df36a79b6774f3c5627d4f2649c1e61c9a))
* **ui:** new logo ([0c992a0](https://github.com/feugy/melodie/commit/0c992a0e808b7ef1eb3186e6bea7829feeb87c33))


### Bug Fixes

* **ui:** click on Play button without any track still changes icon ([03c21ca](https://github.com/feugy/melodie/commit/03c21ca673b61825b34f3daa09c8a90b9a394b81))

## [1.0.0-alpha.6](https://github.com/feugy/melodie/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2020-09-29)


### Bug Fixes

* **ui:** tutorial, when skipped at first step, resumes on navigation ([7751858](https://github.com/feugy/melodie/commit/7751858c57219bf6c1a67be3bb32797fb01ec06e))

## [1.0.0-alpha.5](https://github.com/feugy/melodie/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-09-27)


### Features

* **ui:**  during tutorial, add an step while waiting for the first album ([5ac2add](https://github.com/feugy/melodie/commit/5ac2addf4c2424f391acac6380414577230d69ac))
* **ui:** prevent removing all tracks from queue during tutorial ([3cc9c20](https://github.com/feugy/melodie/commit/3cc9c2044b01fbb7ba92f59e6681e1ee04d828af))
* **ui:** skip tutorial ([27fa2cb](https://github.com/feugy/melodie/commit/27fa2cbcb04cabe6b2885ad16d5faf62b2d24906))


### Bug Fixes

* **core:** lost artist artwork when updating to a newer version (snap packaging only) ([2e37dd5](https://github.com/feugy/melodie/commit/2e37dd5f5de8d475f6b4c93574fe4976943bcb64))

## [1.0.0-alpha.4](https://github.com/feugy/melodie/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2020-09-26)


### Bug Fixes

* **core:** app crash due to missing package-lock.json ([3437035](https://github.com/feugy/melodie/commit/3437035e8529d0f37b53d4aca64ad161ce6699e6))
* **core:** attempt to search artworks/covers for items with no name (null) ([b7a0ab1](https://github.com/feugy/melodie/commit/b7a0ab1182bc49f231aaa23bfdf48b058500ad56))
* **core:** when manually asking for artworks/cover, first provider that throws rate error fails the whole function ([17ac654](https://github.com/feugy/melodie/commit/17ac654502997d0b9ff25d54baf00c0f8f711c0b))
* **ui:** addToPlaylist component is empty unless playlist list page was opened ([d013f4c](https://github.com/feugy/melodie/commit/d013f4c8f3b2e2ba2b136d8c33783f94192fc3b5))
* **ui:** empty UI with "duplicated keys in keyed each" error ([872479a](https://github.com/feugy/melodie/commit/872479a7bcbb5ce35385538bdfca7e5064462426))
* **ui:** tracks without album or artists display "null" in system notifications ([1376145](https://github.com/feugy/melodie/commit/1376145280113884706a69974ba81e7d4ee05cb6))

## [1.0.0-alpha.3](https://github.com/feugy/melodie/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2020-09-26)


### Bug Fixes

* **core:** auto-update fails on AppImage ([5f94ba1](https://github.com/feugy/melodie/commit/5f94ba1db28d97a37f52dc47fd97e728a40cc508))

## [1.0.0-alpha.2](https://github.com/feugy/melodie/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2020-09-26)


### Features

* **ui:** about and credits ([7449239](https://github.com/feugy/melodie/commit/74492392591ad170864fd0cbe6737eca7d7decec))
* **ui:** focus window when clicking on system notification ([eea8c62](https://github.com/feugy/melodie/commit/eea8c62491af10df8e02878f5a717cac194b6b6c))

## 1.0.0-alpha.1 (2020-09-24)

### Features

- **core:** albums, artists, playlists, tracks and settings models, stored in SQLite3
- **core:** local provider to find, compare and watch tracks from local folders
- **core:** use music-metadata to extract music tags from mp3, ogg, flac...
- **core:** Tracks service to extract albums and artists out of watched tracks
- **core:** Playlist service to create, update and remove playlist of tracks
- **core:** AudioDB provider to find album covers and artist artworks
- **core:** Discogs provider to find album covers and artist artworks
- **core:** Local provider to find album covers and artist artworks
- **core:** Media service to automatically retrieve missing covers and artwork, or manually set them
- **core:** use Knex to handle database migrations
- **core:** log to file with pino
- **ui:** list of all albums
- **ui:** album details page with list of tracks, grouped by disks and ordered by track number
- **ui:** list of all artists
- **ui:** album details page with list of albums
- **ui:** list of all playlists
- **ui:** playlist details page with sortable list of tracks
- **ui:** drawer with tracks queue, toggle button with interctive badge, number of tracks and clear button
- **ui:** ability to enqueue tracks of an album/artist/playlist
- **ui:** ability to clear queue and immediately play tracks of an album/artist/playlist
- **ui:** ability to enqueue single track
- **ui:** ability to clear queue and immediately play single tracks
- **ui:** music player with basic controls (play/pause, next, previous, elapsed time) and current track details
- **ui:** music player volume bar and mute toggle
- **ui:** loop button (no loop, loop on file, loop on queue) and shuffle mode
- **ui:** ability to add current played track to playlist, or entire queue to playlist
- **ui:** navigation bar with searchbox
- **ui:** search results with tracks, albums and artists
- **ui:** for an album, ability to view covers proposals from data providers, and to apply one
- **ui:** for an album, ability to apply any local image as cover
- **ui:** for an artists, ability to view artworks proposals from data providers, and to apply one
- **ui:** for an artists, ability to apply any local image as artwork
- **ui:** system notification on track change, when the app has lost focus
- **ui:** ability, from the operating system, to play, pause, move to previous and move to next track
- **ui:** settings page with the ability to control UI language, Discogs token, AudioDB key, and list of watched folders
- **ui:** modal dialogue to access track's music tags
- **ui:** ability to open containing folder of a given track
- **ui:** welcome tutorial to help discovering key features
- **ui:** reactive interface where any changes from the underlying files are immediately reflected: file creations and removals, music tags updates
- **ui:** fully internationalized interface
