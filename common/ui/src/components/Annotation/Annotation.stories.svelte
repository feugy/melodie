<script>
  import Annotation from './Annotation.svelte'
  import { texts } from '../../tests/lorem'

  export let slot = 0
  let anchors = []
</script>

<style type="postcss">
  .test-grid {
    @apply absolute w-full h-full inset-0 grid grid-flow-row grid-cols-4 grid-rows-3 gap-4;
  }

  .test-grid > div {
    @apply flex flex-col items-center justify-center p-4;
  }
</style>

<Annotation anchor={anchors[slot]} {...$$restProps}>
  Look! This text looks very interesting
</Annotation>
<div class="test-grid">
  {#each texts.slice(0, 12) as text, i}
    <div bind:this={anchors[i]}>{text}</div>
  {/each}
</div>
<div bind:this={anchors[texts.length]} class="hidden" />
