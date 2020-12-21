<script context="module">
  export const mediaSession =
    'mediaSession' in navigator ? navigator.mediaSession : null
</script>

<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'
  import { invoke, toDOMSrc } from '../../utils'
  import { current, playPrevious, playNext } from '../../stores/track-queue'

  let trackId = null
  let isFocused = false

  onMount(() => {
    const sub = current.subscribe(async track => {
      if (!track || track.id === trackId) {
        return
      }

      const unknown = $_('unknown')

      const { id, media, tags } = track
      const artist = tags.artists.length ? tags.artists[0] : unknown
      const title = tags.title || unknown
      const album = tags.album || unknown
      trackId = id

      if (!isFocused) {
        const notif = new Notification(title, {
          body: `${artist} - ${album}`,
          icon: toDOMSrc(media),
          silent: true
        })
        // TODO: when running on the web, focus the browser
        notif.onclick = () => invoke('core.focusWindow')
      }

      if (mediaSession) {
        const artwork = []
        if (media) {
          try {
            const data = await fetch(toDOMSrc(media))
            artwork.push({ src: URL.createObjectURL(await data.blob()) })
          } catch (err) {
            console.error(
              `failed to load media ${media} for mediaSession: ${err.message}`
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
