<script lang="ts">
  import { Button, Heading } from '$lib/components'
  import LogInIcon from '@lucide/svelte/icons/log-in'
  import { t } from 'svelte-intl-precompile'

  let { form } = $props()
</script>

<div class="mx-auto max-w-sm">
  <Heading>Salut!</Heading>
  <form
    class="card bg-surface-100-900 border-surface-200-800 mt-6 flex flex-col space-y-4 rounded border p-4"
    method="POST"
  >
    <label class="label">
      <input
        class="input bg-surface-800 focus:bg-transparent"
        name="name"
        type="text"
        placeholder={$t('username')}
        autocomplete="off"
      /></label
    >
    <label class="label">
      <input
        class="input bg-surface-800 focus:bg-transparent"
        name="password"
        type="password"
        placeholder={$t('password')}
      /></label
    >
    {#if form?.error}
      <div class="self-center text-red-600">{form.error}</div>
    {/if}
    <Button class="self-center" type="submit" Icon={LogInIcon}>Entrer</Button>
  </form>
</div>
