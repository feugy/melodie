<script>
  import { Tool } from '@atelier-wb/svelte'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import { playlistsData } from '../../components/AddToPlaylist/AddToPlaylist.testdata'
  import { disksData } from '../../components/DisksList/DisksList.testdata'
  import Component from './[id].svelte'

  const album = {
    id: 1,
    name: 'Cowboy Bebop - Blue',
    trackIds: disksData.map(({ id }) => id),
    refs: [
      [1, 'Yoko Kano'],
      [2, 'The Seatbelts']
    ],
    tracks: disksData,
    media: 'cover.jpg'
  }
</script>

<Tool
  name="Views/Album Details"
  props={{ params: { id: album.id } }}
  setup={mockWebsocket(invoked =>
    invoked === 'tracks.list'
      ? {
          total: playlistsData.length,
          size: playlistsData.length,
          from: 0,
          results: playlistsData
        }
      : invoked === 'media.findForAlbum'
        ? [
            {
              cover:
                'https://www.theaudiodb.com/images/media/album/thumb/swxywp1367234202.jpg'
            },
            {
              cover:
                'https://img.discogs.com/eTfvDOHIvDIHuMFHv28H6_MG-b0=/fit-in/500x505/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-3069838-1466508617-4579.jpeg.jpg'
            },
            {
              cover:
                'https://img.discogs.com/hp9V11cwfD4e4lWid6zV5j8P-g8=/fit-in/557x559/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-5589468-1397410589-8616.jpeg.jpg'
            },
            {
              cover:
                'https://img.discogs.com/QpNOv7TPg9VIkdbCYKqEtNbCN04=/fit-in/600x595/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-2898241-1306263310.jpeg.jpg'
            }
          ]
        : album
  )}
  let:props
>
  <HRefSink><Component {...props} /></HRefSink>
</Tool>
