<script>
  import { tick } from 'svelte'
  import { fade } from 'svelte/transition'
  import { push } from 'svelte-spa-router'
  import { _, locales, locale } from 'svelte-intl'
  import { Heading, Button, SubHeading, Dropdown } from '../components'
  import { invoke } from '../utils'

  export const params = {}
  let currentLocale = $locale ? { value: $locale, label: $_($locale) } : null

  $: localeOptions = $locales.map(value => ({ value, label: $_(value) }))
  $: if (currentLocale && currentLocale.value !== $locale) {
    locale.set(currentLocale.value)
    invoke('settingsManager.setLocale', currentLocale.value)
  }

  let settingsPromise
  getSettings()

  function getSettings() {
    settingsPromise = invoke('settingsManager.get')
  }

  async function handleAdd() {
    await invoke('settingsManager.addFolders')
    push('/albums')
  }

  async function handleRemove(folder) {
    await invoke('settingsManager.removeFolder', folder)
    getSettings()
  }
</script>

<style type="postcss">
  article {
    @apply text-left mx-8 mb-8;
  }

  li {
    @apply p-2 rounded-full mb-4 mr-4 inline-flex;
    background-color: var(--bg-primary-color);
  }

  li > span {
    @apply px-4;
  }

  .controlContainer {
    @apply inline-block;
  }
</style>

<section in:fade={{ duration: 200 }}>
  <Heading
    title={$_('settings')}
    image={'../images/rima-kruciene-gpKe3hmIawg-unsplash.jpg'}
    imagePosition="center 65%" />
  <article>
    <SubHeading>{$_('watched folders')}</SubHeading>
    {#await settingsPromise then { folders }}
      <ul>
        {#each folders as folder (folder)}
          <li>
            <span>{folder}</span>
            <Button
              on:click={() => handleRemove(folder)}
              noBorder
              icon="close" />
          </li>
        {/each}
      </ul>
      <span class="controlContainer" id="folder"><Button
          icon="folder"
          on:click={handleAdd}
          text={$_('add folders')} /></span>
    {/await}
  </article>
  <article>
    <SubHeading>{$_('locales')}</SubHeading>
    <label for="locale">{$_('current locale')}</label>
    <span class="controlContainer" id="locale"><Dropdown
        valueAsText="true"
        bind:value={currentLocale}
        options={localeOptions} /></span>
  </article>
</section>
