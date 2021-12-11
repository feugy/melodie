<script>
  import { _ } from 'svelte-intl'
  import TextInput from '../TextInput/TextInput.svelte'
  import Button from '../Button/Button.svelte'

  export let onSearchedSet
  export let focus = false

  function handleKeyup({ target: { value } }) {
    onSearchedSet(value.trim().toLowerCase())
  }
</script>

<TextInput on:keyup={handleKeyup} placeholder={$_('search over')} {focus} />
<Button icon="search" class="ml-2 -mr-2" noBorder />
