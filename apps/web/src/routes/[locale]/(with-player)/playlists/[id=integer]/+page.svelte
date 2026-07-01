<script lang="ts">
  import { trackQueue } from '$lib/client'
  import { Button, Heading, TracksTable, TrackCount } from '$lib/components'
  import PencilIcon from 'lucide-svelte/icons/pencil'
  import TrashIcon from 'lucide-svelte/icons/trash'
  import EnqueueIcon from 'lucide-svelte/icons/list-plus'
  import PlayIcon from 'lucide-svelte/icons/play'
  import { t } from 'svelte-intl-precompile'
  import { get } from 'svelte/store'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const { playlist, tracks } = data

  let renameForm: HTMLFormElement | null = null
  let renameInput: HTMLInputElement | null = null

  function handleRename() {
    const name =
      window
        .prompt(get(t)('rename playlist prompt', { values: { name: playlist.name } }), playlist.name)
        ?.trim() ?? ''
    if (!name || name === playlist.name || !renameInput || !renameForm) {
      return
    }
    renameInput.value = name
    renameForm.requestSubmit()
  }

  function handleDelete(event: Event) {
    if (!window.confirm(get(t)('delete playlist confirm', { values: { name: playlist.name } }))) {
      event.preventDefault()
    }
  }
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
      <form bind:this={renameForm} method="POST" action="?/rename">
        <input bind:this={renameInput} name="name" type="hidden" />
        <Button Icon={PencilIcon} onclick={handleRename}>renommer</Button>
      </form>
      <form method="POST" action="?/delete" onsubmit={handleDelete}>
        <Button Icon={TrashIcon} type="submit">supprimer</Button>
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
