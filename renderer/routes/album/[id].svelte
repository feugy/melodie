<script>
  import { onDestroy } from 'svelte'
  import { _ } from 'svelte-intl'
  import { Heading, Image, Button, TracksTable } from '../../components'
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

  onDestroy(() => subscription.unsubscribe())
</script>

<style type="postcss">
  div {
    @apply z-0 relative m-6 mt-0;
  }

  section {
    @apply flex flex-row items-end;
    height: 300px;
  }

  section > span {
    font-size: 0;
  }
</style>

{#if album}
  <Heading
    title={album.name}
    image={'../images/dark-rider-JmVaNyemtN8-unsplash.jpg'} />
  <div>
    <section>
      <Image class="w-auto h-full" src={album.media} />
      <span>
        <Button
          class="ml-4"
          on:click={track => trackList.add(album.tracks, true)}
          icon="play_arrow"
          text={$_('play all')} />
        <Button
          class="ml-4"
          on:click={track => trackList.add(album.tracks)}
          icon="playlist_add"
          text={$_('enqueue all')} />
      </span>
    </section>
    <TracksTable
      tracks={album.tracks}
      on:play={({ detail }) => trackList.add(detail, true)}
      on:enqueue={({ detail }) => trackList.add(detail)} />
  </div>
{/if}
