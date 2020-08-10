<script>
  import { _ } from 'svelte-intl'
  import Image from './Image.svelte'

  let dimension
</script>

<Image class="w-64 h-64 inline-block" on:click {...$$props} bind:dimension />
<div>
  {dimension ? $_('provider (_ x _)', {
        value: 'dimensions',
        ...dimension
      }) : ''}
</div>
