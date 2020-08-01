<script>
  import { onMount, onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'
  import { of } from 'rxjs'
  import { map, filter, distinct, mergeMap } from 'rxjs/operators'
  import { Heading, Image, Button, TracksTable } from '../../components'
  import { albums, load, changes, removals } from '../../stores/albums'
  import { add, current } from '../../stores/track-queue'

  export let params = {}
  $: albumId = +params.id

  let album

  onMount(async () => {
    album = await load(albumId)
    if (!album) {
      replace('/albums')
    }
  })

  const changeSub = changes
    .pipe(
      filter(({ id }) => id === albumId),
      distinct(),
      mergeMap(album => (!album.tracks ? load(album.id) : of(album)))
    )
    .subscribe(async changed => {
      album = changed
    })

  const removalSub = removals
    .pipe(filter(id => id === albumId))
    .subscribe(() => replace('/albums'))

  onDestroy(() => {
    changeSub.unsubscribe()
    removalSub.unsubscribe()
  })
</script>

<style type="postcss">
  div > div {
    @apply z-0 relative m-6 mt-0;
  }

  section {
    @apply flex flex-row items-end;
    height: 300px;
  }

  section > span {
    font-size: 0;
  }
</style>

<div transition:fade={{ duration: 200 }}>
  {#if album}
    <Heading
      title={album.name}
      image={'../images/dark-rider-JmVaNyemtN8-unsplash.jpg'} />
    <div>
      <section>
        <Image class="w-auto h-full" src={album.media} />
        <span>
          <Button
            class="ml-4"
            on:click={track => add(album.tracks, true)}
            icon="play_arrow"
            text={$_('play all')} />
          <Button
            class="ml-4"
            on:click={track => add(album.tracks)}
            icon="playlist_add"
            text={$_('enqueue all')} />
        </span>
      </section>
      <TracksTable
        tracks={album.tracks}
        {current}
        on:play={({ detail }) => add(detail, true)}
        on:enqueue={({ detail }) => add(detail)} />
    </div>
  {/if}
</div>
