<svelte:options immutable={true} />

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
    SystemNotifier,
    TracksQueue,
    Tutorial
  } from './components'
  import { isListing } from './stores/albums'
  import * as queue from './stores/track-queue'
  import * as tutorial from './stores/tutorial'
  import { isLoading } from './stores/loading'
  import { screenSize, SM } from './stores/window'
  import { invoke } from './utils'
  import { autoScrollable } from './actions'
  import Router from './components/Router'

  let isPlaylistOpen = null
  let ready = false
  let scrollable
  let listingSubscription

  $: withClose = $screenSize === SM
  $: if (isPlaylistOpen === null && $screenSize) {
    isPlaylistOpen = !withClose
  }

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
    listingSubscription = isListing.subscribe(inProgress => {
      if (!inProgress && listingSubscription) {
        invoke('tracks.compare')
        listingSubscription.unsubscribe()
      }
    })
  })

  function handleNav() {
    if (isPlaylistOpen && withClose) {
      isPlaylistOpen = false
    }
  }
</script>

<style type="postcss">
  div {
    @apply flex flex-col h-full max-h-full;
  }

  main {
    @apply flex-grow overflow-y-auto z-0;
    background: var(--bg-color);
  }

  section {
    @apply text-center w-full overflow-auto;
  }

  aside {
    @apply overflow-y-auto h-full relative z-0;
    background: var(--bg-primary-color);
  }

  footer {
    background: var(--nav-bg-color);
    border-top: solid 2px var(--outline-color);
  }

  .progress {
    @apply absolute inset-x-0 top-0 z-10;
  }
</style>

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
      <Sheet bind:open={isPlaylistOpen} width={withClose ? '100%' : '30%'}>
        <section slot="main" bind:this={scrollable} use:autoScrollable>
          <Nav bind:isPlaylistOpen />
          <Router {scrollable} on:routeLoaded={handleNav} />
        </section>
        <aside slot="aside" id="queue" use:autoScrollable>
          <TracksQueue on:close={() => (isPlaylistOpen = false)} {withClose} />
        </aside>
      </Sheet>
    </main>
    <footer>
      <Player trackList={queue} />
    </footer>
  </div>
  <Tutorial />
  <Snackbar />
{/if}
