<script>
  import { texts } from '../../tests/lorem'
  import Annotation from './Annotation.svelte'

  export let slot = 0
  let anchors = []
</script>

<Annotation anchor={anchors[slot]} {...$$restProps}>
  Look! This text looks very interesting
</Annotation>
<div class="test-grid">
  {#each texts.slice(0, 12) as text, i}
    <div bind:this={anchors[i]}>{text}</div>
  {/each}
</div>
<div bind:this={anchors[texts.length]} class="hidden" />

<style>
  .test-grid {
    --at-apply: absolute w-full h-full inset-0 grid grid-flow-row grid-cols-4
      grid-rows-3 gap-4;
  }

  .test-grid > div {
    --at-apply: flex flex-col items-center justify-center p-4;
  }
</style>
