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

  .wrapper {
    height: 310px;
    width: 256px;
    display: inline-flex;
  }
</style>

<div class="wrapper">
  <Card.Card class="cursor-pointer">
    <div slot="title" on:click>
      <Card.Title
        class="text-left"
        title={src.name}
        subheader={Array.isArray(src.artists) && src.artists[0]} />
    </div>
    <div slot="media" class="media w-64 h-64" on:click>
      <Image src={toDOMSrc(src.image)} />
    </div>
  </Card.Card>
</div>
