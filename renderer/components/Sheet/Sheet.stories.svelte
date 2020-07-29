<script>
  import faker from 'faker'
  import Sheet from './Sheet.svelte'
  import Button from '../Button/Button.svelte'

  export let content = 'This is some content'
  let open = false
  const paragraphs = Array.from({ length: 10 }, () => faker.lorem.paragraph())
</script>

<style type="postcss">
  .wrapper {
    @apply absolute inset-0;
  }

  section {
    @apply overflow-auto p-4 text-left;
  }

  aside {
    @apply bg-gray-700 p-4 h-full;
  }
</style>

<div class="wrapper">
  <Sheet {...$$props} bind:open>
    <section slot="main">
      <Button on:click={() => (open = !open)} text={open ? 'close' : 'open'} />
      {#each paragraphs as paragraph}
        <p class="py-2">{paragraph}</p>
      {/each}
    </section>
    <aside slot="aside">
      {@html content}
    </aside>
  </Sheet>
</div>
