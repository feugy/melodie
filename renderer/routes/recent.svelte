<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'
  import { distinct, filter, map } from 'rxjs/operators'
  import { Heading, Button, PlaylistTracksTable } from '../components'
  import { load, changes, removals } from '../stores/playlists'
  import { add } from '../stores/track-queue'
  import {
    invoke,
    formatTimeLong,
    fromServerChannel,
    sumDurations
  } from '../utils'

  let playlist

  $: playlistId = 151120
  $: if (!playlist || playlist.id !== playlistId) {
    loadPlaylist()
  }
  $: total = playlist && playlist.trackIds ? playlist.trackIds.length : 0

  async function loadPlaylist() {
    playlist = await load(playlistId)
    if (!playlist) {
      return replace('/recent')
    }
  }

  onMount(() => {
    const changeSub = changes
      .pipe(
        map(changed => changed.find(({ id }) => id === playlistId)),
        filter(n => n),
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

    const trackSub = fromServerChannel(`track-changes`).subscribe(changed => {
      if (
        playlist &&
        changed.some(({ id }) => playlist.trackIds.includes(id))
      ) {
        loadPlaylist()
      }
    })

    return () => {
      changeSub.unsubscribe()
      trackSub.unsubscribe()
    }
  })
</script>

<style type="postcss">
  section {
    @apply flex flex-row text-left m-4 mt-0;
  }

  .meta {
    @apply flex-grow text-xl text-right;
  }

  .tracks {
    @apply m-4;
  }
</style>

<div in:fade={{ duration: 200 }}>
  {#if playlist}
    <Heading
      title={playlist.name}
      image={'../images/bantersnaps-nE1K_qO2z38-unsplash.jpg'}
      imagePosition="center 60%" />
    <section>
      <Button
        on:click={track => add(playlist.tracks, true)}
        icon="play_arrow"
        text={$_('play all')} />
      <Button
        class="ml-4"
        on:click={track => add(playlist.tracks)}
        icon="playlist_add"
        text={$_('enqueue all')} />
      <Button
        class="ml-4"
        on:click={() => invoke(`playlists.export`, playlist.id)}
        icon="save_alt"
        text={$_('export playlist')} />
      <div class="meta">
        {$_(total === 1 ? 'a track' : '_ tracks', { total })}
        {$_('separator')}
        {formatTimeLong(sumDurations(playlist && playlist.tracks))}
      </div>
    </section>
    <div class="tracks">
      <PlaylistTracksTable {playlist} />
    </div>
  {/if}
</div>
