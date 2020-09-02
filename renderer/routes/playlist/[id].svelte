<script>
  import { onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'
  import { distinct, filter } from 'rxjs/operators'
  import { Heading, Button, PlaylistTracksTable } from '../../components'
  import { load, changes, removals } from '../../stores/playlists'
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
    @apply flex flex-row items-start z-0 m-6 mt-0;
    max-height: 300px;
  }

  .tracks {
    @apply m-4;
  }
</style>

<div in:fade={{ duration: 200 }}>
  {#if playlist}
    <Heading
      title={playlist.name}
      image={'../images/harry-swales-Vfvf3H-5OHc-unsplash.jpg'} />
    <section>
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
    </section>
    <div class="tracks">
      <PlaylistTracksTable {playlist} />
    </div>
  {/if}
</div>
