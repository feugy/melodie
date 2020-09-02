<script>
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'
  import {
    Heading,
    ExpandableList,
    ExpandableListConstants
  } from '../../components'
  import {
    artists,
    albums,
    tracks,
    search,
    total,
    current
  } from '../../stores/search'

  export let params
  let searched

  $: if (params.searched) {
    searched = decodeURIComponent(params.searched)
    if ($current !== searched) {
      search(searched)
    }
  }
</script>

<style type="postcss">
  section {
    @apply z-0 mx-8 mb-8;
  }

  .noResults {
    @apply text-2xl font-semibold;
  }
</style>

<div in:fade={{ duration: 200 }}>
  <Heading
    title={$_('results for _', { searched })}
    image={'../images/anthony-martino-6AtQNsjMoJo-unsplash.jpg'}
    imagePosition="bottom center" />
  {#if $total === 0}
    <section class="noResults">{$_('no results')}</section>
  {/if}
  <section>
    <ExpandableList kind={ExpandableListConstants.TRACKS} items={tracks} />
  </section>
  <section>
    <ExpandableList kind={ExpandableListConstants.ARTISTS} items={artists} />
  </section>
  <section>
    <ExpandableList kind={ExpandableListConstants.ALBUMS} items={albums} />
  </section>
</div>
