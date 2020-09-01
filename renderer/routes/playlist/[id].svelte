<script>
  import { onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'
  import { distinct, filter } from 'rxjs/operators'
  import { Heading, Image, Button, TracksList } from '../../components'
  import {
    load,
    changes,
    removals,
    removeTrack,
    moveTrack
  } from '../../stores/playlists'
  import { add } from '../../stores/track-queue'

  export let params
  let playlist

  $: playlistId = +params.id
  $: if (!playlist || playlist.id !== playlistId) {
    loadPlaylist()
  }

  async function loadPlaylist() {
    playlist = await load(playlistId)
    if (!playlist) {
      return replace('/playlist')
    }
  }

  const changeSub = changes
    .pipe(
      filter(({ id }) => id === playlistId),
      distinct()
    )
    .subscribe(async changed => {
      if (!changed.tracks) {
        // then load tracks if not yet available
        playlist = await load(playlist.id)
      } else {
        // update now in case of media change
        playlist = changed
      }
    })

  const removalSub = removals
    .pipe(filter(id => id === playlistId))
    .subscribe(() => replace('/playlist'))

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
    @apply flex-shrink-0 w-full h-full;
    height: 300px;
    width: 300px;
  }
</style>

<div in:fade={{ duration: 200 }}>
  {#if playlist}
    <Heading
      title={playlist.name}
      image={'../images/harry-swales-Vfvf3H-5OHc-unsplash.jpg'} />
    <section>
      <span class="image-container">
        <Image class="h-full w-full text-3xl" rounded src={playlist.media} />
      </span>
      <div>
        <span class="actions">
          <Button
            on:click={track => add(playlist.tracks, true)}
            icon="play_arrow"
            text={$_('play all')} />
          <Button
            class="ml-4"
            on:click={track => add(playlist.tracks)}
            icon="playlist_add"
            text={$_('enqueue all')} />
        </span>
      </div>
    </section>
    <div class="tracks">
      {#if playlist && playlist.tracks}
        <TracksList
          tracks={playlist.tracks}
          on:remove={({ detail }) => removeTrack(playlist, detail)}
          on:move={({ detail }) => moveTrack(playlist, detail)} />
      {/if}
    </div>
  {/if}
</div>
