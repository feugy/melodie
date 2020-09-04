<script>
  import { onMount, tick } from 'svelte'
  import { _ } from 'svelte-intl'
  import * as router from 'svelte-spa-router'
  import { Subject } from 'rxjs'
  import { debounceTime, filter } from 'rxjs/operators'
  import Button from '../Button/Button.svelte'
  import TextInput from '../TextInput/TextInput.svelte'

  let sentinel
  let floating = false
  let searched = ''
  let search$ = new Subject().pipe(
    filter(n => n.trim().length >= 2),
    debounceTime(250)
  )

  onMount(() => {
    const observer = new IntersectionObserver(entries => {
      floating = !entries[0].isIntersecting
    })

    const sub = search$.subscribe(text => {
      searched = text
      router.push(`/search/${searched}`)
    })

    observer.observe(sentinel)
    return () => {
      observer.unobserve(sentinel)
      sub.unsubscribe()
    }
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
  .wrapper {
    @apply inline;
  }

  .sentinel {
    @apply block w-full h-0 relative;
    top: 4rem;
  }

  .floating {
    transition: background ease-in-out 200ms;
    background: var(--nav-bg-color);
  }

  nav {
    @apply p-2 sticky w-full top-0;
    z-index: 1;
    margin-bottom: -60px;
  }

  ul {
    @apply w-full flex flex-row items-center;
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

  h1 {
    @apply m-0 mr-2;
  }
</style>

<div class="wrapper">
  <span bind:this={sentinel} class="sentinel" />
  <nav class={$$props.class} class:floating>
    <ul>
      <li>
        <h1>{$_('Mélodie')}</h1>
      </li>
      <li>
        <Button on:click={handleBack} icon="navigate_before" noBorder />
        <Button on:click={handleForward} icon="navigate_next" noBorder />
      </li>
      <li>
        <Button
          on:click={() => router.push('/album')}
          text={$_('albums')}
          icon="album" />
      </li>
      <li>
        <Button
          on:click={() => router.push('/artist')}
          text={$_('artists')}
          icon="person" />
      </li>
      <li>
        <Button
          on:click={() => router.push('/playlist')}
          text={$_('playlists')}
          icon="library_music" />
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
        <Button
          on:click={() => router.push('/settings')}
          icon="settings"
          noBorder />
      </li>
      <li />
    </ul>
  </nav>
</div>
