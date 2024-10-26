<script context="module">
  export const mediaSession =
    'mediaSession' in navigator ? navigator.mediaSession : null
</script>

<script>
  import { onMount } from 'svelte'
  import { _ } from 'svelte-intl'

  import { isDesktop } from '../../stores/settings'
  import { current, playNext, playPrevious } from '../../stores/track-queue'
  import { enhanceUrl, invoke } from '../../utils'

  let trackId = null
  let isFocused = false
  let supportsNotification = true
  $: isInDesktop = $isDesktop

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
      const icon = enhanceUrl(media)

      if (!isFocused && supportsNotification) {
        try {
          const notif = new Notification(title, {
            body: `${artist} - ${album}`,
            icon,
            silent: true
          })
          if (isInDesktop) {
            notif.onclick = () => invoke('core.focusWindow')
          }
        } catch (err) {
          if (err instanceof TypeError) {
            // on Android, we get the following error:
            // Failed to construct 'Notification': Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead.
            supportsNotification = false
          } else {
            throw err
          }
        }
      }

      if (mediaSession) {
        const artwork = []
        if (icon) {
          try {
            const data = await fetch(icon)
            artwork.push({ src: URL.createObjectURL(await data.blob()) })
          } catch (err) {
            console.error(
              `failed to load media ${icon} for mediaSession: ${err.message}`
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
  on:blur={() => (isFocused = false)}
/>
