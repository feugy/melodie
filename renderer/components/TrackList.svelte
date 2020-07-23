<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'
  import { Track } from '.'

  const dispatch = createEventDispatcher()

  export let items
</script>

<style>
  .container {
    flex: 1 1 0;
  }
</style>

{#if Array.isArray(items)}
  <div class="container flex flex-col p-2 m-2">
    <div class="flex">
      <span class="">{$_('_ items', { total: items.length })}</span>
    </div>
    <ol class="container py-2 overflow-y-auto">
      {#each items as track (track.id)}
        <li
          on:click={() => dispatch('select', track)}
          class="hover:bg-gray-transDark cursor-pointer p-2">
          <Track src={track.tags} media={track.media} />
        </li>
      {/each}
    </ol>
  </div>
{/if}
