<script>
  import { tick } from 'svelte'
  import { fade } from 'svelte/transition'
  import { push } from 'svelte-spa-router'
  import { _, locales, locale } from 'svelte-intl'
  import {
    Heading,
    Button,
    SubHeading,
    Dropdown,
    TextInput
  } from '../components'
  import { invoke } from '../utils'

  export const params = {}
  let currentLocale = $locale ? { value: $locale, label: $_($locale) } : null
  let audiodbKey = ''
  let discogsToken = ''

  $: localeOptions = $locales.map(value => ({ value, label: $_(value) }))
  $: if (currentLocale && currentLocale.value !== $locale) {
    locale.set(currentLocale.value)
    invoke('settings.setLocale', currentLocale.value)
  }

  let settingsPromise
  getSettings()

  function getSettings() {
    settingsPromise = invoke('settings.get')
    settingsPromise.then(({ providers: { audiodb, discogs } }) => {
      audiodbKey = audiodb.key || ''
      discogsToken = discogs.token || ''
    })
  }

  async function handleAdd() {
    if (await invoke('settings.addFolders')) {
      push('/album')
    }
  }

  async function handleRemove(folder) {
    await invoke('settings.removeFolder', folder)
    getSettings()
  }

  async function handleSaveAudioDB(value) {
    audiodbKey = value
    await invoke('settings.setAudioDBKey', audiodbKey)
  }

  async function handleSaveDiscogs(value) {
    discogsToken = value
    await invoke('settings.setDiscogsToken', discogsToken)
  }
</script>

<style type="postcss">
  article {
    @apply text-left mx-8 mb-8;

    & > div {
      @apply text-sm my-4;
    }
  }

  li {
    @apply p-2 rounded-full mb-4 mr-4 inline-flex;
    background-color: var(--bg-primary-color);

    & > span {
      @apply px-4;
    }
  }

  .controlContainer {
    @apply inline-block;
  }

  label {
    @apply text-right inline-block;
    min-width: 180px;
  }

  :global(.settings-input) {
    @apply inline-block;
    width: 400px;
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
  <article>
    <SubHeading>{$_('audiodb.title')}</SubHeading>
    <div>
      {@html $_('audiodb.description')}
    </div>
    <label for="audiodb-key">{$_('audiodb.key')}</label>
    <span class="controlContainer" id="audiodb-key"><TextInput
        class="settings-input"
        placeholder={$_('audiodb.key placeholder')}
        value={audiodbKey}
        on:change={({ target: { value } }) => handleSaveAudioDB(value)} /></span>
  </article>
  <article>
    <SubHeading>{$_('discogs.title')}</SubHeading>
    <div>
      {@html $_('discogs.description')}
    </div>
    <label for="discogs-token">{$_('discogs.token')}</label>
    <span class="controlContainer" id="discogs-token"><TextInput
        class="settings-input"
        placeholder={$_('discogs.token placeholder')}
        value={discogsToken}
        on:change={({ target: { value } }) => handleSaveDiscogs(value)} /></span>
  </article>
</section>
