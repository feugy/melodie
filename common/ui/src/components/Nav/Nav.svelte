<script>
  import { Subject } from 'rxjs'
  import { debounceTime, filter } from 'rxjs/operators'
  import { onMount, tick } from 'svelte'
  import { slide } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  // don't use destructuring to ease mocking
  import * as router from 'svelte-spa-router'

  import {
    connected,
    isDesktop,
    settings,
    toggleBroadcast
  } from '../../stores/settings'
  import { tracks } from '../../stores/track-queue'
  import { MD, screenSize, SM } from '../../stores/window'
  import { invoke } from '../../utils'
  import BroadcastButton from '../BroadcastButton/BroadcastButton.svelte'
  import Button from '../Button/Button.svelte'
  import Sticky from '../Sticky/Sticky.svelte'
  import TextInput from '../TextInput/TextInput.svelte'

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

<Sticky let:floating>
  {#if isSmall}
    <ul class="bar {$$restProps.class}" class:menuOpen>
      <li>
        <Button
          on:click={() => (menuOpen = !menuOpen)}
          icon={menuOpen ? 'i-mdi-close' : 'i-mdi-menu'}
        />
      </li>
      <li>{floating ? title : ''}</li>
      <li class="track-list">
        <Button
          on:click={() => (isPlaylistOpen = !isPlaylistOpen)}
          icon="i-mdi-playlist-music"
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
          icon="i-mdi-album"
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
          icon="i-mdi-account"
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
          icon="i-mdi-music-box-multiple"
          primary={floating && path === 'playlist'}
          noBorder={!isLarge}
        />
      </li>
      <li>
        {#if $isDesktop && address && !isSmall}
          <BroadcastButton
            {isBroadcasting}
            {address}
            on:click={toggleBroadcast}
          />
        {/if}
      </li>
      <li>
        <Button
          class="w-full"
          on:click={() => {
            handleMenuClick()
            push('/settings')
          }}
          icon="i-mdi-cog"
          text={isSmall ? $_('settings') : undefined}
          primary={floating && path === 'settings'}
          noBorder
          data-testid="settings-link"
        />
      </li>
      <li class="expand">
        <TextInput
          class="{isSmall ? 'w-full' : 'w-48'} inline-block"
          type="search"
          icon={searched ? 'i-mdi-close' : 'i-mdi-magnify'}
          value={searched}
          on:input={({ target: { value } }) => search$.next(value)}
          on:keyup={handleSearchKeyup}
          on:iconClick={handleSearchClick}
        />
      </li>
      <li class="nav">
        <Button
          on:click={handleBack}
          icon="i-mdi-chevron-left"
          noBorder
          data-testid="backward-link"
        />
        <Button
          on:click={handleForward}
          icon="i-mdi-chevron-right"
          noBorder
          data-testid="forward-link"
        />
      </li>
      {#if !isSmall}
        <li class="track-list">
          <Button
            on:click={() => (isPlaylistOpen = !isPlaylistOpen)}
            icon="i-mdi-playlist-music"
            primary={!isPlaylistOpen}
            badge={$tracks.length || null}
          />
        </li>
      {/if}
    </ul>
  {/if}
</Sticky>

<style>
  .bar {
    --at-apply: w-full flex flex-row items-center p-2 gap-2;
    transition: background-color 0ms 260ms;
  }

  li {
    &.nav {
      /* prettier-ignore */
      --at-apply: whitespace-nowrap md:order-1;
    }

    &.track-list {
      --at-apply: flex-grow text-right;
    }

    &:nth-child(4) {
      /* prettier-ignore */
      --at-apply: md:order-2;
    }

    &:nth-child(5) {
      /* prettier-ignore */
      --at-apply: md:order-4;
    }

    &.expand {
      /* prettier-ignore */
      --at-apply: md:flex-grow md:text-right md:order-2 pl-4 md:pl-0;
    }

    &.track-list {
      /* prettier-ignore */
      --at-apply: md:flex-grow-0 md:order-4;
    }
  }

  .menu {
    --at-apply: w-full flex flex-col p-2 gap-2 items-start;
    background: var(--nav-bg-color);

    & > li {
      --at-apply: w-full;
    }
  }

  .menuOpen {
    background: var(--nav-bg-color);
    transition: none;
  }

  .icons {
    --at-apply: align-text-bottom;
  }
</style>
