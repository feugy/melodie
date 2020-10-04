<script>
  import { onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _, locale } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'
  import { filter, distinct, map } from 'rxjs/operators'
  import {
    Heading,
    Image,
    Button,
    Album,
    MediaSelector
  } from '../../components'
  import { load, changes, removals } from '../../stores/artists'
  import { add } from '../../stores/track-queue'
  import { getYears, invoke } from '../../utils'

  export let params
  let albums = []
  let artist
  let openMediaSelector = false

  $: artistId = +params.id
  $: if (!artist || artist.id !== artistId) {
    loadArtist()
  }
  $: bio =
    artist &&
    artist.bio &&
    ($locale in artist.bio ? artist.bio[$locale] : artist.bio.en)

  async function loadArtist() {
    artist = await load(artistId)
    if (!artist) {
      return replace('/artist')
    }
    invoke(`media.triggerArtistEnrichment`, artistId)
    albums = groupByAlbum(artist.tracks)
  }

  const changeSub = changes
    .pipe(
      map(changed => changed.find(({ id }) => id === artistId)),
      filter(n => n),
      distinct()
    )
    .subscribe(async changed => {
      // update now in case of media change
      artist = changed
      if (!artist.tracks) {
        // then load tracks if not yet available
        artist = await load(artist.id)
      }
      albums = groupByAlbum(artist.tracks)
    })

  const removalSub = removals
    .pipe(filter(ids => ids.includes(artistId)))
    .subscribe(() => replace('/artist'))

  function groupByAlbum() {
    const map = new Map()
    for (const track of artist.tracks) {
      const {
        media,
        tags: { year },
        albumRef
      } = track

      const [id, album] = albumRef
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: album,
          media,
          refs: [],
          tracks: []
        })
      }
      map.get(id).tracks.push(track)
    }
    const albums = []
    for (const [, album] of map) {
      album.year = getYears(album.tracks)
      albums.push(album)
    }
    return albums.sort((a, b) => a.year - b.year)
  }

  onDestroy(() => {
    changeSub.unsubscribe()
    removalSub.unsubscribe()
  })
</script>

<style type="postcss">
  section {
    @apply flex flex-row items-start z-0 m-4 mt-0;
    max-height: 300px;
  }

  section > div {
    @apply flex flex-col items-start px-4 self-stretch text-left;
  }

  .bio {
    @apply overflow-y-auto mb-4;
  }

  .actions {
    @apply flex items-end flex-grow;
  }

  .image-container {
    @apply flex-shrink-0 w-full h-full cursor-pointer;
    height: 300px;
    width: 300px;
  }

  .albums {
    @apply flex flex-row items-start flex-wrap justify-around;
  }

  .albums > * {
    @apply m-4;
  }
</style>

<MediaSelector bind:open={openMediaSelector} src={artist} />

<div in:fade={{ duration: 200 }}>
  {#if artist}
    <Heading
      title={artist.name}
      image={'../images/harry-swales-Vfvf3H-5OHc-unsplash.jpg'}
      imagePosition="center 40%" />
    <section>
      <span class="image-container">
        <Image
          on:click={() => (openMediaSelector = true)}
          class="h-full w-full text-3xl actionable"
          rounded
          src={artist.media} />
      </span>
      <div>
        {#if bio}<span class="bio">{bio}</span>{/if}
        <span class="actions">
          <Button
            on:click={() => add(artist.tracks, true)}
            icon="play_arrow"
            text={$_('play all')} />
          <Button
            class="ml-4"
            on:click={() => add(artist.tracks)}
            icon="playlist_add"
            text={$_('enqueue all')} />
        </span>
      </div>
    </section>
    <div class="albums">
      {#each albums as src (src.id)}
        <a href={`#/album/${src.id}`} class="p-4">
          <Album {src}>
            {#if src.year}{src.year}{/if}
          </Album>
        </a>
      {/each}
    </div>
  {/if}
</div>
