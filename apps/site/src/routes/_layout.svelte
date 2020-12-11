<script>
  import { locale } from 'svelte-intl'

  export let segment
</script>

{#if $locale}
  <main>
    <slot {segment} />
  </main>
{/if}
