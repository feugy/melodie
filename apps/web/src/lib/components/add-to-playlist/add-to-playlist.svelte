<script lang="ts">
  import { invalidate } from '$app/navigation'
  import { base } from '$app/paths'
  import { requestJSON } from '$lib/client'
  import type { LightPlaylist } from '$lib/types'
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte'
  import CopyPlusIcon from '@lucide/svelte/icons/copy-plus'
  import PlusIcon from '@lucide/svelte/icons/plus'
  import { t } from 'svelte-intl-precompile'
  import type { GETModelResponse } from '../../../routes/api/[kind]/+server'
  import Button from '../button/button.svelte'

  interface AddToPlaylistProps {
    trackIds: number[]
    maxDisplayed?: number
  }

  let { trackIds, maxDisplayed = 10 }: AddToPlaylistProps = $props()

  let open = $state(false)
  let searched = $state('')
  let newPlaylistName = $state('')
  let playlists = $state<LightPlaylist[]>([])
  let playlistsLoaded = $state(false)
  let loadingPlaylists = $state(false)
  let addingToPlaylistId = $state<number | null>(null)

  let filteredPlaylists = $derived(
    !searched
      ? playlists
      : playlists.filter(({ name }) =>
          name.toLowerCase().includes(searched.toLowerCase())
        )
  )

  let visiblePlaylists = $derived(filteredPlaylists.slice(0, maxDisplayed))

  $effect(() => {
    if (open && !playlistsLoaded && !loadingPlaylists) {
      void loadPlaylists()
    }
    if (!open) {
      searched = ''
      newPlaylistName = ''
    }
  })

  async function loadPlaylists() {
    loadingPlaylists = true
    try {
      const { data } = await requestJSON<GETModelResponse<LightPlaylist>>(
        `${base}/api/playlists`
      )
      playlists = data
      playlistsLoaded = true
    } finally {
      loadingPlaylists = false
    }
  }

  async function addToPlaylist(playlistId: number) {
    if (!trackIds.length || addingToPlaylistId !== null) {
      return
    }
    addingToPlaylistId = playlistId
    try {
      await requestJSON(`${base}/api/playlists/add-tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: playlistId, trackIds }),
      })
      playlistsLoaded = false
      playlists = []
      await invalidate(`${base}/api/playlists`)
      open = false
    } finally {
      addingToPlaylistId = null
    }
  }

  async function createPlaylist() {
    const name = newPlaylistName.trim()
    if (!name || !trackIds.length || addingToPlaylistId !== null) {
      return
    }
    addingToPlaylistId = -1
    try {
      await requestJSON(`${base}/api/playlists/add-tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, trackIds }),
      })
      playlistsLoaded = false
      playlists = []
      await invalidate(`${base}/api/playlists`)
      open = false
    } finally {
      addingToPlaylistId = null
    }
  }
</script>

<Popover
  open={open}
  onOpenChange={(details: { open: boolean }) => {
    const nextOpen = details.open
    if (!trackIds.length) {
      open = false
      return
    }
    open = nextOpen
  }}
>
  <!-- Copy all classes of a secondary, md button.svelte with child (gap and icon stlyes) -->
  <Popover.Trigger
    aria-label={$t('add to playlist')}
    class="btn btn-md h-auto font-semibold preset-filled-secondary-500 border-1 border-transparent p-2! rounded-full gap-2"
    disabled={!trackIds.length}
    title={$t('add to playlist')}
    type="button"
  >
    <CopyPlusIcon class="size-[1.25em] text-inherit"/>
  </Popover.Trigger>

	<Portal>
    <Popover.Positioner>
      <Popover.Content class="preset-filled-surface-100-900 overflow-auto rounded p-2">
        <Popover.Arrow class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-900)]">
					<Popover.ArrowTip />
				</Popover.Arrow>
        <div class="flex min-w-56 flex-col gap-2 p-1">
          <input
            class="input preset-filled-surface-700-300 px-2 py-1 text-sm"
            placeholder={$t('search playlists') || 'Search playlists'}
            value={searched}
            oninput={(event) => (searched = (event.target as HTMLInputElement).value)}
            type="text"
          />

          {#if loadingPlaylists}
            <p class="px-2 py-1 text-sm">{$t('loading')}</p>
          {:else if playlists.length === 0}
            <p class="px-2 py-1 text-sm">{$t('no playlist')}</p>
          {:else if filteredPlaylists.length === 0}
            <p class="px-2 py-1 text-sm">{$t('no results')}</p>
          {:else}
            <div class="max-h-64 overflow-auto">
              {#each visiblePlaylists as playlist (playlist.id)}
                <button
                  class="hover:preset-filled-primary-500 block w-full rounded px-2 py-1 text-left text-sm"
                  disabled={addingToPlaylistId !== null}
                  onclick={() => addToPlaylist(playlist.id)}
                  type="button"
                >
                  {playlist.name}
                </button>
              {/each}
            </div>
          {/if}

          <div class="border-primary-500/30 mt-1 border-t pt-2">
            <div class="flex items-center gap-2">
              <input
                class="input preset-filled-surface-700-300 flex-1 px-2 py-1 text-sm"
                placeholder={$t('create playlist')}
                value={newPlaylistName}
                oninput={(event) =>
                  (newPlaylistName = (event.target as HTMLInputElement).value)}
                onkeydown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void createPlaylist()
                  }
                }}
                type="text"
              />
              <Button
                Icon={PlusIcon}
                size="sm"
                disabled={!newPlaylistName.trim() || addingToPlaylistId !== null}
                onclick={() => void createPlaylist()}
                title={$t('create playlist')}
              />
            </div>
          </div>
        </div>
      </Popover.Content>
    </Popover.Positioner>
  </Portal>
</Popover>
