<script>
  import { createEventDispatcher } from 'svelte'
  import TextInput from '../TextInput/TextInput.svelte'

  export let onValueSet = () => {}
  export let text
  const dispatch = createEventDispatcher()

  function handleChange(evt) {
    onValueSet(evt.target.value)
    dispatch('close')
  }
</script>

<style lang="postcss">
  span {
    @apply pr-2;
  }
</style>

<span>{text}</span>
<TextInput on:change={handleChange} />
