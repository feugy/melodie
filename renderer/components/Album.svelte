<script>
  import { createEventDispatcher } from 'svelte'
  import Tags from './Tags.svelte'
  export let src
  let open = false

  const dispatch = createEventDispatcher()

  function handleClick() {
    if (!src.tracks) {
      dispatch('open', src)
    }
    open = !open
  }
</script>

<p>
  <span on:click|stopPropagation={handleClick}>{src.title}</span>
  {#if src.tracks && open}
    <ol>
      {#each src.tracks as track}
        <Tags on:click={() => dispatch('play', track)} src={track.tags} />
      {/each}
    </ol>
  {/if}
</p>
