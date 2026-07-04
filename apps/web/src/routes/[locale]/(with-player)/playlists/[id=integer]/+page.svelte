<script lang="ts">
  import { enhance } from '$app/forms'
  import { trackQueue } from '$lib/client'
  import { Button, ConfirmButton, Dialog, Heading, TrackCount, TracksTable } from '$lib/components'
  import type { ButtonProps } from '$lib/components/button/button.svelte'
  import EnqueueIcon from 'lucide-svelte/icons/list-plus'
  import PencilIcon from 'lucide-svelte/icons/pencil'
  import PlayIcon from 'lucide-svelte/icons/play'
  import TrashIcon from 'lucide-svelte/icons/trash'
  import { t } from 'svelte-intl-precompile'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  // to keep the rest of the code cleaner, while keeping reactivity.
  let playlist = $derived(data.playlist)
  let tracks = $derived(data.tracks)

  let renaming = $state(false)
  let name = $state('')

  $effect(() => {
    if (!renaming) {
      name = data.playlist.name
    }
  })
</script>

<Heading>
  {playlist.name}
</Heading>

<div class="p-4">
  <div class="flex flex-col gap-4">
    <div class="mb-4 flex flex-wrap items-start gap-4">
      <Button
        Icon={PlayIcon}
        onclick={() => trackQueue.add(tracks, { replace: true })}
      >
        {$t('play all')}
      </Button>
      <Button
        Icon={EnqueueIcon}
        onclick={() => trackQueue.add(tracks, { play: false })}
      >
        {$t('enqueue')}
      </Button>
      <Dialog bind:open={renaming} title={$t('rename playlist')}>
        {#snippet trigger(attrs)}
          <Button Icon={PencilIcon} {...attrs as unknown as ButtonProps}>renommer</Button>
        {/snippet}
        {#snippet content()}
          <form
            id="rename-playlist-form"
            method="POST"
            action="?/rename"
            use:enhance={() => {
              return async ({ result, update }) => {
                if (result.type === 'success') {
                  await update({ invalidateAll: true })
                  renaming = false
                  return
                }

                await update()
              }
            }}
          >
            <input class="input w-full" type="text" name="name" bind:value={name} />
          </form>
        {/snippet}
        {#snippet buttons()}
          <Button color="surface" onclick={() => (renaming = false)}>annuler</Button>
          <Button
            type="submit"
            form="rename-playlist-form"
            disabled={!name.trim() || name.trim() === playlist.name}
          >
            renommer
          </Button>
        {/snippet}
      </Dialog>
      <form
        method="POST"
        action="?/delete"
        use:enhance
      >
        <ConfirmButton Icon={TrashIcon} type="submit">supprimer</ConfirmButton>
      </form>
    </div>
    <TrackCount {tracks} />
  </div>
  <TracksTable
    class="mt-8"
    displayIndex
    {tracks}
    onclick={(_, track) => trackQueue.add([track], { play: false })}
  />
</div>
