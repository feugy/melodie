<script>
  import { _ } from 'svelte-intl'

  import Image from './Image.svelte'

  let dimension
</script>

<Image class="w-64 h-64" on:click {...$$restProps} bind:dimension />
<div>
  {dimension
    ? $_('provider (_ x _)', {
        value: 'dimensions',
        ...dimension
      })
    : ''}
</div>
