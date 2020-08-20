<script context="module">
  export const mediaSession =
    'mediaSession' in navigator ? navigator.mediaSession : null
</script>

<script>
  const notifier = require('node-notifier')
  import { onMount } from 'svelte'
  import { filter } from 'rxjs/operators'
  import { toDOMSrc } from '../../utils'
  import { current, playPrevious, playNext } from '../../stores/track-queue'
  import MediaSelector from '../MediaSelector/MediaSelector.svelte'

  let trackId = null
  let isFocused = false

  onMount(() => {
    const sub = current.subscribe(async track => {
      if (!track || track.id === trackId) {
        return
      }

      const {
        id,
        media,
        tags: { title, artists, album }
      } = track
      const artist = artists.length ? artists[0] : null
      trackId = id

      if (!isFocused) {
        notifier.notify({
          title,
          message: `${artist} - ${album}`,
          icon: media
        })
      }

      if (mediaSession) {
        const artwork = []
        if (media) {
          try {
            const data = await fetch(toDOMSrc(track.media))
            artwork.push({ src: URL.createObjectURL(await data.blob()) })
          } catch (err) {
            console.error(
              `failed to load media ${track.media} for mediaSession: ${err.message}`
            )
          }
        }
        mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album,
          artwork
        })
      }
    })

    if (mediaSession) {
      mediaSession.setActionHandler('previoustrack', playPrevious)
      mediaSession.setActionHandler('nexttrack', playNext)
    }

    return () => {
      sub.unsubscribe()
      if (mediaSession) {
        mediaSession.setActionHandler('previoustrack', null)
        mediaSession.setActionHandler('nexttrack', null)
      }
    }
  })
</script>

<svelte:window
  on:focus={() => (isFocused = true)}
  on:blur={() => (isFocused = false)} />
