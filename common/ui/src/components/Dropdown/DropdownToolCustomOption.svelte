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

<span>{text}</span>
<TextInput on:change={handleChange} />

<style>
  span {
    --at-apply: pr-2;
  }
</style>
