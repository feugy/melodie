<script>
  import { onMount, tick } from 'svelte'
  import { _, locale } from 'svelte-intl'
  import { replace } from 'svelte-spa-router'
  import {
    Progress,
    Player,
    Nav,
    Sheet,
    Snackbar,
    SortableListConstants,
    SystemNotifier,
    TracksQueue,
    Tutorial
  } from './components'
  import * as queue from './stores/track-queue'
  import * as tutorial from './stores/tutorial'
  import { isLoading } from './stores/loading'
  import { invoke } from './utils'
  import { autoScrollable } from './actions'
  import Router from './components/Router'

  let isPlaylistOpen = true
  let ready = false
  let scrollable
  const { isMoveInProgress } = SortableListConstants

  onMount(async () => {
    const settings = await invoke('settings.get')
    locale.set(settings.locale)
    // await on locale to be set before rendering
    ready = true
    if (settings.openCount < 20 && !settings.folders.length) {
      await tick()
      replace('/settings')
      tutorial.start()
    }
  })
</script>

<style class="postcss">
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
        <section
          slot="main"
          bind:this={scrollable}
          use:autoScrollable={{ enabled: $isMoveInProgress }}>
          <Nav />
          <Router {scrollable} />
        </section>
        <aside
          slot="aside"
          id="queue"
          use:autoScrollable={{ enabled: $isMoveInProgress }}>
          <TracksQueue />
        </aside>
      </Sheet>
    </main>
    <footer>
      <Player trackList={queue} bind:isPlaylistOpen />
    </footer>
  </div>
  <Tutorial />
  <Snackbar />
{/if}
