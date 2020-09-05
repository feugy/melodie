<script>
  import { onMount } from 'svelte'
  import { _, locale } from 'svelte-intl'
  import Router from 'svelte-spa-router'
  import {
    Progress,
    Player,
    Nav,
    Sheet,
    SystemNotifier,
    TracksQueue
  } from './components'
  import * as queue from './stores/track-queue'
  import { isLoading } from './stores/loading'
  import { invoke } from './utils'
  import { routes } from './routes'

  let isPlaylistOpen = true
  let ready = false

  onMount(async () => {
    locale.set(await invoke('settingsManager.getLocale'))
    invoke('settingsManager.compareAndWatch')
    // await on locale to be set before rendering
    ready = true
  })
</script>

<style class="postcss">
  :global(body) {
    @apply p-0 m-0;
  }

  div {
    @apply flex flex-col h-full max-h-full;
  }

  main {
    @apply flex-grow overflow-y-auto z-0;
    background: var(--bg-color);
  }

  section {
    @apply text-center w-full overflow-auto pb-10;
  }

  aside {
    @apply overflow-y-auto h-full relative z-0;
    background: var(--bg-primary-color);
  }

  footer {
    @apply p-4;
    background: var(--nav-bg-color);
    border-top: solid 2px var(--outline-color);
  }

  .progress {
    @apply absolute inset-x-0 top-0 z-10;
  }
</style>

<svelte:options immutable={true} />

<svelte:head>
  <title>{$_('Mélodie')}</title>
</svelte:head>

<SystemNotifier />
{#if $isLoading}
  <span class="progress">
    <Progress />
  </span>
{/if}
{#if ready}
  <div>
    <main>
      <Sheet bind:open={isPlaylistOpen}>
        <section slot="main">
          <Nav />
          <Router {routes} />
        </section>
        <aside slot="aside">
          <TracksQueue />
        </aside>
      </Sheet>
    </main>
    <footer>
      <Player trackList={queue} bind:isPlaylistOpen />
    </footer>
  </div>
{/if}
