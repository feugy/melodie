<script>
  import { onMount, tick } from 'svelte'
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
  import {
    address,
    connected,
    isDesktop,
    settings,
    toggleBroadcast
  } from '../../stores/settings'

  const { location, push } = router

  // searched text is the 3rd part: /search/text
  $: searched = $location.startsWith('/search')
    ? decodeURIComponent($location.split('/')[2])
    : ''

  $: isBroadcasting = $settings && $settings.isBroadcasting

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
    }
  }

  function handleSearchClick() {
    if (searched) {
      searched = ''
    }
  }

  async function handleBack() {
    await tick()
    window.history.back()
  }

  async function handleForward() {
    await tick()
    window.history.forward()
  }
</script>

<style type="postcss">
  ul {
    @apply w-full flex flex-row items-center p-2 py-4;
  }

  li {
    @apply mx-2;
  }

  .expand {
    @apply flex-grow text-right;
  }

  .material-icons {
    @apply align-text-bottom;
  }
</style>

<Sticky>
  <ul class={$$restProps.class}>
    <li>
      <Button
        on:click={() => push('/album')}
        text={$_('albums')}
        icon="album" />
    </li>
    <li>
      <Button
        on:click={() => push('/artist')}
        text={$_('artists')}
        icon="person" />
    </li>
    <li id="to-playlists">
      <Button
        on:click={() => push('/playlist')}
        text={$_('playlists')}
        icon="library_music" />
    </li>
    <li>
      <Button on:click={handleBack} icon="navigate_before" noBorder />
      <Button on:click={handleForward} icon="navigate_next" noBorder />
    </li>
    <li class="expand">
      <TextInput
        class="w-48 inline-block"
        type="search"
        icon={searched ? 'close' : 'search'}
        value={searched}
        on:input={({ target: { value } }) => search$.next(value)}
        on:keyup={handleSearchKeyup}
        on:iconClick={handleSearchClick} />
    </li>
    <li>
      {#if $isDesktop}
        <BroadcastButton
          {isBroadcasting}
          address={$address}
          on:click={toggleBroadcast} />
      {:else if !$connected}
        <Dialogue title={$_('connection lost')} open noClose>
          <div slot="content">
            {@html $_('you are disconnected')}
          </div>
        </Dialogue>
      {/if}
    </li>
    <li>
      <Button on:click={() => push('/settings')} icon="settings" noBorder />
    </li>
  </ul>
</Sticky>
