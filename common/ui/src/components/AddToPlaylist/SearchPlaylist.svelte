<script>
  import { _ } from 'svelte-intl'

  import Button from '../Button/Button.svelte'
  import TextInput from '../TextInput/TextInput.svelte'

  export let onSearchedSet
  export let focus = false

  function handleKeyup({ target: { value } }) {
    onSearchedSet(value.trim().toLowerCase())
  }
</script>

<TextInput on:keyup={handleKeyup} placeholder={$_('search over')} {focus} />
<Button
  icon="i-mdi-magnify"
  class="ml-2 -mr-2"
  data-testid="search-playlist"
  noBorder
/>
<!-- see https://github.com/sveltejs/vite-plugin-svelte/issues/153#issuecomment-909039112 -->
{#if false}
  <slot />
{/if}
