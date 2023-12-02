<script>
  import { Tool } from '@atelier-wb/svelte'

  import Button from '../Button/Button.svelte'
  import Sheet from './Sheet.svelte'

  export let content = 'This is some content'
  let open = false
  import { texts } from '../../tests/lorem'
</script>

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
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html content}
      </aside>
    </Sheet>
  </div>
</Tool>

<style lang="postcss">
  .wrapper {
    --at-apply: absolute inset-0;
  }

  section {
    --at-apply: p-4 text-left;
  }

  aside {
    --at-apply: bg-gray-700 p-4 h-full;
  }
</style>
