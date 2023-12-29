<script>
  import { fade } from 'svelte/transition'
  import { _ } from 'svelte-intl'

  import {
    ExpandableList,
    ExpandableListConstants,
    Heading,
    TrackDetailsDialogue
  } from '../../components'
  import {
    albums,
    artists,
    current,
    search,
    total,
    tracks
  } from '../../stores/search'

  export let params
  let searched
  let openedTrack = null

  $: if (params.searched) {
    searched = decodeURIComponent(params.searched)
    if ($current !== searched) {
      search(searched)
    }
  }
</script>

<TrackDetailsDialogue
  src={openedTrack}
  open={openedTrack !== null}
  on:close={() => (openedTrack = null)}
/>

<div in:fade={{ duration: 200 }}>
  <Heading
    title={$_('results for _', { searched })}
    image={'../images/anthony-martino-6AtQNsjMoJo-unsplash.jpg'}
    imagePosition="bottom center"
  />
  {#if $total === 0}
    <section class="noResults">{$_('no results')}</section>
  {/if}
  <section>
    <ExpandableList
      kind={ExpandableListConstants.TRACKS}
      items={tracks}
      on:showDetails={({ detail: track }) => (openedTrack = track)}
    />
  </section>
  <section>
    <ExpandableList kind={ExpandableListConstants.ARTISTS} items={artists} />
  </section>
  <section>
    <ExpandableList kind={ExpandableListConstants.ALBUMS} items={albums} />
  </section>
</div>

<style>
  section {
    --at-apply: z-0 m-4 mt-0;
  }

  .noResults {
    --at-apply: text-2xl font-semibold;
  }
</style>
