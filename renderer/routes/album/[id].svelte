<script>
  import { onDestroy } from 'svelte'
  import { _ } from 'svelte-intl'
  import { Heading, Image, Button } from '../../components'
  import { albums, loadTracks } from '../../stores/albums'
  import trackList from '../../stores/track-list'

  export let params = {}
  let album

  const subscription = albums.subscribe(albums => {
    album = albums.find(({ id }) => id === +params.id)
    if (album && !album.tracks) {
      loadTracks(album)
    }
  })

  function makePlayHandler(track) {
    return evt => {
      trackList.add(track, true)
      evt.stopImmediatePropagation()
    }
  }

  function makeEnqueueHandler(track) {
    return evt => {
      trackList.add(track)
      evt.stopImmediatePropagation()
    }
  }

  onDestroy(() => subscription.unsubscribe())
</script>

<style type="postcss">
  div {
    @apply z-0 relative m-6 mt-0;
  }

  section {
    height: 300px;
  }

  table {
    @apply w-full border-collapse mt-4;
  }

  thead {
    border-bottom: solid 2px var(--outline-color);
  }

  th,
  td {
    @apply p-3 text-left relative;
  }

  th {
    @apply font-semibold pt-0 pr-0 text-sm;
  }

  tbody tr:nth-child(2n + 1) {
    background-color: var(--hover-color);
  }

  tbody tr:hover {
    @apply cursor-pointer;
    background-color: var(--primary-color);
  }

  .play {
    @apply hidden absolute;
    top: 0.6rem;
    left: 0.6rem;
  }

  tbody tr:hover .play {
    @apply inline-block;
  }

  tbody tr:hover .rank {
    @apply hidden;
  }
</style>

{#if album}
  <Heading
    title={album.name}
    image={'../images/dark-rider-JmVaNyemtN8-unsplash.jpg'} />
  <div>
    <section>
      <Image class="w-auto h-full" src={album.media} />
    </section>
    {#if album.tracks}
      <table>
        <thead>
          <tr>
            <th>{$_('#')}</th>
            <th>{$_('track')}</th>
            <th>{$_('artist')}</th>
            <th>{$_('album')}</th>
          </tr>
        </thead>
        <tbody>
          {#each album.tracks as track, i (track.id)}
            <tr
              on:dblclick={makePlayHandler(track)}
              on:click={makeEnqueueHandler(track)}>
              <td>
                <span class="rank">{i + 1}</span>
                <span class="play">
                  <Button on:click={makePlayHandler(track)} icon="play_arrow" />
                </span>
              </td>
              <td>{track.tags.title}</td>
              <td>{track.tags.artists[0]}</td>
              <td>{track.tags.album}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
{/if}
