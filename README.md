<div align="center"><img src="common/ui/public/icons/icon-512x512.png" width="200px"/>

# Mélodie

[![GitHub All Releases](https://img.shields.io/github/downloads/feugy/melodie/total)][releases]
![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/feugy/melodie?include_prereleases)
[![GitHub](https://img.shields.io/github/license/feugy/melodie)][license]
[![CI](https://github.com/feugy/melodie/workflows/CI/badge.svg)](https://github.com/feugy/melodie/actions?query=workflow%3ACI)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/5ba7a3296e3046fdaba771e809e71b91)](https://www.codacy.com/gh/feugy/melodie/dashboard)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/5ba7a3296e3046fdaba771e809e71b91)](https://www.codacy.com/gh/feugy/melodie/dashboard)

Melodie is a portable, simple-as-pie music player.

![preview](apps/site/static/images/screenshot-ui-en.png)

</div>

There are thunsands of them in the wild. This mine is an excuse for learning [Electron][], [Svelte][] and [reactive programming][rxjs].

## Installation

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/melodie)
<a href='https://www.microsoft.com/store/apps/9N41VK2C5VC2?cid=storebadge&ocid=badge'><img src='https://developer.microsoft.com/en-us/store/badges/images/English_get-it-from-MS.png' alt='English badge' height='56px'/></a>

You will find other installers on the [releases][] page.

Please note that AppImage Snap and NSIS installer will automatically update to the latest available version.

If you run Mélodie from a zip or using DMG/Windows portable version, you will have to download updates by yourself.

### Note for Windows users

**Windows installers are not signed.**

When you will run the .exe files, Windows will warn you that the source is insecure (it is not!).
<img src="https://user-images.githubusercontent.com/186268/97808649-69ac2d00-1c68-11eb-8117-baa700b479fd.png" height="200px" />

It is possible to bypass the warning by clicking on the "More information" link, then on the Install button
<img src="https://user-images.githubusercontent.com/186268/97808651-6b75f080-1c68-11eb-9363-f0a966261660.png" height="200px" />

If you install the app through the [Windows App Store](https://www.microsoft.com/store/apps/9N41VK2C5VC2), you'll get no warning, since the store team reviewed and approved it.

### Note for MacOS users

**DMG image is not signed.**

After you will have downloaded the .dmg file, open it and drag the Mélodie icon to the Application Icon.
Then, MacOS will prevent you from opening Mélodie as I haven't paid for an app deployment certificate.

Once you will have closed the annoying warning, open you `Security` panel in settings, and go to `General` tab.
There, you should see the list of recently blocked application: Mélodie should be there.

You can add it as an exception, and then run it
(see: [How to open an app that hasn’t been notarized or is from an unidentified developer](https://support.apple.com/en-euro/HT202491)).

Another option is to open it with Control-click: it'll immediately register the app as an exception
(see: [Open a Mac app from an unidentified developer](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac)).

## TODOs

### features

- use lightweight thumbnails for images, except when displaying Album/Artist details

- when cover search failed once, do not retry on next start

- use file and folder names to complete missing tags

- merge components/Album|Artist|Playlist tests for GridItem + hover behaviour (desktop only)

- play all button

- indicates when track is in playlist

- configure replay gain from settings

- display tracks/albums/artists count in settings

- allow reseting database from settings

- list images from track tags when collecting candidate covers for an album

- progressive webapp

- Consider yarn2/pnpm, once svelte-preprocess is fixed

- search tooling to find deps version mismatch, and maintain package.json same version

- compare ajv serialization with stringify

- accessibility: ImageUploader file input, Loading input, and Nav search box have no label

- download files and cache them in browser

### tools

- unit tests for log fowarder

- try out [electron-vite](https://evite.netlify.app/) and migrate to [svelte-kit](https://kit.svelte.dev/)

- manual depdency updates, including electron and faker

- dependabot

- changeset

- automated end-to-end tests

- more technical documentation (install & release process notably)

### Bugs and known issues

1. When loading the remote UI, playing current track is delayed by any other loading operation (like listing albums)

1. DMG package does not download updates: [it requires zip](https://github.com/electron-userland/electron-builder/issues/2199), and we cannot build zip because of [the accent in product name](https://github.com/electron-userland/electron-builder/issues/4306#issuecomment-717232761)...

1. Playlist models are not updated on tracks removal

1. Undetected live changes: remove tracks and re-add them. This is a linux-only issue with chokidar

   - [Issue #917](https://github.com/paulmillr/chokidar/issues/917)

   - [Issue #591](https://github.com/paulmillr/chokidar/issues/591)

1. When loading new folders, enqueuing or going to album details will give incomplete results. Going back and forth won't load new data

1. Security: clean html in artist/album names (wrapWithRefs returns injectable markup)

1. AppImage, when used with AppImageLauncher, [fail to auto update](https://github.com/electron-userland/electron-builder/issues/4046#issuecomment-670367840)

1. If we knew current position in browser history, then we could disabled navigation button accordingly

1. Page navigation: use:link doesn't work in tests and raise Svelte warning. a.href is fine

1. Disklist/TrackTable dropdown does not consider scroll position (in storybook only)

1. Testing input: fireEvent.change, input or keyUp does not trigger svelte's bind:value on input

1. The test suite is becoming brittle

   1. `Media service › triggerAlbumsEnrichment › saves first returned cover for album`

      ```shell
      > 839 |       expect(await fs.readFile(savedAlbums[0].media, 'utf8')).toEqual(
            |                                                               ^
      ```

   1. `Media service › triggerAlbumsEnrichment › retries album with no cover but at least one restriced provided`
      Is a 1ms difference in expected `processedEpoch`

   1. `AddToPlaylist component › given some playlists › saves new playlist with all tracks`
      The dropdown menu is still visible (probably because of the animation)

   1. `snackbars store > showSnack > uses the specified duration when enqueuing slacks`

      ```shell
      - Expected  - 3
      + Received  + 0

      > 96 |       expect(snackbarCalls).toEqual([
           |                             ^
      ```

1. The Media test do not pass on Windows: nock is not giving recorded bodies

## Data

Mélodie is using SQLite3 to store settings, playlists and tracks's metadatas.
SQLite3 stores everything in a single file, named `db.sqlite3` and located into the [application `userData` folder][getpathname].

Mélodie also stores artists artwork according to the `ARTWORK_DESTINATION` environment variable, sets to [user's `pictures` folder][getpathname] in `melodie-media` folder.

## Configuring logs

Log are written to a file, which location is set by `LOG_DESTINATION` env variable.
Mélodie Desktop sets `LOG_DESTINATION` to `logs.txt` in the [application `logs` path][getpathname].

Log levels are configured in a file defined by `LOG_LEVEL_FILE` env variable.
Mélodie Desktop sets it to `.levels` in the [application `userData` folder][getpathname].

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

## Running locally

You'll need npm@7+ and node@16+

```shell
git clone git@github.com:feugy/melodie.git
cd melodie
npm i
npm start
```

## Testing

The test suite works fine Linux, MacOS and Windows.

```shell
npm t
```

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

### Promo site

Located under `apps/site`, it publicize Mélodie and has a button to download latest release artifacts.

Caveats:

- it is build for Github pages. That is, the final hosting will have a base path (`/melodie`), which we don't have when trying out locally
- it reuses common/ui stylesheet, which requires workaround due to font paths. Fonts must be copied into `/apps/site/static/fonts` for dev, and the production build creates undesired copies in `/common/ui/src/fonts`
- when developing locally, use `npm -w apps/site run dev` and browse to http://localhost:3000
- when willing to try out production result, use `npm -w apps/site run build`, `npm -w apps/site run serve` and browse to http://localhost:3000/melodie

### Trying snaps out

Working with snaps locally isn't really easy.

1. install the real app from the store:

   ```shell
   snap install melodie
   ```

1. then package your app in debug mode, to access the unpacked snap:

   ```shell
   DEBUG=electron-builder npm run release:artifacts --workspace apps/desktop -- -l
   ```

1. copy missing files to the unpacked snap, and keep your latest changes:

   ```shell
   mkdir dist/__snap-amd64/tmp
   mv dist/__snap-amd64/* dist/__snap-amd64/tmp
   cp -r /snap/melodie/current/* dist/__snap-amd64/
   cp -r dist/linux-unpacked/* dist/__snap-amd64/
   mv dist/__snap-amd64/tmp/* dist/__snap-amd64/*
   ```

1. now use your development code:

   ```shell
   snap try dist/__snap-amd64
   melodie
   ```

1. and revert when you're done:
   ```shell
   snap revert melodie
   ```

### Checking AppImage

To check that generated AppImage works:

1. Install [AppImageLauncher][] if not done yet

1. Download [AppImageLint][]

1. Package application for linux

   ```shell
   npm run release:artifacts --workspace apps/desktop -- -l
   ```

1. Lint your AppImage:

   ```shell
   appimagelint dist/Mélodie.AppImage
   ```

1. Double click on `./dist/Mélodie.AppImage` and integrate it to your system.
   Please check that the app starts, it can access to local files, its name and icon are correct in the launcher

## Releasing

Release process is fairly automated: it will generate changelog, bump version, and build melodie for different platform, creating several artifacts which are either packages (snap, AppImage, Nsis, appx) or plain files (zip).

Theses artifacts will be either published on their respective store (snapcraft, Windows App store...) or uploaded to github as a release.
Once a Github release is published, users who installed an auto-updatable package (snap, AppImage, Nsis, appx) will get the new version auto-magically.

Windows App store release can not be automated: Github CI will build the appx package, but it must be manually submitted to the [Windows App store][].

1. When ready, bump the version on local machine:

   ```shell
   npm run release:bump
   ```

   (if you wish to get a pre-release, append `-- --prerelease beta|alpha` to the command line)

1. **Don't forget to update snapshots**: the presentation site test depend on the version number.

   ```shell
   TAG=$(git describe --tags)
   TAG=${TAG::-11}
   npm t --workspace apps/site -- --clearCache
   npm t --workspace apps/site -- -u
   git commit -a --amend --no-edit
   git tag -f $TAG
   ```

   You shoud see 2 snapshots updated

1. Then push tags to github, as it'll trigger the artifact creation:

   ```shell
   git push --follow-tags
   ```

1. Finally, go to github [releases][], and edit the newest one:

   1. give it a code name

   1. copy the latest section of the [changelog][] in the release body

   1. save it as draft

   1. **Wait until the artifacts are published on your draft**

   1. manually submit the new `appx` package to the [Windows App store][]

   1. remove the `appx` package from artifact list: as it is unsigned, users can not install it from here

   1. publish your release

   1. go and slack off!

### Manual snap release

Until [this issue on Github Actions](https://github.com/electron-userland/electron-builder/issues/6124#issuecomment-927177943) is fixed on Electron-builder, we're stuck with electron-builder@22.10.5 and we need to manually release on snap.

1. Clean up distribution, build snap file and extract it:

   ```shell
   rm -rf apps/desktop/dist/
   npm -w apps/desktop  run release:artifacts -- -l snap
   cd apps/desktop/dist/
   rm -rf linux-unpacked builder-effective-config.yaml
   file-roller -f *.snap .
   ```

   Then select the dist folder as target folder, and close the "Could not open 'dist'" error popup.

1. Amend the `meta/snap.yaml` descriptor. **At root level**, replaces `slots` with:

   ```yaml
   slots:
     mpris:
       interface: mpris
       name: chromium
   ```

   Then within `app.melodie.slots`, **remove** `- name`

   Save the file

1. Re-create snap file and publish it on snapcraft:

   ```shell
   rm -r *.snap
   snapcraft pack . --output 'linux - Mélodie.snap'
   snapcraft login
   snapcraft upload --release=stable 'linux - Mélodie.snap'
   ```

### Publicise

Mélodie is referenced on these stores and hubs:

- Electron's [app list](https://www.electronjs.org/apps/melodie) ([PR](https://github.com/electron/apps/pull/1566))

- Svelte's [showcase](https://svelte-community.netlify.app/showcase) ([PR](https://github.com/sveltejs/community/pull/329))

- [Snap store](https://snapcraft.io/melodie) ([app page](https://snapcraft.io/melodie/listing))

- [AppImage hub](https://appimage.github.io/) ([PR](https://github.com/AppImage/appimage.github.io/pull/2383))

- [Windows App store](https://www.microsoft.com/store/apps/9N41VK2C5VC2) ([app page][windows app store])

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
  To make storyshots working, I had to downgrade Jest because of an annoying bug ([reference](https://github.com/storybookjs/storybook/issues/10351#issuecomment-644667392)).

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

- Snap packaging was hairy to figure out. It is clearly the best option on Linux, as it has great desktop integration (which AppImage lacks) and a renowed app store. However, getting the MediaMetadata to work with snap confinement took two days of try-and-fail research. The full journey is available in this [PR on electron-builnder](https://github.com/electron-userland/electron-builder/pull/5313). Besides, the way snapd is creating different folders for each new version forced me to move artist albums outside of electron's data folders: snapd ensure that files are copied from old to new version, but can not update the media full paths store inside SQLite DB.

- MacOS builder was constantly failing with the same error: 7zip couldn't find any file to compress in the final archive. It turns out it is because the production name as an accent (Mélodie), and the mac flavor of 7zip can not handle it...

- Chokidar has a "limitation" and [triggers for each renamed or moved file an 'unlink' and an 'add' event](https://github.com/paulmillr/chokidar/issues/303). The implication on Mélodie were high: moved/renamed files would disappear from playlists. Ty bypass the issue, Mélodie stores file inodes and buffer chokidar events: when a file is removed, Mélodie will wait 250ms more, and if another file is added with the same inode during that time, will consider it as a rename/move.

- The mono-repo endeavour. My goal was to split code in various reusable packages: a UI and core that would not depend on Electron, and could be used in both Web and Desktop context, and two apps: an Electron-based desktop application and the Github-page site. As developer I would expect the ability to hoist as many modules

  - runing jest with pnpm does not work at all.
  - lerna is a pain when it comes to hoisting deps.
  - svelte-jester and preprocess absolutely don't work with yarn@2
  - yarn@1 works fine but brings very little commands (just a little more than npm@7)
  - npm@7 < 7.24 must install peer deps in legacy mode and does not offer any sugar for multi-package commands. All deps must be manually added to package.json, because install command MUST be run at root level
    Electron-builder does not like monorepo either: author, description and other metadata must be copied from root package.json to apps/desktop/package.json. The Electron version must be fixed because node_modules are hoisted. The package.json name MUST be `melodie` :(
    Caveats: always run `npm i --legacy-peer-deps` AT ROOT level. Running npm or npx command inside packages would re-create `node_modules`
    Ensuring the same version in all packages and dependencies similarities must be done manually

- svelte-spa-router, and its dependency on regexparam, has been bother me for a very long time. When ran with jest, svelte-spa-router files must be transpiled by Svelte compiler, but they import regexparam as esm, and this lib doesn't expose such binding. One must replace the import with require, and this must only be done during test, because rollup will handle it properly.
  When receiving errors from svelte-jester, don't forget to clean jest cache with --cleanCache CLI option.

- since v22.11.1, electron-builder fails to build the app on [Github worker](https://github.com/electron-userland/electron-builder/issues/6124). Fixing the version to 22.10.5 for the time being.

- Tailwind is veeeeeeeeeeeery slow to compile. Svelte preprocessor can not handle it fast, making vite pretty slow when starting atelier (only the first load). More [information here](https://github.com/vitejs/vite/issues/5145). Moving to [Windi CSS](https://windicss.org/) speed the build time from 65 to 28 seconds!

- The `Audio` element failed to play any music when coupled with `AudioContext`:
  1.  Bluetooth must be enabled prior to starting the app (simply reload the app once enabled)
  1.  `AudioContext` will build, but will not process any data.
      Being running or suspended (as per Google's [policy](https://developer.chrome.com/blog/autoplay/#webaudio)) does not matter: rebuilding the context or building it on user interaction does not solve the issue as long as bluetooth is enabled

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

[releases]: https://github.com/feugy/melodie/releases
[changelog]: https://github.com/feugy/melodie/blob/main/CHANGELOG.md
[license]: https://github.com/feugy/melodie/blob/main/LICENSE
[electron]: https://www.electronjs.org
[svelte]: https://svelte.dev
[rxjs]: https://www.learnrxjs.io
[appimagelauncher]: https://github.com/TheAssassin/AppImageLauncher
[appimagelint]: https://github.com/TheAssassin/appimagelint
[windows app store]: https://partner.microsoft.com/en-us/dashboard/products/9N41VK2C5VC2/overview
[getpathname]: https://www.electronjs.org/docs/api/app#appgetpathname
