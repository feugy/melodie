<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'
  import MediaSelector from './MediaSelector.svelte'
  import { artistData } from '../Artist/Artist.testdata'
  import { mockWebsocket } from '../../atelier/utils'
  import {
    artistSuggestionsData,
    albumSuggestionsData
  } from './MediaSelector.testdata'
  import { isDesktop } from '../../stores/settings'
</script>

<ToolBox
  name="Components/Media Selector"
  props={{ desktop: true, open: true, src: artistData, forArtist: true }}
  events={['close', 'open', 'select']}
  setup={mockWebsocket(invoked => {
    if (invoked === 'media.findForArtist') {
      return artistSuggestionsData
    } else if (invoked === 'media.findForAlbum') {
      return albumSuggestionsData
    }
  })}
>
  <Tool name="Default" let:props let:handleEvent>
    {isDesktop.next(props.desktop) || ''}
    <MediaSelector {...props} on:close={handleEvent} on:open={handleEvent} />
  </Tool>

  <Tool name="For Album" props={{ forArtist: false }} let:props let:handleEvent>
    {isDesktop.next(props.desktop) || ''}
    <MediaSelector {...props} on:close={handleEvent} on:open={handleEvent} />
  </Tool>
</ToolBox>
