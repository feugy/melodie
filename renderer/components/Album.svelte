<script>
  import { Card, Image } from 'smelte'
  import Tags from './Tags.svelte'
  import { toDOMSrc } from '../utils'

  export let src
  let open = false
</script>

<style>
  .media {
    /* disable ugly bottom padding on cards who don't have description */
    font-size: 0;
  }
</style>

<Card.Card class="cursor-pointer">
  <div slot="title" on:click>
    <Card.Title
      class="text-left"
      title={src.title}
      subheader={Array.isArray(src.artists) && src.artists[0]} />
  </div>
  <div slot="media" class="media w-64 h-64" on:click>
    <Image src={toDOMSrc(src.cover)} />
  </div>
</Card.Card>
