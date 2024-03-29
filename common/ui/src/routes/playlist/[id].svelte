<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'
  import { distinct, filter, map } from 'rxjs/operators'
  import {
    Heading,
    Button,
    PlaylistTracksTable,
    ConfirmationDialogue,
    TextInput
  } from '../../components'
  import { load, changes, removals, remove, save } from '../../stores/playlists'
  import { add } from '../../stores/track-queue'
  import {
    invoke,
    formatTimeLong,
    fromServerEvent,
    sumDurations
  } from '../../utils'

  export let params
  let playlist
  let openDialogue = false
  let isDeleting = false
  let newName

  $: playlistId = +params.id
  $: if (!playlist || playlist.id !== playlistId) {
    loadPlaylist()
  }
  $: total = playlist && playlist.trackIds ? playlist.trackIds.length : 0

  async function loadPlaylist() {
    playlist = await load(playlistId)
    if (!playlist) {
      return replace('/playlist')
    }
  }

  function handleConfirmation({ detail: confirmed }) {
    if (!confirmed) {
      return
    }
    if (isDeleting) {
      remove(playlist)
    } else if (newName !== playlist.name) {
      save({ ...playlist, name: newName })
    }
    isDeleting = false
  }

  function handleInput({ target: { value } }) {
    if (value.trim().length > 0) {
      newName = value
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

    const removalSub = removals
      .pipe(filter(ids => ids.includes(playlistId)))
      .subscribe(() => replace('/playlist'))

    const trackSub = fromServerEvent(`track-changes`).subscribe(changed => {
      if (
        playlist &&
        changed.some(({ id }) => playlist.trackIds.includes(id))
      ) {
        loadPlaylist()
      }
    })

    return () => {
      changeSub.unsubscribe()
      removalSub.unsubscribe()
      trackSub.unsubscribe()
    }
  })
</script>

<style lang="postcss">
  section {
    @apply flex flex-wrap items-center text-left m-4 mt-0 gap-4;
  }

  .meta {
    @apply text-xl;
  }

  .divider {
    @apply flex-grow;
  }

  .tracks {
    @apply m-4;
  }
</style>

{#if playlist}
  <ConfirmationDialogue
    bind:open={openDialogue}
    title={$_(isDeleting ? 'playlist deletion' : 'playlist renamal')}
    confirmText={isDeleting ? 'yes' : 'save'}
    cancelText={isDeleting ? 'no' : 'cancel'}
    on:close={handleConfirmation}
  >
    {#if isDeleting}
      <p>{$_('confirm playlist _ delection', playlist)}</p>
    {:else}
      <TextInput on:input={handleInput} value={newName} />
    {/if}
  </ConfirmationDialogue>
{/if}

<div in:fade={{ duration: 200 }}>
  {#if playlist}
    <Heading
      title={playlist.name}
      image={'../images/bantersnaps-nE1K_qO2z38-unsplash.jpg'}
      imagePosition="center 60%"
    />
    <section>
      <Button
        on:click={() => add(playlist.tracks, true)}
        icon="play_arrow"
        text={$_('play all')}
      />
      <Button
        on:click={() => add(playlist.tracks)}
        icon="playlist_add"
        text={$_('enqueue all')}
      />
      <Button
        on:click={() => {
          newName = playlist.name
          openDialogue = true
        }}
        icon="edit"
        text={$_('rename playlist')}
      />
      <Button
        on:click={() => invoke(`playlists.export`, playlist.id)}
        icon="save_alt"
        text={$_('export playlist')}
      />
      <Button
        on:click={() => {
          isDeleting = true
          openDialogue = true
        }}
        icon="delete"
        text={$_('delete playlist')}
      />
      <div class="divider" />
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
