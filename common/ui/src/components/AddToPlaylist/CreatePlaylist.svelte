<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'

  import Button from '../Button/Button.svelte'
  import TextInput from '../TextInput/TextInput.svelte'

  export let onNameSet
  export let focus = false
  let name
  const dispatch = createEventDispatcher()

  async function handleSave() {
    onNameSet(name)
    dispatch('close')
  }

  function handleKeyup({ key, target: { value } }) {
    name = value
    if (key === 'Enter') {
      handleSave()
    }
  }
</script>

<TextInput on:keyup={handleKeyup} placeholder={$_('new playlist')} {focus} />
<Button
  icon="i-mdi-plus-box"
  class="ml-1 -mr-1"
  data-testid="create-playlist"
  noBorder
  on:click={handleSave}
/>
<!-- see https://github.com/sveltejs/vite-plugin-svelte/issues/153#issuecomment-909039112 -->
{#if false}
  <slot />
{/if}
