<script>
  import { Tool } from '@atelier-wb/svelte'
  import Sticky from './Sticky.svelte'
  import Button from '../Button/Button.svelte'
  import { texts } from '../../tests/lorem'
</script>

<Tool name="Components/Sticky" let:props>
  <Sticky {...props}>
    <div class="flex flex-row items-center gap-4 p-2">
      <Button large primary text="Hello!" />
      <h3>This header sticks to the screen top</h3>
    </div>
  </Sticky>

  <main class="text-left p-4 mt-16">
    {#each texts as text}
      <p class="py-2">{text}</p>
    {/each}
  </main>
</Tool>
