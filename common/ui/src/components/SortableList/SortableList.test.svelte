<script>
  import { createEventDispatcher } from 'svelte'

  import Button from '../Button/Button.svelte'
  import Track from '../Track/Track.svelte'
  import SortableList from './SortableList.svelte'

  let dispatch = createEventDispatcher()
</script>

<SortableList {...$$restProps} on:move>
  <div slot="item" let:item let:i on:click={() => dispatch('click', item)}>
    <Track src={item} details class="col-span-11" />
    <span
      ><Button
        icon="i-mdi-close"
        noBorder
        on:click={() => dispatch('remove', i)}
      /></span
    >
  </div>
</SortableList>

<style>
  div {
    --at-apply: grid grid-cols-12 gap-0 items-center;
  }
</style>
