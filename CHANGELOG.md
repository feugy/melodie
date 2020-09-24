# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
