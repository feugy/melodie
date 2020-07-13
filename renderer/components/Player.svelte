<script>
  import { createEventDispatcher } from 'svelte'
  import { Button, Menu } from 'smelte'
  import { _ } from 'svelte-intl'
  import trackList from '../stores/track-list'
  import Tags from './Tags.svelte'
  import { toDOMSrc } from '../utils'

  let open = false
  const dispatch = createEventDispatcher()
  const items = [
    {
      id: 'open',
      text: $_('open playlist'),
      onChange: function () {
        dispatch('openPlaylist')
      }
    },
    {
      id: 'clear',
      text: $_('clear'),
      onChange: function () {
        trackList.clear()
      }
    }
  ]

  function handleSelectMenuItem({ detail: itemId }) {
    items.find(({ id }) => itemId === id).onChange()
  }
</script>

<style>
  audio {
    outline: none;
  }
</style>

<div class="flex items-center">
  <audio
    autoplay
    controls
    src={$trackList.current && toDOMSrc($trackList.current.path)} />
  <Button
    on:click={() => trackList.previous()}
    text
    light
    flat
    icon="skip_previous"
    title={$_('previous')} />
  <Button
    on:click={() => trackList.next()}
    text
    light
    flat
    icon="skip_next"
    title={$_('next')} />
  <span class="flex-grow">
    {#if $trackList.current}
      <Tags src={$trackList.current.tags} media={$trackList.current.media} />
    {/if}
  </span>
  <Menu
    bind:open
    {items}
    listClasses="absolute w-auto whitespace-no-wrap bottom-0 right-0 mb-12
    bg-white rounded elevation-3 z-20 dark:bg-dark-500"
    on:change={handleSelectMenuItem}>
    <div slot="activator">
      <Button
        text
        light
        flat
        icon="more_vert"
        on:click={() => (open = !open)} />
    </div>
  </Menu>
</div>
