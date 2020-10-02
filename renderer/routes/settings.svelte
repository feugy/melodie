<script>
  import { VERSION } from 'svelte/compiler'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { _, locales, locale } from 'svelte-intl'
  import {
    Heading,
    Button,
    SubHeading,
    Dropdown,
    TextInput
  } from '../components'
  import {
    settings,
    askToAddFolder,
    saveEnqueueBehaviour,
    saveDiscogsToken,
    saveAudioDBKey,
    removeFolder,
    saveLocale
  } from '../stores/settings'
  import { invoke } from '../utils'

  export const params = {}
  let currentLocale = $locale ? { value: $locale, label: $_($locale) } : null
  let versions = []

  const photographers = [
    {
      href: 'https://unsplash.com/photos/6AtQNsjMoJo',
      label: 'Anthony Martino'
    },
    {
      href: 'https://unsplash.com/photos/YNJGB-_Vlgw',
      label: 'David Villasana'
    },
    { href: 'https://unsplash.com/photos/JmVaNyemtN8', label: 'Dark Rider' },
    { href: 'https://unsplash.com/photos/Vfvf3H-5OHc', label: 'Harry Swales' },
    {
      href: 'https://unsplash.com/photos/ASKeuOZqhYU',
      label: 'Jason Rosewell'
    },
    { href: 'https://unsplash.com/photos/slbOcNlWNHA', label: 'Larisa Birta' },
    { href: 'https://unsplash.com/photos/gpKe3hmIawg', label: 'Rima Kruciene' },
    {
      href: 'https://unsplash.com/photos/MEcxLZ8ENV8',
      label: 'Valentino Funghi'
    }
  ]
  const playOptions = [
    {
      value: true,
      label: $_('clears queue and plays')
    },
    {
      value: false,
      label: $_('enqueues and jumps')
    }
  ]
  const clickOptions = [
    {
      value: true,
      label: $_('enqueues track')
    },
    {
      value: false,
      label: $_('plays track')
    }
  ]

  $: localeOptions = $locales.map(value => ({ value, label: $_(value) }))
  $: if (currentLocale && currentLocale.value !== $locale) {
    locale.set(currentLocale.value)
    saveLocale(currentLocale.value)
  }
  $: play = playOptions.find(
    ({ value }) => value === $settings.enqueueBehaviour.clearBefore
  )
  $: simpleClick = clickOptions.find(
    ({ value }) => value === $settings.enqueueBehaviour.onClick
  )
  $: doubleClick = clickOptions.find(
    ({ value }) => value !== $settings.enqueueBehaviour.onClick
  )

  function handleSaveEnqueueBehaviour() {
    saveEnqueueBehaviour({
      onClick: simpleClick.value,
      clearBefore: play.value
    })
  }

  onMount(async () => {
    const data = await invoke('core.getVersions')
    versions = [
      {
        label: $_('Mélodie'),
        value: data.melodie,
        src: 'icon.png'
      },
      {
        label: 'Electron',
        value: data.electron,
        src: 'images/electron-logo.png'
      },
      {
        label: 'Svelte',
        value: VERSION,
        src: 'images/svelte-logo.png'
      },
      {
        label: 'Tailwind',
        value: TAILWINDCSS_VERSION,
        src: 'images/tailwindcss-logo.png'
      },
      {
        label: 'RxJS',
        value: RXJS_VERSION,
        src: 'images/rx-logo.png'
      },
      {
        label: 'SQLite',
        value: '3.26.0',
        src: 'images/sqlite-logo.png'
      }
    ]
  })
</script>

<style type="postcss">
  article {
    @apply text-left mx-8 mb-8;

    & > div {
      @apply text-sm my-4;
    }

    & > p {
      @apply mb-4;
    }
  }

  :global(label > .material-icons) {
    font-size: 1em;
    vertical-align: -0.15rem;
  }

  li {
    @apply p-2 rounded-full mb-4 mr-4 inline-flex;
    background-color: var(--bg-primary-color);

    & > span {
      @apply px-4;
    }
  }

  .controlContainer {
    @apply inline-block mx-4;
  }

  label {
    @apply text-right inline-block;
    min-width: 180px;
  }

  :global(.settings-input) {
    @apply inline-block;
    width: 400px;
  }

  .version-container {
    @apply flex flex-wrap justify-center gap-8 m-4;

    & > div {
      @apply rounded shadow-lg w-32 whitespace-no-wrap;
      background: var(--bg-primary-color);

      & > header {
        @apply px-4 pt-2;

        & > div:first-child {
          @apply font-bold text-lg;
        }
      }

      & > img {
        @apply w-full p-2;
      }
    }
  }
</style>

<section in:fade={{ duration: 200 }}>
  <Heading
    title={$_('settings')}
    image={'../images/rima-kruciene-gpKe3hmIawg-unsplash.jpg'}
    imagePosition="center 65%" />
  <article>
    <SubHeading>{$_('watched folders')}</SubHeading>
    <ul>
      {#each $settings.folders as folder (folder)}
        <li>
          <span>{folder}</span>
          <Button on:click={() => removeFolder(folder)} noBorder icon="close" />
        </li>
      {/each}
    </ul>
    <span class="controlContainer" id="folder"><Button
        icon="folder"
        on:click={askToAddFolder}
        text={$_('add folders')} /></span>
  </article>
  <article>
    <SubHeading>{$_('interface settings')}</SubHeading>
    <p>
      <label for="locale">{$_('locale')}</label>
      <span class="controlContainer" id="locale"><Dropdown
          valueAsText="true"
          bind:value={currentLocale}
          options={localeOptions} /></span>
    </p>
    <p>
      <label for="play-behaviour">{@html $_('play now behaviour')}</label>
      <span class="controlContainer" id="play-behaviour"><Dropdown
          valueAsText="true"
          bind:value={play}
          options={playOptions}
          on:select={handleSaveEnqueueBehaviour} /></span>
    </p>
    <p>
      <label for="click-behaviour">{$_('simple click behaviour')}</label>
      <span class="controlContainer" id="click-behaviour"><Dropdown
          valueAsText="true"
          bind:value={simpleClick}
          options={clickOptions}
          on:select={handleSaveEnqueueBehaviour} /></span><span>{$_(
          'double click behaviour',
          { action: doubleClick.label }
        )}</span>
    </p>
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
        value={$settings.providers.audiodb.key || ''}
        on:change={({ target: { value } }) => saveAudioDBKey(value)} /></span>
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
        value={$settings.providers.discogs.token || ''}
        on:change={({ target: { value } }) => saveDiscogsToken(value)} /></span>
  </article>
  <article>
    <SubHeading>{$_('about')}</SubHeading>
    <div>
      <p>
        {@html $_('build with love by')}
      </p>
      <p class="version-container">
        {#each versions as { label, value, src }}
          <div>
            <header>
              <div>{label}</div>
              <div>{value}</div>
            </header>
            <img {src} alt={label} />
          </div>
        {/each}
      </p>
      <p>
        <span>{$_('photos by')}{#each photographers as { href, label }, i}
            {i > 0 ? ', ' : ' '}<a
              {href}
              class="underlined whitespace-no-wrap">{label}
              <i class="material-icons">launch</i></a>
          {/each}
          {$_('on unsplash')}</span>
      </p>
    </div>
  </article>
</section>
