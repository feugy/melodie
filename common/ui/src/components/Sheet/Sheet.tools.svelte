<script>
  import { Tool } from '@atelier-wb/svelte'
  import Sheet from './Sheet.svelte'
  import Button from '../Button/Button.svelte'

  export let content = 'This is some content'
  let open = false
  import { texts } from '../../tests/lorem'
</script>

<style type="postcss">
  .wrapper {
    @apply absolute inset-0;
  }

  section {
    @apply p-4 text-left;
  }

  aside {
    @apply bg-gray-700 p-4 h-full;
  }
</style>

<Tool
  name="Components/Sheet"
  props={{
    content: '<p>Here is some content for the Sheet</p>'
  }}
  let:props
>
  <div class="wrapper">
    <Sheet {...props} bind:open>
      <section slot="main">
        <Button
          on:click={() => (open = !open)}
          text={open ? 'close' : 'open'}
        />
        {#each texts as text}
          <p class="py-2">{text}</p>
        {/each}
      </section>
      <aside slot="aside">
        {@html content}
      </aside>
    </Sheet>
  </div>
</Tool>
