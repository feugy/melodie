<script>
  import { distinct, filter, map } from 'rxjs/operators'
  import { onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'

  import {
    Button,
    DisksList,
    Heading,
    Image,
    MediaSelector
  } from '../../components'
  import { changes, load, removals } from '../../stores/albums'
  import { add, current } from '../../stores/track-queue'
  import {
    formatTime,
    getYears,
    sumDurations,
    wrapWithLinks
  } from '../../utils'

  export let params
  let album
  let openMediaSelector = false

  $: albumId = +params.id
  $: if (!album || album.id !== albumId) {
    loadAlbum()
  }
  $: year = getYears(album && album.tracks)

  async function loadAlbum() {
    album = await load(albumId)
    if (!album) {
      replace('/album')
    }
  }

  const changeSub = changes
    .pipe(
      map(changed => changed.find(({ id }) => id === albumId)),
      filter(n => n),
      distinct()
    )
    .subscribe(async changed => {
      // update now in case of media change
      album = changed
      if (!album.tracks) {
        // then load tracks if not yet available
        album = await load(album.id)
      }
    })

  const removalSub = removals
    .pipe(filter(ids => ids.includes(albumId)))
    .subscribe(() => replace('/album'))

  onDestroy(() => {
    changeSub.unsubscribe()
    removalSub.unsubscribe()
  })
</script>

<MediaSelector forArtist={false} bind:open={openMediaSelector} src={album} />

<div in:fade={{ duration: 200 }}>
  {#if album}
    <Heading
      title={album.name}
      image={'../images/dark-rider-JmVaNyemtN8-unsplash.jpg'}
    />
    <section>
      <span class="image-container">
        <Image
          on:click={() => (openMediaSelector = true)}
          class="h-full w-full text-3xl actionable"
          width="400"
          height="400"
          src={album.media}
        />
      </span>
      <div>
        <span class="actions">
          <Button
            on:click={() => add(album.tracks, true)}
            icon="i-mdi-play"
            text={$_('play all')}
          />
          <Button
            on:click={() => add(album.tracks)}
            icon="i-mdi-plus-box-multiple"
            text={$_('enqueue all')}
          />
        </span>
        <h3>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html $_('by _', {
            artist: wrapWithLinks('artist', album.refs).join(', ')
          })}
        </h3>
        <span>
          {$_('total duration _', {
            total: formatTime(sumDurations(album.tracks))
          })}
        </span>
        {#if year}<span> {$_('year _', { year })} </span>{/if}
      </div>
    </section>
    <div class="disks">
      <DisksList
        tracks={album.tracks}
        {current}
        withAlbum={false}
        on:play={({ detail }) => add(detail, true)}
        on:enqueue={({ detail }) => add(detail)}
      />
    </div>
  {/if}
</div>

<style>
  section {
    /* prettier-ignore */
    --at-apply: flex flex-wrap items-center z-0 m-4 mt-0 gap-4 md:items-start
      md:flex-nowrap;
  }

  .disks {
    --at-apply: m-6;
  }

  .image-container {
    /* prettier-ignore */
    --at-apply: flex-shrink-0 flex-grow cursor-pointer w-300px h-300px
      max-w-300px max-h-300px lg:w-400px lg:h-400px lg:max-w-400px lg:max-h-400px;
  }

  section > div {
    --at-apply: flex flex-col items-start self-stretch text-left;
  }

  h3 {
    --at-apply: mb-2 text-2xl;
  }

  .actions {
    --at-apply: flex flex-wrap mb-4 gap-4 items-start;
  }
</style>
