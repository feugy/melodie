<script>
  import QRCode from 'qrcode'
  import { onMount } from 'svelte'
  import { VERSION } from 'svelte/compiler'
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
    isDesktop,
    askToAddFolder,
    saveEnqueueBehaviour,
    saveDiscogsToken,
    saveAudioDBKey,
    saveBroadcastPort,
    removeFolder,
    saveLocale
  } from '../stores/settings'
  import { totpUrl } from '../stores/totp'
  import { invoke } from '../utils'

  export const params = {}
  let currentLocale = $locale ? { value: $locale, label: $_($locale) } : null
  let versions = []
  let totpCanvas

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
  $: if ($totpUrl && totpCanvas) {
    QRCode.toCanvas(totpCanvas, $totpUrl, {
      errorCorrectionLevel: 'Q',
      margin: 0.5,
      scale: 4
    })
  }

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
        src: 'icons/icon-512x512.png'
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
        label: 'WindiCSS',
        value: WINDICSS_VERSION,
        src: 'images/windicss-logo.png'
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

<style lang="postcss">
  article {
    @apply text-left m-4 mt-0;

    & .instructions {
      @apply text-sm my-4;
    }

    & p {
      @apply mb-4;
    }
  }

  :global(label > .material-icons) {
    font-size: 1em;
    vertical-align: -0.15rem;
  }

  li {
    @apply p-2 rounded-full mb-4 mr-4 inline-flex items-center;
    font-size: 1.3rem;
    background-color: var(--bg-primary-color);

    & > span {
      @apply px-4;
    }
  }

  .controlContainer {
    @apply inline-block md:ml-4;
  }

  label {
    @apply block md:text-right md:inline-block md:min-w-180px align-top;
  }

  :global(.settings-input) {
    @apply inline-block md:w-400px;
  }

  .version-container {
    @apply flex flex-wrap justify-center gap-8 m-4;

    & > div {
      @apply rounded shadow-lg w-32 whitespace-nowrap;
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
    imagePosition="center 65%"
  />
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
    {#if $isDesktop}
      <span class="controlContainer" id="folder"
        ><Button
          icon="folder"
          on:click={askToAddFolder}
          text={$_('add folders')}
        /></span
      >
    {/if}
  </article>
  <article>
    <SubHeading>{$_('interface settings')}</SubHeading>
    <p>
      <label for="locale">{$_('locale')}</label>
      <span class="controlContainer" id="locale"
        ><Dropdown
          valueAsText="true"
          bind:value={currentLocale}
          options={localeOptions}
        /></span
      >
    </p>
    <p>
      <label for="play-behaviour">{@html $_('play now behaviour')}</label>
      <span class="controlContainer" id="play-behaviour"
        ><Dropdown
          valueAsText="true"
          bind:value={play}
          options={playOptions}
          on:select={handleSaveEnqueueBehaviour}
        /></span
      >
    </p>
    <p>
      <label for="click-behaviour">{$_('simple click behaviour')}</label>
      <span class="controlContainer" id="click-behaviour"
        ><Dropdown
          valueAsText="true"
          bind:value={simpleClick}
          options={clickOptions}
          on:select={handleSaveEnqueueBehaviour}
        /></span
      ><span>{$_('double click behaviour', { action: doubleClick.label })}</span
      >
    </p>
  </article>
  <article>
    <SubHeading>{$_('audiodb.title')}</SubHeading>
    <div class="instructions">
      {@html $_('audiodb.description')}
    </div>
    <label for="audiodb-key">{$_('audiodb.key')}</label>
    <span class="controlContainer" id="audiodb-key"
      ><TextInput
        class="settings-input"
        placeholder={$_('audiodb.key placeholder')}
        value={$settings.providers.audiodb.key || ''}
        on:change={({ target: { value } }) => saveAudioDBKey(value)}
      /></span
    >
  </article>
  <article>
    <SubHeading>{$_('discogs.title')}</SubHeading>
    <div class="instructions">
      {@html $_('discogs.description')}
    </div>
    <label for="discogs-token">{$_('discogs.token')}</label>
    <span class="controlContainer" id="discogs-token"
      ><TextInput
        class="settings-input"
        placeholder={$_('discogs.token placeholder')}
        value={$settings.providers.discogs.token || ''}
        on:change={({ target: { value } }) => saveDiscogsToken(value)}
      /></span
    >
  </article>
  {#if $isDesktop}
    <article>
      <SubHeading>{$_('broadcasting')}</SubHeading>
      <p>
        <label for="broadcast-port">{$_('broadcast port')}</label>
        <span class="controlContainer" id="broadcast-port"
          ><TextInput
            class="settings-input"
            placeholder={$_('broadcast port placeholder')}
            value={$settings.broadcastPort}
            type="number"
            on:change={({ target: { value } }) =>
              saveBroadcastPort(value || null)}
          /></span
        >
        <span class="instructions">{$_('restart to apply')}</span>
      </p>
      <p>
        <label for="totp">{$_('totp key')}</label>
        <span class="controlContainer">
          <canvas bind:this={totpCanvas} />
        </span>
      </p>
    </article>
  {/if}
  <article>
    <SubHeading>{$_('about')}</SubHeading>
    <div class="instructions">
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
        <span
          >{$_('photos by')}{#each photographers as { href, label }, i}
            {i > 0 ? ', ' : ' '}<a {href} class="underlined whitespace-nowrap"
              >{label}
              <i class="material-icons">launch</i></a
            >
          {/each}
          {$_('on unsplash')}</span
        >
      </p>
      <p>
        <span>{@html $_('using material design icons')}</span>
      </p>
    </div>
  </article>
</section>
