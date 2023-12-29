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
    otp = target.value
    if (/^\d{6}$/.test(otp)) {
      handleConnect()
    }
  }

  function handleConnect() {
    dispatch('reconnect', otp.replace(/\D/g, ''))
    otp = ''
  }
</script>

<Dialogue title={$_('connection lost')} bind:open on:open on:close noClose>
  <div slot="content">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html $_('you are disconnected')}
    <div class="otp">
      <h3>{$_('one time password')}</h3>
      <form on:submit|preventDefault={handleConnect}>
        <TextInput
          type="number"
          value={otp}
          on:input={handleInput}
          on:change
          focus
        />
        <Button
          type="submit"
          icon="i-mdi-location-enter"
          primary
          disabled={connecting}
        />
      </form>
    </div>
  </div>
</Dialogue>

<style>
  h3 {
    --at-apply: mt-4 mb-2 text-xl;
  }

  form {
    --at-apply: inline-flex items-center gap-2 mb-4;
  }
</style>
