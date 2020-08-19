<script>
  import { onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'
  import { of } from 'rxjs'
  import { map, filter, distinct, mergeMap, tap } from 'rxjs/operators'
  import {
    Heading,
    Image,
    Button,
    Album,
    MediaSelector
  } from '../../components'
  import { artists, load, changes, removals } from '../../stores/artists'
  import { add } from '../../stores/track-queue'

  export let params
  let albums = []
  let artist
  let openMediaSelector = false

  $: artistId = +params.id
  $: if (!artist || artist.id !== artistId) {
    loadArtist()
  }

  async function loadArtist() {
    artist = await load(artistId)
    if (!artist) {
      return replace('/artist')
    }
    albums = groupByAlbum(artist.tracks)
  }

  const changeSub = changes
    .pipe(
      filter(({ id }) => id === artistId),
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
    .pipe(filter(id => id === artistId))
    .subscribe(() => replace('/artist'))

  function groupByAlbum() {
    const map = new Map()
    for (const track of artist.tracks) {
      const {
        media,
        tags: { year },
        albumRef
      } = track

      if (albumRef) {
        const [id, album] = albumRef
        if (!map.has(id)) {
          map.set(id, {
            id,
            name: album,
            media,
            refs: [],
            year: year || -Infinity,
            tracks: []
          })
        }
        map.get(id).tracks.push(track)
      }
      // TODO tracks without albums
    }
    return Array.from(map.values()).sort((a, b) => a.year - b.year)
  }

  onDestroy(() => {
    changeSub.unsubscribe()
    removalSub.unsubscribe()
  })
</script>

<style type="postcss">
  section {
    @apply flex flex-row items-start z-0 relative m-6 mt-0;
    max-height: 300px;
  }

  section > div {
    @apply flex flex-col items-start px-4 self-stretch text-left;
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

<div transition:fade={{ duration: 200 }}>
  {#if artist}
    <Heading
      title={artist.name}
      image={'../images/harry-swales-Vfvf3H-5OHc-unsplash.jpg'} />
    <section>
      <span class="image-container">
        <Image
          on:click={() => (openMediaSelector = true)}
          class="h-full w-full text-3xl"
          rounded
          src={artist.media} />
      </span>
      <div>
        <span class="actions">
          <Button
            on:click={track => add(artist.tracks, true)}
            icon="play_arrow"
            text={$_('play all')} />
          <Button
            class="ml-4"
            on:click={track => add(artist.tracks)}
            icon="playlist_add"
            text={$_('enqueue all')} />
        </span>
      </div>
    </section>
    <div class="albums">
      {#each albums as src (src.id)}
        <a href={`#/album/${src.id}`} class="p-4">
          <Album {src} />
        </a>
      {/each}
    </div>
  {/if}
</div>
