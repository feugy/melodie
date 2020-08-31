<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'
  import TextInput from '../TextInput/TextInput.svelte'
  import Button from '../Button/Button.svelte'

  export let onNameSet
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

<TextInput on:keyup={handleKeyup} placeholder={$_('new playlist')} />
<Button icon="add_box" class="ml-2 -mr-2" noBorder on:click={handleSave} />
