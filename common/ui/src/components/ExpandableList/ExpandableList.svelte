<script context="module">
  export const ARTISTS = 'artists'
  export const ALBUMS = 'albums'
  export const TRACKS = 'tracks'
</script>

<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'

  import { createClickToAddObservable } from '../../stores/track-queue'
  import Album from '../Album/Album.svelte'
  import Artist from '../Artist/Artist.svelte'
  import Button from '../Button/Button.svelte'
  import Track from '../Track/Track.svelte'

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
  $: componentProps = kind === TRACKS ? { withMenu: true } : {}
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
    list.style.flexWrap = expanded ? 'wrap' : 'nowrap'
    for (const item of list.children) {
      item.style.visibility = 'visible'
      if (!expanded) {
        if (!hasWrapped) {
          const { right } = item.getBoundingClientRect()
          if (right > _width) {
            hasWrapped = true
            item.style.visibility = 'hidden'
          }
        } else {
          item.style.visibility = 'hidden'
        }
      }
    }
  }

  onMount(() => (kind === TRACKS ? clicks$.subscribe() : null))
</script>

{#if $items && $items.length}
  <span class={$$restProps.class + ` ${kind}`} bind:clientWidth={_width}>
    <h3>{$_(title, { total: $items.length })}</h3>
    <group role="list" bind:this={list} class:expanded>
      {#each $items as src (src.id)}
        <button on:click={() => clicks$.next(src)}>
          <svelte:component
            this={Component}
            {src}
            {...componentProps}
            on:showDetails
          />
        </button>
      {/each}
    </group>
    {#if expanded}
      <Button
        text={$_('show less')}
        noBorder
        on:click={() => (expanded = false)}
      />
    {:else if hasWrapped}
      <Button
        text={$_('show all')}
        noBorder
        on:click={() => (expanded = true)}
      />
    {/if}
  </span>
{/if}

<style>
  span {
    --at-apply: inline-flex flex-col items-center text-left w-full
      overflow-x-hidden p-4;
  }

  h3 {
    --at-apply: text-3xl font-semibold mb-4 self-start;
  }

  group {
    --at-apply: flex list-none overflow-x-hidden w-full;

    & > button {
      --at-apply: m-4 text-center;
      flex: 1 1 0px;
    }
  }

  .tracks button {
    --at-apply: cursor-pointer;
    min-width: 250px;
  }
</style>
