<script context="module">
  export const ARTISTS = 'artists'
  export const ALBUMS = 'albums'
  export const TRACKS = 'tracks'
</script>

<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import Artist from '../Artist/Artist.svelte'
  import Album from '../Album/Album.svelte'
  import Track from '../Track/Track.svelte'
  import Button from '../Button/Button.svelte'
  import { createClickToAddObservable } from '../../stores/track-queue'

  export let items
  export let kind
  // width is only exposed for unit testing. don't mess with it!
  export let _width = 0

  let hasWrapped = false
  let expanded = false
  let list
  const clicks$ = createClickToAddObservable()

  $: if (kind !== ARTISTS && kind !== ALBUMS && kind !== TRACKS) {
    throw new Error(
      `unsupported kind: ${kind}. Use either '${ARTISTS}', '${ALBUMS}' or '${TRACKS}'`
    )
  }
  $: isOne = $items && $items.length === 1
  $: Component = kind === ARTISTS ? Artist : kind === ALBUMS ? Album : Track
  $: title =
    kind === ARTISTS
      ? isOne
        ? 'an artist'
        : '_ artists'
      : kind === ALBUMS
      ? isOne
        ? 'an album'
        : '_ albums'
      : isOne
      ? 'a track'
      : '_ tracks'
  $: if ($items) {
    expanded = false
  }
  $: if (list) {
    hasWrapped = false
    for (const item of list.children) {
      item.classList.remove('wrapped')
      if (!hasWrapped) {
        const { right } = item.getBoundingClientRect()
        if (right > _width) {
          hasWrapped = true
          item.classList.add('wrapped')
        }
      } else {
        item.classList.add('wrapped')
      }
    }
  }

  onMount(() => (kind === TRACKS ? clicks$.subscribe() : null))
</script>

<style type="postcss">
  span {
    @apply inline-flex flex-col items-start text-left w-full overflow-x-hidden p-4;
  }

  h3 {
    @apply text-3xl font-semibold mb-4;
  }

  ul {
    @apply flex flex-row list-none overflow-x-hidden;
  }

  ul.expanded {
    @apply flex-wrap;
  }

  li {
    @apply m-4 cursor-pointer;
    flex: 1 1 0px;
    min-width: 250px;
  }

  :global(ul:not(.expanded) > li.wrapped) {
    visibility: hidden;
  }
</style>

{#if $items && $items.length}
  <span class={$$restProps.class} bind:clientWidth={_width}>
    <h3>{$_(title, { total: $items.length })}</h3>
    <ul bind:this={list} class:expanded>
      {#each $items as src (src.id)}
        <li on:click={() => clicks$.next(src)}>
          <svelte:component this={Component} {src} />
        </li>
      {/each}
    </ul>
    {#if expanded}
      <Button
        text={$_('show less')}
        noBorder
        on:click={() => (expanded = false)} />
    {:else if hasWrapped}
      <Button
        text={$_('show all')}
        noBorder
        on:click={() => (expanded = true)} />
    {/if}
  </span>
{/if}
