<script>
  import { onMount, tick } from 'svelte'
  import { slide } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  // don't use destructuring to ease mocking
  import * as router from 'svelte-spa-router'
  import { Subject } from 'rxjs'
  import { debounceTime, filter } from 'rxjs/operators'
  import Sticky from '../Sticky/Sticky.svelte'
  import Button from '../Button/Button.svelte'
  import BroadcastButton from '../BroadcastButton/BroadcastButton.svelte'
  import TextInput from '../TextInput/TextInput.svelte'
  import Dialogue from '../Dialogue/Dialogue.svelte'
  import { invoke } from '../../utils'
  import {
    connected,
    isDesktop,
    settings,
    toggleBroadcast
  } from '../../stores/settings'
  import { tracks } from '../../stores/track-queue'
  import { screenSize, SM, MD } from '../../stores/window'

  const { location, push } = router

  export let isPlaylistOpen = false

  let menuOpen = false
  let address = null

  $: path = $location.split('/')[1]

  // searched text is the 3rd part: /search/text
  $: searched =
    path === 'search' ? decodeURIComponent($location.split('/')[2]) : ''

  $: isBroadcasting = $settings && $settings.isBroadcasting

  $: isLarge = $screenSize > MD

  $: isSmall = $screenSize === SM

  $: title = $_(
    path === 'search'
      ? 'results for _'
      : path === 'settings'
      ? path
      : `${path}s`,
    { searched }
  )

  $: if ($isDesktop && $connected) {
    invoke('settings.getUIAddress').then(uiAddress => {
      address = uiAddress
    })
  }

  let search$ = new Subject().pipe(
    debounceTime(250),
    filter(n => n.trim().length >= 2)
  )

  onMount(() => {
    const sub = search$.subscribe(text => {
      searched = text
      push(`/search/${searched}`)
    })

    return sub.unsubscribe.bind(sub)
  })

  function handleSearchKeyup({ key }) {
    if (key === 'Enter') {
      search$.next(searched)
      handleMenuClick()
    }
  }

  function handleSearchClick() {
    if (searched) {
      searched = ''
    }
  }

  async function handleBack() {
    handleMenuClick()
    await tick()
    window.history.back()
  }

  async function handleForward() {
    handleMenuClick()
    await tick()
    window.history.forward()
  }

  function handleMenuClick() {
    if (isSmall && menuOpen) {
      menuOpen = false
    }
  }
</script>

<style type="postcss">
  .bar {
    @apply w-full flex flex-row items-center p-2 gap-2;
    transition: background-color 0ms 260ms;
  }

  li {
    &.nav {
      @apply whitespace-no-wrap;
    }

    &.track-list {
      @apply flex-grow text-right;
    }
  }

  .menu {
    @apply w-full flex flex-col p-2 gap-2 items-start;
    background: var(--nav-bg-color);

    & > li {
      @apply w-full;
    }
  }

  .menuOpen {
    background: var(--nav-bg-color);
    transition: none;
  }

  .material-icons {
    @apply align-text-bottom;
  }

  @screen md {
    li {
      &.nav {
        order: 1;
      }

      &:nth-child(4) {
        order: 2;
      }
      &.expand {
        @apply flex-grow text-right;
        order: 2;
      }

      &:nth-child(5) {
        order: 4;
      }
      &.track-list {
        @apply flex-grow-0;
        order: 4;
      }
    }
  }
</style>

<Sticky let:floating>
  {#if isSmall}
    <ul class="bar {$$restProps.class}" class:menuOpen>
      <li>
        <Button
          on:click={() => (menuOpen = !menuOpen)}
          icon={menuOpen ? 'close' : 'menu'}
        />
      </li>
      <li>{floating ? title : ''}</li>
      <li class="track-list">
        <Button
          on:click={() => (isPlaylistOpen = !isPlaylistOpen)}
          icon="queue_music"
          primary={!isPlaylistOpen}
          badge={$tracks.length || null}
          noBorder
        />
      </li>
    </ul>
  {/if}
  {#if menuOpen || !isSmall}
    <ul
      class="{!isSmall ? 'bar' : 'menu'} {$$restProps.class}"
      transition:slide
    >
      <li>
        <Button
          on:click={() => {
            handleMenuClick()
            push('/album')
          }}
          class="w-full"
          text={isLarge || isSmall ? $_('albums') : undefined}
          icon="album"
          primary={floating && path === 'album'}
          noBorder={!isLarge}
        />
      </li>
      <li>
        <Button
          on:click={() => {
            handleMenuClick()
            push('/artist')
          }}
          class="w-full"
          text={isLarge || isSmall ? $_('artists') : undefined}
          icon="person"
          primary={floating && path === 'artist'}
          noBorder={!isLarge}
        />
      </li>
      <li id="to-playlists">
        <Button
          on:click={() => {
            handleMenuClick()
            push('/playlist')
          }}
          class="w-full"
          text={isLarge || isSmall ? $_('playlists') : undefined}
          icon="library_music"
          primary={floating && path === 'playlist'}
          noBorder={!isLarge}
        />
      </li>
      <li>
        {#if $isDesktop}
          {#if address && !isSmall}
            <BroadcastButton
              {isBroadcasting}
              {address}
              on:click={toggleBroadcast}
            />
          {/if}
        {:else if !$connected}
          <Dialogue title={$_('connection lost')} open noClose>
            <div slot="content">
              {@html $_('you are disconnected')}
            </div>
          </Dialogue>
        {/if}
      </li>
      <li>
        <Button
          class="w-full"
          on:click={() => {
            handleMenuClick()
            push('/settings')
          }}
          icon="settings"
          text={isSmall ? $_('settings') : undefined}
          primary={floating && path === 'settings'}
          noBorder
        />
      </li>
      <li class="expand">
        <TextInput
          class="{isSmall ? 'w-full' : 'w-48'} inline-block"
          type="search"
          icon={searched ? 'close' : 'search'}
          value={searched}
          on:input={({ target: { value } }) => search$.next(value)}
          on:keyup={handleSearchKeyup}
          on:iconClick={handleSearchClick}
        />
      </li>
      <li class="nav">
        <Button on:click={handleBack} icon="navigate_before" noBorder />
        <Button on:click={handleForward} icon="navigate_next" noBorder />
      </li>
      {#if !isSmall}
        <li class="track-list">
          <Button
            on:click={() => (isPlaylistOpen = !isPlaylistOpen)}
            icon="queue_music"
            primary={!isPlaylistOpen}
            badge={$tracks.length || null}
          />
        </li>
      {/if}
    </ul>
  {/if}
</Sticky>
