<script>
  import { createEventDispatcher } from 'svelte'
  import SortableList from './SortableList.svelte'
  import Track from '../Track/Track.svelte'
  import Button from '../Button/Button.svelte'

  let dispatch = createEventDispatcher()
</script>

<style lang="postcss">
  div {
    @apply grid grid-cols-12 gap-0 items-center;
  }
</style>

<SortableList {...$$restProps} on:move>
  <div slot="item" let:item let:i on:click={() => dispatch('click', item)}>
    <Track src={item} details class="col-span-11" />
    <span
      ><Button
        icon="close"
        noBorder
        on:click={() => dispatch('remove', i)}
      /></span
    >
  </div>
</SortableList>
