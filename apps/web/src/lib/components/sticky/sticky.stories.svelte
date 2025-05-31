<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Button from '../button/button.svelte'
  import Component from './sticky.svelte'
  import { texts } from '../../tests/lorem'

  const { Story } = defineMeta({
    title: 'Components/Sticky',
  })
</script>

<Story name="Default">
  <Component>
    <div class="flex flex-row items-center gap-4 p-2">
      <Button size="lg" color="primary">Hello!</Button>
      <h3>This header sticks to the screen top</h3>
    </div>
  </Component>

  <main class="mt-16 p-4 text-left">
    {#each texts as text}
      <p class="py-2">{text}</p>
    {/each}
  </main>
</Story>
