<script>
  import { distinct, filter, map } from 'rxjs/operators'
  import { onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _, locale } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'

  import {
    Album,
    Button,
    Heading,
    Image,
    MediaSelector
  } from '../../components'
  import { changes, load, removals } from '../../stores/artists'
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
      const { media, albumRef } = track

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

<MediaSelector bind:open={openMediaSelector} src={artist} />

<div in:fade={{ duration: 200 }}>
  {#if artist}
    <Heading
      title={artist.name}
      image={'../images/harry-swales-Vfvf3H-5OHc-unsplash.jpg'}
      imagePosition="center 40%"
    />
    <section>
      <span class="image-container">
        <Image
          on:click={() => (openMediaSelector = true)}
          class="h-full w-full text-3xl actionable"
          width="400"
          height="400"
          rounded
          src={artist.media}
        />
      </span>
      <div>
        <span class="actions">
          <Button
            on:click={() => add(artist.tracks, true)}
            icon="i-mdi-play"
            text={$_('play all')}
          />
          <Button
            on:click={() => add(artist.tracks)}
            icon="i-mdi-plus-box-multiple"
            text={$_('enqueue all')}
          />
        </span>
        {#if bio}<span class="bio">{bio}</span>{/if}
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

<style>
  section {
    /* prettier-ignore */
    --at-apply: flex flex-wrap items-center z-0 m-4 mt-0 gap-4 md:items-start
      md:flex-nowrap md:max-h-400px;
  }

  section > div {
    --at-apply: flex flex-col items-start px-4 self-stretch text-left;
  }

  .bio {
    --at-apply: overflow-y-auto mb-4;
  }

  .albums {
    --at-apply: flex flex-row items-start flex-wrap justify-around;
  }

  .albums > * {
    --at-apply: m-4;
  }

  .image-container {
    /* prettier-ignore */
    --at-apply: flex-shrink-0 flex-grow cursor-pointer w-300px h-300px
      max-w-300px max-h-300px lg:w-400px lg:h-400px lg:max-w-400px lg:max-h-400px;
  }

  .actions {
    --at-apply: flex flex-wrap mb-4 gap-4 items-start;
  }
</style>
