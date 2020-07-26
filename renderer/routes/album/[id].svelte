<script>
  import { onDestroy } from 'svelte'
  import { Heading } from '../../components'
  import { albums } from '../../stores/albums'

  export let params = {}
  let album

  const subscription = albums.subscribe(albums => {
    album = albums.find(({ id }) => id === +params.id)
  })
  onDestroy(() => subscription.unsubscribe())
</script>

{#if album}
  <Heading
    title={album.name}
    image={'../images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg'} />
{/if}
