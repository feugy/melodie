<script>
  import Annotation from './Annotation.svelte'

  export let slot = 0
  let anchors = []

  const texts = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
    'Laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
    'Cillum dolore eu fugiat nulla pariatur.',
    'Mauris pellentesque pulvinar pellentesque habitant morbi tristique.',
    'Volutpat diam ut venenatis tellus in metus vulputate eu scelerisque.',
    'Cras semper auctor neque vitae tempus quam pellentesque nec.',
    'Excepteur sint occaecat cupidatat non proident.',
    'Sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Reprehenderit excepteur sint nostrud aliquip voluptate amet.'
  ]
</script>

<style type="postcss">
  .grid {
    @apply absolute w-full h-full inset-0 grid grid-flow-row grid-cols-4 grid-rows-3 gap-4;
  }

  .grid > div {
    @apply flex flex-col items-center justify-center p-4;
  }
</style>

<Annotation anchor={anchors[slot]} {...$$restProps}>
  Look! This text looks very interesting
</Annotation>
<div class="grid">
  {#each texts as text, i}
    <div bind:this={anchors[i]}>{text}</div>
  {/each}
</div>
<div bind:this={anchors[texts.length]} class="hidden" />
