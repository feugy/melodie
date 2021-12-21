<script>
  import { createEventDispatcher } from 'svelte'
  import { _ } from 'svelte-intl'
  import Button from '../Button/Button.svelte'
  import Dialogue from '../Dialogue/Dialogue.svelte'
  import TextInput from '../TextInput/TextInput.svelte'

  export let open
  export let connecting = false

  const dispatch = createEventDispatcher()
  let otp = ''

  function handleInput({ target }) {
    otp = target.value.replace(/\D/g, '')
    target.value = otp
  }

  function handleConnect() {
    if (!connecting) {
      dispatch('reconnect', otp)
    }
  }
</script>

<style lang="postcss">
  h3 {
    @apply mt-4 mb-2 text-xl;
  }

  form {
    @apply inline-flex items-center gap-2 mb-4;
  }
</style>

<Dialogue title={$_('connection lost')} bind:open on:open on:close noClose>
  <div slot="content">
    {@html $_('you are disconnected')}
    <div class="otp">
      <h3>{$_('one time password')}</h3>
      <form on:submit|preventDefault={handleConnect}>
        <TextInput type="number" on:input={handleInput} on:change focus />
        <Button type="submit" icon="input" primary />
      </form>
    </div>
  </div>
</Dialogue>
