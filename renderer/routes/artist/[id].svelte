<script>
  import { onMount, onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { replace, push } from 'svelte-spa-router'
  import { of } from 'rxjs'
  import { map, filter, distinct, mergeMap } from 'rxjs/operators'
  import { Heading, Image, Button, Album } from '../../components'
  import { artists, load, changes, removals } from '../../stores/artists'
  import { add } from '../../stores/track-queue'
  import { hash } from '../../utils'

  export let params = {}
  let albums = []
  $: artistId = +params.id

  let artist

  onMount(async () => {
    artist = await load(artistId)
    if (!artist) {
      return replace('/artist')
    }
    albums = groupByAlbum(artist.tracks)
  })

  const changeSub = changes
    .pipe(
      filter(({ id }) => id === artistId),
      distinct(),
      mergeMap(artist => (!artist.tracks ? load(artist.id) : of(artist)))
    )
    .subscribe(async changed => {
      artist = changed
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
        tags: { album, year }
      } = track
      if (!map.has(album)) {
        map.set(album, {
          id: hash(album),
          name: album,
          media,
          linked: [],
          year: year || -Infinity,
          tracks: []
        })
      }
      map.get(album).tracks.push(track)
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

  .albums {
    @apply flex flex-row items-start flex-wrap justify-around;
  }

  .albums > * {
    @apply m-4;
  }
</style>

<div transition:fade={{ duration: 200 }}>
  {#if artist}
    <Heading
      title={artist.name}
      image={'../images/harry-swales-Vfvf3H-5OHc-unsplash.jpg'} />
    <section>
      <Image class="flex-shrink-0 w-auto h-full" rounded src={artist.media} />
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
        <span class="p-4">
          <Album
            {src}
            on:play={() => add(src.tracks, true)}
            on:enqueue={() => add(src.tracks)}
            on:select={() => push(`/album/${src.id}`)} />
        </span>
      {/each}
    </div>
  {/if}
</div>
